import { getContext, setContext } from 'svelte';
import z from 'zod';
import { PUBLIC_BACKEND_URL } from '$env/static/public';
import request, { fetchFn } from './request';
import { type NotaFile, NotaFileSchema } from './types';

const SignedUrlResponseSchema = z.object({
  uploadUrl: z.string().nonempty(),
  publicUrl: z.string().nonempty(),
  key: z.string().nonempty(),
});

class Storage {
  #files = $state<NotaFile[]>([]);
  get files() {
    return this.#files;
  }

  /**
   * Fetches the list of files from the server
   * @throws {Error} If the request fails with a non-200 status code
   */
  async fetch() {
    const url = `${PUBLIC_BACKEND_URL}/api/v1/storage/list`;
    const res = await request(url);
    if (res.ok) {
      const json = await res.json();
      const files = json.data as NotaFile[];
      if (files.length === 0) return;
      const parsedFiles = files.map((file: NotaFile) => NotaFileSchema.parse(file));
      this.#files = parsedFiles;
    } else {
      throw new Error(await res.text());
    }
  }

  async upload(file: File) {
    const getSignedUrl = `${PUBLIC_BACKEND_URL}/api/v1/storage/presigned-url`;
    const signedUrlRes = await request(getSignedUrl, {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        size: file.size,
      }),
    });
    if (!signedUrlRes.ok) {
      console.log('Status of Presigned: ', signedUrlRes.ok);
      throw new Error(await signedUrlRes.text());
    }
    const json = await signedUrlRes.json();
    const signedUrl = SignedUrlResponseSchema.parse(json.data);
    console.log(signedUrl);
    const res = await fetchFn(signedUrl.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });
    if (!res.ok) {
      throw new Error((await res.text()) || 'Failed to upload file');
    }
    const confirmUrl = `${PUBLIC_BACKEND_URL}/api/v1/storage/confirm`;
    const confirmRes = await request(confirmUrl, {
      method: 'POST',
      body: JSON.stringify({ key: signedUrl.key }),
    });
    if (!confirmRes.ok) {
      throw new Error((await confirmRes.text()) || 'Failed to confirm upload');
    }
    this.#files.push({
      key: signedUrl.key,
      size: file.size,
      lastModified: new Date(file.lastModified),
      url: signedUrl.publicUrl,
    });
    return signedUrl.publicUrl;
  }

  /**
   * Deletes a file from the server
   * @param key - The key of the file to delete
   * @throws {Error} If the request fails with a non-200 status code
   */
  async delete(key: string) {
    const url = `${PUBLIC_BACKEND_URL}/api/v1/storage`;
    const res = await request(url, {
      method: 'DELETE',
      body: JSON.stringify({ key }),
    });
    if (res.ok) {
      this.#files = this.#files.filter((file) => file.key !== key);
    } else {
      throw new Error(await res.text());
    }
  }
}

const NOTASTORAGEKEY = Symbol('NOTASTORAGEKEY');

/**
 * Set the storage context.
 */
export const setStorageContext = () => {
  return setContext(NOTASTORAGEKEY, new Storage());
};

/**
 * Get the storage context.
 */
export const getStorageContext = () => {
  return getContext<ReturnType<typeof setStorageContext>>(NOTASTORAGEKEY);
};
