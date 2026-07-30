import type { NoteVersion } from '@nota/client';
import { invoke } from '@tauri-apps/api/core';
import { getContext, setContext } from 'svelte';
import { DB } from './db';

async function sha256(message: string) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export class LocalVersions {
  async listWorkspaceVersions(
    workspaceId: string,
    filters?: {
      page?: number;
      limit?: number;
      note_ids?: string;
      type?: string;
      search?: string;
    }
  ) {
    let query = 'SELECT * FROM note_versions WHERE workspace_id = $1';
    const args: any[] = [workspaceId];

    if (filters?.note_ids) {
      query += ` AND note_id = $${args.length + 1}`;
      args.push(filters.note_ids);
    }

    if (filters?.type && filters.type !== 'all') {
      query += ` AND version_type = $${args.length + 1}`;
      args.push(filters.type);
    }

    query += ' ORDER BY created_at DESC';

    const limit = filters?.limit || 20;
    const page = filters?.page || 1;
    const offset = (page - 1) * limit;

    // Get total count first
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    let total = 0;
    try {
      const countRes: any = await DB.select(countQuery, args);
      total = countRes[0]?.count || 0;
    } catch (e) {
      console.error(e);
    }

    query += ` LIMIT $${args.length + 1} OFFSET $${args.length + 2}`;
    args.push(limit, offset);

    try {
      const rows: any[] = await DB.select(query, args);
      const versions: NoteVersion[] = rows.map((r) => ({
        id: r.id,
        note_id: r.note_id,
        workspace_id: r.workspace_id,
        content_hash: r.content_hash,
        size_bytes: r.size_bytes,
        compressed_size_bytes: r.content_compressed ? r.content_compressed.length : 0,
        version_type: r.version_type,
        label: r.label,
        created_at: new Date(r.created_at * 1000),
      }));

      return {
        versions,
        total,
        page,
        limit,
      };
    } catch (e) {
      console.error(e);
      throw new Error('Failed to list versions');
    }
  }

  async getVersionCount(noteId: string) {
    try {
      const res: any = await DB.select('SELECT COUNT(*) as count FROM note_versions WHERE note_id = $1', [noteId]);
      return res[0]?.count || 0;
    } catch (e) {
      console.error(e);
      return 0;
    }
  }

  async getVersionContent(noteId: string, versionId: string) {
    try {
      const res: any[] = await DB.select(
        'SELECT content_compressed FROM note_versions WHERE note_id = $1 AND id = $2',
        [noteId, versionId]
      );
      if (res.length > 0) {
        let data = res[0].content_compressed;
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) {
            console.error('Failed to parse content_compressed', e);
          }
        }
        // Decompress the blob
        const decompressedStr = await invoke<string>('decompress_data', {
          data,
        });
        return JSON.parse(decompressedStr);
      }
      throw new Error('Version not found');
    } catch (e) {
      console.error(e);
      throw new Error('Failed to get version content');
    }
  }

  async createLocalSnapshot(
    noteId: string,
    workspaceId: string,
    content: any,
    label?: string,
    type: 'auto' | 'manual' | 'restore' = 'manual',
    source = 'local'
  ) {
    try {
      const contentStr = JSON.stringify(content);
      const hash = await sha256(contentStr);
      const sizeBytes = new Blob([contentStr]).size;

      const compressed: number[] = await invoke('compress_data', {
        data: contentStr,
      });

      const id = crypto.randomUUID();
      await DB.execute(
        `INSERT INTO note_versions (id, note_id, workspace_id, content_compressed, content_hash, size_bytes, version_type, label, source) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [id, noteId, workspaceId, compressed, hash, sizeBytes, type, label || null, source]
      );

      return {
        id,
        note_id: noteId,
        workspace_id: workspaceId,
        content_hash: hash,
        size_bytes: sizeBytes,
        compressed_size_bytes: compressed.length,
        version_type: type,
        label,
        created_at: new Date(),
      };
    } catch (e) {
      console.error(e);
      throw new Error('Failed to create local snapshot');
    }
  }

  async maybeAutoSnapshot(noteId: string, workspaceId: string, content: any, source = 'local') {
    try {
      const contentStr = JSON.stringify(content);
      const hash = await sha256(contentStr);

      const latest: any[] = await DB.select(
        'SELECT content_hash, version_type, created_at FROM note_versions WHERE note_id = $1 ORDER BY created_at DESC LIMIT 1',
        [noteId]
      );

      if (latest.length > 0) {
        const last = latest[0];
        if (last.content_hash === hash) return;

        // 10 minute cooldown for auto types
        if (last.version_type === 'auto') {
          const tenMins = 10 * 60;
          const now = Math.floor(Date.now() / 1000);
          if (now - last.created_at < tenMins) {
            return;
          }
        }
      }

      await this.createLocalSnapshot(noteId, workspaceId, content, undefined, 'auto', source);
    } catch (e) {
      console.error(e);
    }
  }

  async deleteVersion(noteId: string, versionId: string) {
    try {
      await DB.execute('DELETE FROM note_versions WHERE note_id = $1 AND id = $2', [noteId, versionId]);
    } catch (e) {
      console.error(e);
      throw new Error('Failed to delete version');
    }
  }

  async restoreVersion(noteId: string, versionId: string, currentContent: any, workspaceId: string, source = 'local') {
    try {
      const restoredContent = await this.getVersionContent(noteId, versionId);

      // Before restoring, create a 'restore' snapshot of current content
      await this.createLocalSnapshot(
        noteId,
        workspaceId,
        currentContent,
        'Restored From ' + versionId.substring(0, 8),
        'restore',
        source
      );

      // We don't overwrite the actual note content here; the frontend will do it after this returns
      return restoredContent;
    } catch (e) {
      console.error(e);
      throw new Error('Failed to restore version');
    }
  }
}

const LOCALVERSIONSKEY = Symbol('LOCALVERSIONSKEY');

export const setLocalVersions = () => {
  return setContext(LOCALVERSIONSKEY, new LocalVersions());
};

export const getLocalVersions = () => {
  return getContext<ReturnType<typeof setLocalVersions>>(LOCALVERSIONSKEY);
};
