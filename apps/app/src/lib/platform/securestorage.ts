import { invoke } from "@tauri-apps/api/core";
import { appLocalDataDir, join } from "@tauri-apps/api/path";
import {
	type Client,
	type Store,
	Stronghold,
} from "@tauri-apps/plugin-stronghold";
import { ISDESKTOP } from "#lib/utils.ts";

class SecureStorage {
	private stronghold: Stronghold | null = null;
	private store: Store | null = null;
	private initPromise: Promise<void> | null = null;
	private memoryCache = new Map<string, string>();

	async init() {
		if (!ISDESKTOP) return;
		if (this.initPromise) return this.initPromise;

		const initTimeout = new Promise<void>((_, reject) =>
			setTimeout(
				() => reject(new Error("Timeout initializing secure storage")),
				3000,
			),
		);

		this.initPromise = Promise.race([
			(async () => {
				try {
					const password = await invoke<string>(
						"get_or_create_stronghold_password",
					);
					const localDataDir = await appLocalDataDir();
					const path = await join(localDataDir, "nota.stronghold");
					this.stronghold = await Stronghold.load(path, password);

					// Load or create the client and get the store
					let client: Client;
					try {
						client = await this.stronghold.loadClient("nota_client");
					} catch (e) {
						console.error(e);
						client = await this.stronghold.createClient("nota_client");
					}
					this.store = client.getStore();

					// Preload token into memory cache
					if (this.store) {
						const valueBytes = await this.store.get("access_token");
						if (valueBytes) {
							const str = new TextDecoder().decode(new Uint8Array(valueBytes));
							if (str && str !== "null" && str !== "undefined") {
								this.memoryCache.set("access_token", str);
							}
						}
					}
				} catch (e) {
					console.error("Failed to initialize Stronghold secure storage:", e);
				}
			})(),
			initTimeout,
		]).catch((e) => {
			console.error("Tauri Stronghold initialization timed out/failed:", e);
			// Stronghold will remain null, falling back to localStorage
		});

		return this.initPromise;
	}

	private async getStore() {
		await this.init();
		return this.store;
	}

	async getItem(key: string): Promise<string | undefined> {
		if (!ISDESKTOP) return undefined;

		if (this.memoryCache.has(key)) {
			return this.memoryCache.get(key);
		}

		const store = await this.getStore();
		if (!store) return undefined;

		const valueBytes = await store.get(key);
		if (!valueBytes) return undefined;

		const str = new TextDecoder().decode(new Uint8Array(valueBytes));
		const val = str === "null" || str === "undefined" ? undefined : str;
		if (val) {
			this.memoryCache.set(key, val);
		}
		return val;
	}

	async setItem(key: string, value: string): Promise<void> {
		if (!ISDESKTOP) return;

		this.memoryCache.set(key, value);

		const store = await this.getStore();
		if (!store) return;

		try {
			const valueBytes = Array.from(new TextEncoder().encode(value));
			await store.insert(key, valueBytes);
			await this.stronghold?.save();
		} catch (e) {
			console.error(`Error writing key ${key} to Stronghold:`, e);
			throw e;
		}
	}

	async removeItem(key: string): Promise<void> {
		if (!ISDESKTOP) return;

		this.memoryCache.delete(key);

		const store = await this.getStore();
		if (!store) return;

		try {
			await store.remove(key);
			await this.stronghold?.save();
		} catch (e) {
			console.error(`Error removing key ${key} from Stronghold:`, e);
			throw e;
		}
	}
}

export const secureStorage = new SecureStorage();
