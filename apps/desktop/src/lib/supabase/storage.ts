import { supabase } from '.';
import { readFile } from '@tauri-apps/plugin-fs';
import { basename } from '@tauri-apps/api/path';
import { FileType, getFileTypeExtensions, getFileTypeFromExtension } from '@nota/ui/edra/utils.js';
import { nanoid } from 'nanoid';
import { toast } from '@nota/ui/shadcn/sonner';
import { open } from '@tauri-apps/plugin-dialog';

/**
 * Uploads a file to the storage
 * @param id - user id
 * @param file - file to be uploaded
 * @returns public url of the uploaded file
 */
export async function uploadFile(id: string, file: File): Promise<string> {
  const path = `${id}/${file.type.split('/')[0]}/${nanoid(32)}`;
  const { data, error } = await supabase.storage.from('notes media').upload(path, file, {
    upsert: false,
  });
  if (error) {
    console.error(error);
    toast.error(error.message);
  }
  if (data) {
    const resp = supabase.storage.from('notes media').getPublicUrl(data.path);
    return resp.data.publicUrl;
  }
  throw new Error('Could not upload');
}

/**
 * Uploads a file to the storage by path
 * @param id - user id
 * @param path - path to the file
 * @returns public url of the uploaded file
 */
export async function uploadFileByPath(id: string, path: string): Promise<string> {
  const bytes = await readFile(path);
  const name = await basename(path);
  const extension = getFileTypeFromExtension(name);
  if (extension === FileType.UNKNOWN) {
    throw new Error('Unsupported file is being uploaded. Rejected the Upload.');
  }
  const file = new File([bytes], name, { type: extension });
  return await uploadFile(id, file);
}

/**
 * Uploads a file to the storage by opening a file dialog
 * @param id - user id
 * @param fileType - type of the file to be uploaded
 * @returns public url of the uploaded file or null if no file is selected
 */
export async function uploadLocalFile(id: string, fileType: FileType): Promise<string | null> {
  const extensions = getFileTypeExtensions(fileType);
  const file = await open({
    title: 'Select File',
    multiple: false,
    directory: false,
    filters: [
      {
        name: 'Select File',
        extensions,
      },
    ],
  });
  if (!file) return null;
  return await uploadFileByPath(id, file);
}

/**
 * Gets assets from the storage by file type
 * @param id - user id
 * @param fileType - type of the file
 * @returns array of public urls of the assets
 */
export async function getAssetsByFileType(id: string, fileType: FileType): Promise<string[]> {
  try {
    const path = `${id}/${fileType.split('/')[0]}`;
    console.log('PATH = ', path);
    const { data, error } = await supabase.storage.from('notes media').list(path);
    if (error) {
      console.error(error);
      toast.error(error.message);
      return [] as string[];
    }
    const urls = [];
    for (const file of data) {
      if (file.name === '.emptyFolderPlaceholder') continue;
      urls.push(supabase.storage.from('notes media').getPublicUrl(`${path}/${file.name}`).data.publicUrl);
    }
    return urls;
  } catch (error) {
    console.error(error);
    toast.error('Something went wrong when loading assets.');
    return [];
  }
}
