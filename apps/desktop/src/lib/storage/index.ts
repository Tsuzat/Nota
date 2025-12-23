import { PUBLIC_NOTA_FRONTEND_URL } from '$env/static/public';
import { FileType, getFileTypeExtensions, getFileTypeFromExtension } from '@lib/components/edra/utils';
import { basename } from '@tauri-apps/api/path';
import { readFile } from '@tauri-apps/plugin-fs';
import { fetch } from '@tauri-apps/plugin-http';
import { open } from '@tauri-apps/plugin-dialog';

interface SignedPostResponse {
  signedUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
}

/**
 * Uploads a file to the storage using signed upload and verify the upload
 * @param token - user auth token
 * @param file - file to be uploaded
 * @returns public url of the uploaded file
 */
export async function uploadFile(token: string, file: File): Promise<string> {
  if (file instanceof File) {
    if (file.size === 0) {
      throw new Error('File is empty.');
    }
    if (file.size > 50 * 1024 * 1024) {
      throw new Error('File size exceeds 50MB.');
    }
  }
  console.log('FILE DATA = ', token, file.name, file.type);

  const res = await fetch(`${PUBLIC_NOTA_FRONTEND_URL}/api/storage/signed`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filename: file.name,
      expectedMime: file.type,
    }),
  });
  if (res.status !== 200) {
    console.error(await res.text());
    throw new Error('Could not create signed upload url.');
  }

  try {
    const data: SignedPostResponse = await res.json();
    const resSignedPut = await fetch(data.signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
        'Content-Length': file.size.toString(),
      },
      body: file,
    });
    if (resSignedPut.status !== 200) {
      console.error("Status of Signed Upload Failed", await resSignedPut.text());
      throw new Error('Could not upload. Signed Upload Failed.');
    }
    console.log("Trying to verify the uploaded file")
    const uploadedFileVerification = await fetch(`${PUBLIC_NOTA_FRONTEND_URL}/api/storage/signed`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: data.key,
        expectedMime: file.type,
      }),
    });
    if (uploadedFileVerification.status !== 200) {
      console.error(uploadedFileVerification.statusText);
      throw new Error('Could not upload. File verification failed.');
    }
    return data.publicUrl;
  } catch (error) {
    console.error(error);
    throw new Error('Could not upload');
  }
}

/**
 * Uploads a file to the storage by path
 * @param token - user auth token
 * @param path - path to the file
 * @returns public url of the uploaded file
 */
export async function uploadFileByPath(token: string, path: string): Promise<string> {
  const bytes = await readFile(path);
  const name = await basename(path);
  const extension = getFileTypeFromExtension(name);
  if (extension === FileType.UNKNOWN) {
    throw new Error('Unsupported file is being uploaded. Rejected the Upload.');
  }
  const size = bytes.length;
  if (size > 50 * 1024 * 1024) {
    throw new Error('File size exceeds 50MB. Rejected the Upload.');
  }

  // Create file with correct MIME type
  let mimeType = `${extension.replace('*', '')}${name.split('.').pop()}`;

  console.log(mimeType);
  const file = new File([bytes], name, { type: mimeType });
  return await uploadFile(token, file);
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
