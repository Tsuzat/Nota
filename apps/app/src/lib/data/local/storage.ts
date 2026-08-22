import { createAsset } from "@nota/db-local/data/assets";
import { toast } from "@nota/ui";
import { convertFileSrc } from "@tauri-apps/api/core";
import { appDataDir, resolve } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import {
	copyFile,
	exists,
	readDir,
	stat,
	writeFile,
} from "@tauri-apps/plugin-fs";
import { nanoid } from "nanoid";
import {
	type FileType,
	getFileTypeExtensions,
	getFileTypeFromExtension,
	ISWINDOWS,
} from "#lib/utils.ts";

/**
 * Helping function to copy assets to the workspace
 * @param file - file path to be moved
 * @param noteId - note id to associate the asset with
 * @returns - copied file path
 */
export const moveFileToAssets = async (file: string, noteId: string) => {
	const assetsPath = await resolve(await appDataDir(), "assets");
	const fileName = file.split(ISWINDOWS() ? "\\" : "/").pop();
	if (fileName === undefined) throw new Error("Assets file is not supported");
	const randomString = nanoid(10);
	const finalPath = await resolve(assetsPath, `${randomString}-${fileName}`);
	await copyFile(file, finalPath);
	const fileExists = await exists(finalPath);
	if (!fileExists) throw new Error("Failed to move file to assets folder");

	const fileStat = await stat(finalPath);
	const mimeType =
		getFileTypeFromExtension(fileName) || "application/octet-stream";

	await createAsset({
		noteId,
		name: fileName,
		mimeType,
		size: fileStat.size,
	});

	return finalPath;
};

export const createFile = async (
	file: File,
	noteId: string,
): Promise<string> => {
	const id = toast.loading(`Saving ${file.name} of ${file.size} bytes...`);
	const fileReader = new FileReader();

	// get the random string
	const randomString = nanoid(10);
	// Construct the asset path
	const assetsPath = await resolve(
		await appDataDir(),
		"assets",
		`${randomString}-${file.name}`,
	);

	// Create a promise to handle the asynchronous file writing
	return new Promise((res, reject) => {
		fileReader.onload = async () => {
			if (fileReader.result instanceof ArrayBuffer) {
				const binary = new Uint8Array(fileReader.result);
				try {
					await writeFile(assetsPath, binary);

					await createAsset({
						noteId,
						name: file.name,
						mimeType: file.type || "application/octet-stream",
						size: file.size,
					});

					res(convertFileSrc(assetsPath));
					toast.success("File saved successfully!", { id });
				} catch (err) {
					toast.error("Error saving image!", { id });
					reject(`Error saving file: ${err}`);
				}
			}
		};
		fileReader.onerror = (err) => {
			toast.error("Error saving image!", { id });
			reject(`Error reading file: ${err}`);
		};
		fileReader.readAsArrayBuffer(file);
	});
};

export const getAssetsByFileType = async (
	fileType: FileType,
): Promise<string[]> => {
	const path = await resolve(await appDataDir(), "assets");
	const dirEntries = await readDir(path);
	const extensions = getFileTypeExtensions(fileType);
	const files: string[] = [];
	for (const dirEntry of dirEntries) {
		if (!dirEntry.isFile) continue;
		const fileName = dirEntry.name;
		const fileExtension = fileName.split(".").pop();
		if (fileExtension !== undefined && extensions.includes(fileExtension)) {
			const filePath = await resolve(path, fileName);
			const src = convertFileSrc(filePath);
			files.push(src);
		}
	}
	return files;
};

export const onFileUpload = async (
	fileType: FileType,
	noteId: string,
): Promise<string | null> => {
	const extensions = getFileTypeExtensions(fileType);
	const file = await open({
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
	if (!file) return null;
	const finalPath = await moveFileToAssets(file, noteId);
	return convertFileSrc(finalPath);
};
