import { ISWINDOWS } from '$lib/utils';
import { resolve } from '@tauri-apps/api/path';
import { copyFile, exists } from '@tauri-apps/plugin-fs';

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
