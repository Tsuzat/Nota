import { invoke } from '@tauri-apps/api/core';
import { appLocalDataDir, join } from '@tauri-apps/api/path';
import { Store, Stronghold } from '@tauri-apps/plugin-stronghold';

const isTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

class SecureStorage {
  private stronghold: Stronghold | null = null;
  private store: Store| null = null;
  private initPromise: Promise<void> | null = null;

  async init() {
    if (!isTauri()) return;
    if (this.initPromise) return this.initPromise;

    const initTimeout = new Promise<void>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout initializing secure storage')), 3000)
    );

    this.initPromise = Promise.race([
      (async () => {
        try {
          const password = await invoke<string>('get_or_create_stronghold_password');
          const localDataDir = await appLocalDataDir();
          const path = await join(localDataDir, 'nota.stronghold');
          this.stronghold = await Stronghold.load(path, password);

          // Load or create the client and get the store
          let client;
          try {
            client = await this.stronghold.loadClient('nota_client');
          } catch (e) {
            client = await this.stronghold.createClient('nota_client');
          }
          this.store = client.getStore();
        } catch (e) {
          console.error('Failed to initialize Stronghold secure storage:', e);
        }
      })(),
      initTimeout,
    ]).catch((e) => {
      console.error('Tauri Stronghold initialization timed out/failed:', e);
      // Stronghold will remain null, falling back to localStorage
    });

    return this.initPromise;
  }

  private async getStore() {
    await this.init();
    return this.store;
  }

  async getItem(key: string): Promise<string | null> {
    if (!isTauri()) {
      const val = localStorage.getItem(key);
      return val === "null" || val === "undefined" ? null : val;
    }
    const store = await this.getStore();
    if (!store) {
      console.warn(`Stronghold not available. Falling back to localStorage for getItem(${key})`);
      const val = localStorage.getItem(key);
      return val === "null" || val === "undefined" ? null : val;
    }
    try {
      const valueBytes = await store.get(key);
      if (!valueBytes) return null;
      const str = new TextDecoder().decode(new Uint8Array(valueBytes));
      return str === "null" || str === "undefined" ? null : str;
    } catch (e) {
      console.error(`Error reading key ${key} from Stronghold:`, e);
      return localStorage.getItem(key);
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    if (!isTauri()) {
      localStorage.setItem(key, value);
      return;
    }
    const store = await this.getStore();
    if (!store) {
      console.warn(`Stronghold not available. Falling back to localStorage for setItem(${key})`);
      localStorage.setItem(key, value);
      return;
    }
    try {
      const valueBytes = Array.from(new TextEncoder().encode(value));
      await store.insert(key, valueBytes);
      await this.stronghold!.save();
    } catch (e) {
      console.error(`Error writing key ${key} to Stronghold:`, e);
      localStorage.setItem(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    if (!isTauri()) {
      localStorage.removeItem(key);
      return;
    }
    const store = await this.getStore();
    if (!store) {
      console.warn(`Stronghold not available. Falling back to localStorage for removeItem(${key})`);
      localStorage.removeItem(key);
      return;
    }
    try {
      await store.remove(key);
      await this.stronghold!.save();
    } catch (e) {
      console.error(`Error removing key ${key} from Stronghold:`, e);
      localStorage.removeItem(key);
    }
  }
}

const instance = (typeof window !== 'undefined' && (window as any).__NOTA_SECURE_STORAGE__) || new SecureStorage();

if (typeof window !== 'undefined') {
  (window as any).__NOTA_SECURE_STORAGE__ = instance;
}

export const secureStorage = instance as SecureStorage;
