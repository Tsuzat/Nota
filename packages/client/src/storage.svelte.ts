import { getContext, setContext } from 'svelte';
import z from 'zod';
import { PUBLIC_BACKEND_URL } from '$env/static/public';
import request, { fetchFn } from './request';
import { type Asset, AssetSchema } from './types';

const SignedUrlResponseSchema = z.object({
  uploadUrl: z.string().min(1),
  publicUrl: z.string().min(1),
  key: z.string().min(1),
});

export interface FetchStorageOptions {
  page?: number;
  limit?: number;
  search?: string;
  workspaceId?: string;
  type?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface UploadStorageOptions {
  workspaceId?: string;
  noteId?: string;
}

class Storage {
  #assets = $state<Asset[]>([]);
  #usedBytes = $state<number>(0);
  #total = $state<number>(0);
  #page = $state<number>(1);
  #limit = $state<number>(20);

  get assets() {
    return this.#assets;
  }

  get total() {
    return this.#total;
  }

  get page() {
    return this.#page;
  }

  get limit() {
    return this.#limit;
  }

  get usedBytes() {
    return this.#usedBytes;
  }
  set usedBytes(value) {
    this.#usedBytes = value;
  }

  /**
   * Backwards compatibility helper returning legacy file objects
   */
  get files() {
    return this.#assets.map((asset) => ({
      key: asset.path,
      size: asset.size,
      lastModified: asset.updated_at,
      url: asset.path,
    }));
  }

  /**
   * Fetches the list of assets from the database with optional pagination and search
   */
  async fetch(options?: FetchStorageOptions) {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.search) params.set('search', options.search);
    if (options?.workspaceId) params.set('workspaceId', options.workspaceId);
    if (options?.type) params.set('type', options.type);
    if (options?.sortBy) params.set('sortBy', options.sortBy);
    if (options?.sortOrder) params.set('sortOrder', options.sortOrder);

    const queryString = params.toString();
    const url = `${PUBLIC_BACKEND_URL}/api/v1/storage/list${queryString ? `?${queryString}` : ''}`;
    
    const res = await request(url);
    if (res.ok) {
      const json = await res.json();
      const data = json.data;
      if (data) {
        if (Array.isArray(data.files)) {
          const parsedAssets = data.files.map((file: unknown) => AssetSchema.parse(file));
          this.#assets = parsedAssets;
          this.#total = data.total ?? parsedAssets.length;
        } else {
          this.#assets = [];
          this.#total = 0;
        }
        this.#page = data.page ?? 1;
        this.#limit = data.limit ?? 20;
      }
    } else {
      throw new Error(await res.text());
    }
  }

  /**
   * Uploads a file to storage and creates an asset record in DB
   */
  async upload(file: File, options?: UploadStorageOptions) {
    const getSignedUrl = `${PUBLIC_BACKEND_URL}/api/v1/storage/presigned-url`;
    const workspaceId = options?.workspaceId || '';
    const noteId = options?.noteId;

    const signedUrlRes = await request(getSignedUrl, {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        size: file.size,
        workspaceId,
        noteId,
      }),
    });
    if (!signedUrlRes.ok) {
      throw new Error(await signedUrlRes.text());
    }
    const json = await signedUrlRes.json();
    const signedUrl = SignedUrlResponseSchema.parse(json.data);

    const res = await fetchFn(signedUrl.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });
    if (!res.ok) {
      throw new Error((await res.text()) || 'Failed to upload file');
    }

    const confirmUrl = `${PUBLIC_BACKEND_URL}/api/v1/storage/confirm`;
    const confirmRes = await request(confirmUrl, {
      method: 'POST',
      body: JSON.stringify({
        key: signedUrl.key,
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        workspaceId,
        noteId,
      }),
    });
    if (!confirmRes.ok) {
      throw new Error((await confirmRes.text()) || 'Failed to confirm upload');
    }

    const confirmJson = await confirmRes.json();
    const asset = AssetSchema.parse(confirmJson.data);

    this.#assets.push(asset);
    this.#usedBytes += asset.size;
    return asset.path;
  }

  /**
   * Deletes an asset by ID or Key
   */
  async delete(idOrKey: string) {
    const url = `${PUBLIC_BACKEND_URL}/api/v1/storage`;
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(idOrKey);
    const body = isUuid ? { id: idOrKey } : { key: idOrKey };

    const res = await request(url, {
      method: 'DELETE',
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const targetAsset = this.#assets.find((asset) => asset.id === idOrKey || asset.path === idOrKey);
      if (targetAsset) {
        this.#usedBytes = Math.max(0, this.#usedBytes - targetAsset.size);
      }
      this.#assets = this.#assets.filter((asset) => asset.id !== idOrKey && asset.path !== idOrKey);
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
