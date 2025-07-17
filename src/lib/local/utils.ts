import { ISWINDOWS } from '$lib/utils';
import { convertFileSrc } from '@tauri-apps/api/core';
import { resolve } from '@tauri-apps/api/path';
import { copyFile, exists, writeFile } from '@tauri-apps/plugin-fs';
import { toast } from 'svelte-sonner';

/**
 * Helping function to copy assets to the workspace
 * @param files - files to be moved
 * @param assetsPath - path to the assets folder
 * @returns - Array of copied files
 */
export const moveFilesToAssets = async (files: string[], assetsPath: string) => {
	const copiedFiles: string[] = [];
	for (const file of files) {
		const fileName = file.split(ISWINDOWS ? '\\' : '/').pop();
		if (fileName === undefined) continue;
		const finalPath = await resolve(assetsPath, fileName);
		await copyFile(file, finalPath);
		const fileExists = await exists(finalPath);
		if (!fileExists) continue;
		copiedFiles.push(finalPath);
	}
	return copiedFiles;
};

export const createFile = async (file: File, path: string): Promise<string> => {
	const id = toast.loading(`Saving ${file.name} of ${file.size} bytes...`);
	const fileReader = new FileReader();

	// Construct the asset path
	const assetsPath = await resolve(path, file.name);

	// Create a promise to handle the asynchronous file writing
	return new Promise((resolve, reject) => {
		fileReader.onload = async () => {
			if (fileReader.result instanceof ArrayBuffer) {
				const binary = new Uint8Array(fileReader.result);
				try {
					await writeFile(assetsPath, binary);
					resolve(convertFileSrc(assetsPath));
					toast.success('File saved successfully!', { id });
				} catch (err) {
					toast.error('Error saving image!', { id });
					reject(`Error saving file: ${err}`);
				}
			}
		};
		fileReader.onerror = (err) => {
			toast.error('Error saving image!', { id });
			reject(`Error reading file: ${err}`);
		};
		fileReader.readAsArrayBuffer(file);
	});
};
