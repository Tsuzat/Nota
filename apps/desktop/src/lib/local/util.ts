import { type FileType, getFileTypeExtensions } from '@lib/components/edra/utils';
import { toast } from '@lib/components/ui/sonner';
import { convertFileSrc } from '@tauri-apps/api/core';
import { appDataDir, resolve } from '@tauri-apps/api/path';
import { open } from '@tauri-apps/plugin-dialog';
import { copyFile, exists, readDir, writeFile } from '@tauri-apps/plugin-fs';
import { ISWINDOWS } from '$lib/utils';

/**
 * Helping function to copy assets to the workspace
 * @param files - files to be moved
 * @returns - copied files
 */
export const moveFileToAssets = async (file: string) => {
  const assetsPath = await resolve(await appDataDir(), 'assets');
  const fileName = file.split(ISWINDOWS ? '\\' : '/').pop();
  if (fileName === undefined) throw new Error('Assets file is not supported');
  const finalPath = await resolve(assetsPath, fileName);
  await copyFile(file, finalPath);
  const fileExists = await exists(finalPath);
  if (!fileExists) throw new Error('Failed to move file to assets folder');
  return finalPath;
};

export const createFile = async (file: File): Promise<string> => {
  const id = toast.loading(`Saving ${file.name} of ${file.size} bytes...`);
  const fileReader = new FileReader();

  // Construct the asset path
  const assetsPath = await resolve(await appDataDir(), 'assets', file.name);

  // Create a promise to handle the asynchronous file writing
  return new Promise((res, reject) => {
    fileReader.onload = async () => {
      if (fileReader.result instanceof ArrayBuffer) {
        const binary = new Uint8Array(fileReader.result);
        try {
          await writeFile(assetsPath, binary);
          res(convertFileSrc(assetsPath));
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

export const getAssetsByFileType = async (fileType: FileType): Promise<string[]> => {
  const path = await resolve(await appDataDir(), 'assets');
  const dirEntries = await readDir(path);
  const extensions = getFileTypeExtensions(fileType);
  const files: string[] = [];
  for (const dirEntry of dirEntries) {
    if (!dirEntry.isFile) continue;
    const fileName = dirEntry.name;
    const fileExtension = fileName.split('.').pop();
    if (fileExtension !== undefined && extensions.includes(fileExtension)) {
      const filePath = await resolve(path, fileName);
      const src = convertFileSrc(filePath);
      files.push(src);
    }
  }
  return files;
};

export const selectLocalFile = async (fileType: FileType): Promise<string | null> => {
  const extensions = getFileTypeExtensions(fileType);
  const file = await open({
    title: 'Select Videos',
    multiple: false,
    directory: false,
    filters: [
      {
        name: 'Select Videos',
        extensions,
      },
    ],
  });
  if (!file) return null;
  const finalPath = await moveFileToAssets(file);
  return convertFileSrc(finalPath);
};
