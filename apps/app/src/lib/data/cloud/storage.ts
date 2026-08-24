import { toast } from "@nota/ui";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile, stat } from "@tauri-apps/plugin-fs";
import { fetch as fetchTauri } from "@tauri-apps/plugin-http";
import { client } from "#lib/orpc.js";
import {
	type FileType,
	getFileTypeExtensions,
	getFileTypeFromExtension,
	ISDESKTOP,
	ISWINDOWS,
} from "#lib/utils.js";

export const uploadFileToCloud = async (
	fileData: {
		name: string;
		mimeType: string;
		size: number;
		body: BodyInit;
	},
	noteId: string,
): Promise<string> => {
	const id = toast.loading(`Uploading ${fileData.name}...`);
	try {
		// 1. Get presigned URL
		const { signedUrl, objectKey, publicUrl } = await client.storage.uploadFile(
			{
				noteId,
				name: fileData.name,
				mimeType: fileData.mimeType,
				size: fileData.size,
			},
		);

		// 2. Upload directly to Cloudflare R2
		const fetchImpl = ISDESKTOP ? fetchTauri : fetch;
		const response = await fetchImpl(signedUrl, {
			method: "PUT",
			body: fileData.body,
			headers: {
				"Content-Type": fileData.mimeType,
			},
		});

		if (!response.ok) {
			throw new Error(`Upload failed: ${response.statusText}`);
		}

		// 3. Confirm upload and save to database
		await client.storage.confirm({
			noteId,
			name: fileData.name,
			mimeType: fileData.mimeType,
			size: fileData.size,
			path: objectKey,
		});

		toast.success("File uploaded successfully!", { id });
		return publicUrl;
	} catch (error) {
		toast.error(
			error instanceof Error ? error.message : "Error uploading file",
			{ id },
		);
		throw error;
	}
};

export const createFile = async (
	file: File,
	noteId: string,
): Promise<string> => {
	return await uploadFileToCloud(
		{
			name: file.name,
			mimeType: file.type || "application/octet-stream",
			size: file.size,
			body: file,
		},
		noteId,
	);
};

export interface UploadableFile {
	name: string;
	mimeType: string;
	size: number;
	body: BodyInit;
}

export const filePickerDesktop = async (
	fileType: FileType,
): Promise<UploadableFile | null> => {
	const extensions = getFileTypeExtensions(fileType);
	const filePath = await open({
		title: "Select File",
		multiple: false,
		directory: false,
		filters: [
			{
				name: "Select File",
				extensions,
			},
		],
	});

	if (!filePath || typeof filePath !== "string") return null;

	const fileName = filePath.split(ISWINDOWS() ? "\\" : "/").pop() || "file";
	const fileStat = await stat(filePath);
	const fileBytes = await readFile(filePath);
	const mimeType =
		getFileTypeFromExtension(fileName) || "application/octet-stream";

	return {
		name: fileName,
		mimeType,
		size: fileStat.size,
		body: fileBytes,
	};
};

export const filePickerWeb = (
	fileType: FileType,
): Promise<UploadableFile | null> => {
	return new Promise((resolve) => {
		const extensions = getFileTypeExtensions(fileType);
		const accept =
			extensions.length > 0
				? extensions.map((ext) => `.${ext}`).join(",")
				: fileType.includes("/")
					? fileType
					: "*/*";

		const input = document.createElement("input");
		input.type = "file";
		input.accept = accept;
		input.style.display = "none";

		input.onchange = () => {
			const file = input.files?.[0];
			input.remove();
			if (!file) {
				resolve(null);
				return;
			}
			const mimeType =
				file.type ||
				getFileTypeFromExtension(file.name) ||
				"application/octet-stream";
			resolve({
				name: file.name,
				mimeType,
				size: file.size,
				body: file,
			});
		};

		input.oncancel = () => {
			input.remove();
			resolve(null);
		};

		document.body.appendChild(input);
		input.click();
	});
};

export const onFileUpload = async (
	fileType: FileType,
	noteId: string,
): Promise<string | null> => {
	try {
		const fileData = ISDESKTOP
			? await filePickerDesktop(fileType)
			: await filePickerWeb(fileType);

		if (!fileData) return null;

		return await uploadFileToCloud(fileData, noteId);
	} catch (error) {
		console.error("Failed to upload file to cloud:", error);
		return null;
	}
};

export class CloudStorage {
	#workspaceId = $state<string>();
	#getWorkspaceId?: () => string | undefined;

	constructor(getWorkspaceId?: () => string | undefined) {
		this.#getWorkspaceId = getWorkspaceId;
	}

	get workspaceId(): string | undefined {
		return this.#getWorkspaceId ? this.#getWorkspaceId() : this.#workspaceId;
	}

	set workspaceId(value: string | undefined) {
		this.#workspaceId = value;
	}

	async upload(file: File, noteId: string) {
		return createFile(file, noteId);
	}

	async onFileUpload(fileType: FileType, noteId: string) {
		return onFileUpload(fileType, noteId);
	}
}
