import { Stronghold } from "@tauri-apps/plugin-stronghold";
import { appLocalDataDir, join } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/core";

const isTauri = () =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

class SecureStorage {
  private stronghold: Stronghold | null = null;
  private initPromise: Promise<void> | null = null;

  async init() {
    if (!isTauri) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const password = await invoke<string>(
          "get_or_create_stronghold_password",
        );
        const localDataDir = await appLocalDataDir();
        const path = await join(localDataDir, "nota.stronghold");
        this.stronghold = await Stronghold.load(path, password);

        // Perform migration if necessary
        await this.migrateFromLocalStorage();
      } catch (e) {
        console.error("Failed to initialize Stronghold secure storage:", e);
      }
    })();

    return this.initPromise;
  }

  private async getStore() {
    await this.init();
    if (!this.stronghold) return null;
    const client = await this.stronghold.createClient("nota_client");
    return client.getStore();
  }

  async getItem(key: string): Promise<string | null> {
    if (!isTauri()) {
      return localStorage.getItem(key);
    }
    const store = await this.getStore();
    if (!store) return null;
    try {
      const valueBytes = await store.get(key);
      if (!valueBytes) return null;
      return new TextDecoder().decode(new Uint8Array(valueBytes));
    } catch (e) {
      console.error(`Error reading key ${key} from Stronghold:`, e);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    if (!isTauri()) {
      localStorage.setItem(key, value);
      return;
    }
    const store = await this.getStore();
    if (!store) return;
    try {
      const valueBytes = Array.from(new TextEncoder().encode(value));
      await store.insert(key, valueBytes);
      await this.stronghold!.save();
    } catch (e) {
      console.error(`Error writing key ${key} to Stronghold:`, e);
    }
  }

  async removeItem(key: string): Promise<void> {
    if (!isTauri()) {
      localStorage.removeItem(key);
      return;
    }
    const store = await this.getStore();
    if (!store) return;
    try {
      await store.remove(key);
      await this.stronghold!.save();
    } catch (e) {
      console.error(`Error removing key ${key} from Stronghold:`, e);
    }
  }

  private async migrateFromLocalStorage() {
    // 1. Migrate access_token
    const accessToken = localStorage.getItem("access_token");
    if (accessToken) {
      await this.setItem("access_token", accessToken);
      localStorage.removeItem("access_token");
    }

    // 2. Migrate refresh_token
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      await this.setItem("refresh_token", refreshToken);
      localStorage.removeItem("refresh_token");
    }

    // 3. Migrate geminiApiKeyEnc
    const geminiApiKeyEnc = localStorage.getItem("geminiApiKeyEnc");
    if (geminiApiKeyEnc) {
      try {
        const decrypted = await this.decryptOldKey(geminiApiKeyEnc);
        if (decrypted) {
          await this.setItem("gemini_api_key", decrypted);
        }
      } catch (e) {
        console.error("Failed to decrypt and migrate old Gemini API Key:", e);
      }
      localStorage.removeItem("geminiApiKeyEnc");
      localStorage.removeItem("nota_k"); // remove encryption key as well
    }
  }

  private async decryptOldKey(data: string): Promise<string> {
    const existing = localStorage.getItem("nota_k");
    if (!existing) return "";
    const raw = Uint8Array.from(atob(existing), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, [
      "encrypt",
      "decrypt",
    ]);

    const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
    const iv = bytes.slice(0, 12);
    const ct = bytes.slice(12);
    const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
    return new TextDecoder().decode(dec);
  }
}

export const secureStorage = new SecureStorage();
