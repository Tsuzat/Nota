import { OS } from '$lib/contants';
import { convertFileSrc } from '@tauri-apps/api/core';
import { resolve } from '@tauri-apps/api/path';
import { writeFile } from '@tauri-apps/plugin-fs';

/**
 * Function to handle raw images from the file drop and save them in the assets folder
 * @param file File - File object to be handled
 * @param path string - Path of the workspace
 * @returns string - Path of the file
 */
export async function handleRawImage(file: File, path: string): Promise<string> {
	const fileReader = new FileReader();

	// Construct the asset path
	const assetsPath = await resolve(
		path + `${OS === 'windows' ? '\\' : '/'}assets` + `${OS === 'windows' ? '\\' : '/'}${file.name}`
	);

	// Create a promise to handle the asynchronous file writing
	return new Promise((resolve, reject) => {
		fileReader.onload = async () => {
			if (fileReader.result instanceof ArrayBuffer) {
				const binary = new Uint8Array(fileReader.result);
				try {
					await writeFile(assetsPath, binary);
					resolve(convertFileSrc(assetsPath));
				} catch (err) {
					reject(`Error saving file: ${err}`);
				}
			}
		};
		fileReader.onerror = (err) => {
			reject(`Error reading file: ${err}`);
		};
		fileReader.readAsArrayBuffer(file);
	});
}
