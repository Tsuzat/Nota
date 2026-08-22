import { toast } from "@nota/ui";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile, stat } from "@tauri-apps/plugin-fs";
import { client } from "#lib/orpc.ts";
import {
	type FileType,
	getFileTypeExtensions,
	getFileTypeFromExtension,
	ISWINDOWS,
} from "#lib/utils.ts";

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
		const { signedUrl, objectKey } = await client.storage.uploadFile({
			noteId,
			name: fileData.name,
			mimeType: fileData.mimeType,
			size: fileData.size,
		});

		// 2. Upload directly to Cloudflare R2
		const response = await fetch(signedUrl, {
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

		const publicUrl = signedUrl.split("?")[0];
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

export const onFileUpload = async (
	fileType: FileType,
	noteId: string,
): Promise<string | null> => {
	const extensions = getFileTypeExtensions(fileType);

	try {
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

		return await uploadFileToCloud(
			{
				name: fileName,
				mimeType,
				size: fileStat.size,
				body: fileBytes,
			},
			noteId,
		);
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
