import { PUBLIC_NOTA_FRONTEND_URL } from '$env/static/public';
import { FileType, getFileTypeExtensions, getFileTypeFromExtension } from '@lib/components/edra/utils';
import { basename } from '@tauri-apps/api/path';
import { readFile } from '@tauri-apps/plugin-fs';
import { fetch } from '@tauri-apps/plugin-http';
import { open } from '@tauri-apps/plugin-dialog';
import { toast } from '@lib/components/ui/sonner';

interface SignedPostResponse {
  signedUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
}

/**
 * Uploads a file using signed upload.
 * Verification happens asynchronously on the server.
 */
export async function uploadFile(token: string, file: File, signal?: AbortSignal): Promise<string> {
  // ---- basic client-side guards (UX only) ----
  if (!(file instanceof File)) {
    throw new Error('Invalid file.');
  }

  if (file.size === 0) {
    throw new Error('File is empty.');
  }

  if (file.size > 50 * 1024 * 1024) {
    throw new Error('File size exceeds 50MB.');
  }

  // ---- 1. request signed upload ----
  const signRes = await fetch(`${PUBLIC_NOTA_FRONTEND_URL}/api/storage/signed`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filename: file.name,
      expectedMime: file.type,
    }),
    signal,
  });

  if (!signRes.ok) {
    const err = await signRes.text();
    throw new Error(`Failed to create signed URL: ${err}`);
  }

  const data: SignedPostResponse = await signRes.json();

  const uploadRes = await fetch(data.signedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
    signal,
  });
  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Signed upload failed: ${err}`);
  }
  // ---- 3. fire-and-forget verification ----
  fetch(`${PUBLIC_NOTA_FRONTEND_URL}/api/storage/signed`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key: data.key,
      clientMime: file.type,
    }),
  }).catch((err) => {
    console.error('Post-upload verification failed:', err);
  });
  return data.publicUrl;
}

const getMimeType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'mkv':
      return 'video/x-matroska';
    case 'mp3':
      return 'audio/mpeg';
    case 'ogg':
      return 'audio/ogg';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
};

/**
 * Uploads a file to the storage by path
 * @param token - user auth token
 * @param path - path to the file
 * @returns public url of the uploaded file
 */
export async function uploadFileByPath(token: string, path: string): Promise<string> {
  const bytes = await readFile(path);
  const name = await basename(path);
  const type = getMimeType(name);
  const file = new File([bytes], name, { type });
  return uploadFile(token, file);
}

/**
 * Uploads a file to the storage by opening a file dialog
 * @param token - user auth token
 * @param fileType - type of the file to be uploaded
 * @returns public url of the uploaded file or null if no file is selected
 */
export async function uploadLocalFile(token: string, fileType: FileType): Promise<string | null> {
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
  return await uploadFileByPath(token, file);
}


/**
 * Gets assets from the storage by file type
 * @param id - user id
 * @param fileType - type of the file
 * @returns array of public urls of the assets
 */
export async function getAssetsByFileType(token: string, fileType: FileType): Promise<string[]> {
  try { 
    const res = await fetch(`${PUBLIC_NOTA_FRONTEND_URL}/api/storage?type=${fileType}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to get assets: ${err}`);
    }
    const { files }: { files: string[] } = await res.json();
    return files;
  } catch (error) {
    console.error(error);
    toast.error('Something went wrong when loading assets.');
    return [];
  }
}
