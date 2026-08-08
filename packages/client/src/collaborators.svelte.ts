import { getContext, setContext } from 'svelte';
import request from './request';
import type { NoteCollaborator } from './types';
import { PUBLIC_BACKEND_URL } from '$env/static/public';

const COLLAB_CONTEXT_KEY = Symbol('COLLABORATORS');

export class CollaboratorsService {
  #members = $state<NoteCollaborator[]>([]);
  #isLoading = $state(false);

  get members() {
    return this.#members;
  }

  get isLoading() {
    return this.#isLoading;
  }

  async fetchMembers(noteId: string) {
    this.#isLoading = true;
    try {
      const res = await request(`${PUBLIC_BACKEND_URL}/api/v1/db/note/${noteId}/collaborators/list`);
      if (res.ok) {
        const json = await res.json();
        this.#members = json.data || [];
      } else {
        throw new Error('Failed to fetch collaborators');
      }
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      this.#isLoading = false;
    }
  }

  async addMember(noteId: string, email: string, role: string) {
    this.#isLoading = true;
    try {
      const res = await request(`${PUBLIC_BACKEND_URL}/api/v1/db/note/${noteId}/collaborators`, {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      });
      if (res.ok) {
        // Optimistically or explicitly refetch
        await this.fetchMembers(noteId);
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add collaborator');
      }
    } finally {
      this.#isLoading = false;
    }
  }

  async updateRole(noteId: string, collabId: string, role: string) {
    this.#isLoading = true;
    try {
      const res = await request(`${PUBLIC_BACKEND_URL}/api/v1/db/note/${noteId}/collaborators/${collabId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        // Update local state optimistically
        const idx = this.#members.findIndex((m) => m.id === collabId);
        if (idx !== -1) {
          this.#members[idx].role = role;
        }
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update role');
      }
    } finally {
      this.#isLoading = false;
    }
  }

  async removeMember(noteId: string, collabId: string) {
    this.#isLoading = true;
    try {
      const res = await request(`${PUBLIC_BACKEND_URL}/api/v1/db/note/${noteId}/collaborators/${collabId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        this.#members = this.#members.filter((m) => m.id !== collabId);
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to remove collaborator');
      }
    } finally {
      this.#isLoading = false;
    }
  }
}

export function setCollaboratorsContext() {
  return setContext(COLLAB_CONTEXT_KEY, new CollaboratorsService());
}

export function getCollaboratorsContext() {
  return getContext<CollaboratorsService>(COLLAB_CONTEXT_KEY);
}
