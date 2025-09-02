import { toast } from 'svelte-sonner';
import { supabase } from '.';
import { readFile } from '@tauri-apps/plugin-fs';
import { basename } from '@tauri-apps/api/path';
import { FileType, getFileTypeFromExtension } from '$lib/utils';
import { nanoid } from 'nanoid';

export async function uploadFile(id: string, file: File): Promise<string> {
	const path = `${id}/${nanoid(32)}`;
	const { data, error } = await supabase.storage.from('notes media').upload(path, file, {
		upsert: false
	});
	if (error) {
		console.error(error);
		toast.error(error.message);
	}
	if (data) {
		const resp = supabase.storage.from('notes media').getPublicUrl(data.path);
		return resp.data.publicUrl;
	} else {
		throw new Error('Could not upload');
	}
}

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

export async function getAssetsByFileType(id: string, fileType: FileType): Promise<string[]> {
	try {
		const { data, error } = await supabase.storage.from('notes media').list(id);
		if (error) {
			console.error(error);
			toast.error(error.message);
			return [] as string[];
		} else {
			const urls = [];
			for (const file of data) {
				const fileMimetype = file.metadata['mimetype'];
				if (fileMimetype && matchesFileType(fileMimetype, fileType)) {
					urls.push(
						supabase.storage.from('notes media').getPublicUrl(`${id}/${file.name}`).data.publicUrl
					);
				}
			}
			return urls;
		}
	} catch (error) {
		console.error(error);
		toast.error('Something went wrong when loading assets.');
		return [];
	}
}

/**
 * Helper function to check if a mimetype matches a FileType
 * @param mimetype - The actual mimetype from file metadata (e.g., 'image/png', 'video/mp4')
 * @param fileType - The FileType enum value to match against (e.g., FileType.IMAGE)
 * @returns boolean indicating if the mimetype matches the file type category
 */
function matchesFileType(mimetype: string, fileType: FileType): boolean {
	if (fileType === FileType.UNKNOWN) {
		return false;
	}

	// Extract the category from the FileType enum (e.g., 'image' from 'image/*')
	const categoryPattern = fileType.replace('/*', '');

	// Check if the mimetype starts with the category
	return mimetype.startsWith(categoryPattern + '/');
}
