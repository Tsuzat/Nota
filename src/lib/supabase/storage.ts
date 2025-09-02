import { toast } from 'svelte-sonner';
import { supabase } from '.';
import { readFile } from '@tauri-apps/plugin-fs';
import { basename } from '@tauri-apps/api/path';
import { FileType, getFileTypeFromExtension } from '$lib/utils';
import { nanoid } from 'nanoid';

export async function uploadFile(id: string, file: File): Promise<string> {
	const path = `${id}/${file.type.split('/')[0]}/${nanoid(32)}`;
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
		const path = `${id}/${fileType.split('/')[0]}`;
		console.log('PATH = ', path);
		const { data, error } = await supabase.storage.from('notes media').list(path);
		if (error) {
			console.error(error);
			toast.error(error.message);
			return [] as string[];
		} else {
			const urls = [];
			for (const file of data) {
				if (file.name === '.emptyFolderPlaceholder') continue;
				urls.push(
					supabase.storage.from('notes media').getPublicUrl(`${path}/${file.name}`).data.publicUrl
				);
			}
			return urls;
		}
	} catch (error) {
		console.error(error);
		toast.error('Something went wrong when loading assets.');
		return [];
	}
}
