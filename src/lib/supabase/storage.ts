import { toast } from 'svelte-sonner';
import { supabase } from '.';
import { readFile } from '@tauri-apps/plugin-fs';
import { basename } from '@tauri-apps/api/path';
import { FileType, getFileTypeFromExtension } from '$lib/utils';

export async function uploadFile(file: File): Promise<string> {
	const { data, error } = await supabase.storage.from('Notes Media').upload(file.name, file, {
		upsert: true
	});
	if (error) {
		console.error(error);
		toast.error(error.message);
	}
	if (data) {
		const resp = supabase.storage.from('Notes Media').getPublicUrl(data.path);
		return resp.data.publicUrl;
	} else {
		throw new Error('Could not upload');
	}
}

export async function uploadFileByPath(path: string): Promise<string> {
	const bytes = await readFile(path);
	const name = await basename(path);
	const extension = getFileTypeFromExtension(name);
	if (extension === FileType.UNKNOWN) {
		throw new Error('Unsupported file is being uploaded. Rejected the Upload.');
	}
	const file = new File([bytes], name, { type: extension });
	return await uploadFile(file);
}
