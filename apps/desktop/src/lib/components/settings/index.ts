export { getGlobalSettings, setGlobalSettings } from './constants.svelte';
export { default as GlobalSettings } from './settings.svelte';

export async function ensureCryptoKey(): Promise<CryptoKey> {
  const existing = localStorage.getItem('nota_k');
  if (existing) {
    const raw = Uint8Array.from(atob(existing), (c) => c.charCodeAt(0));
    return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
  }
  const rawKey = new Uint8Array(32);
  crypto.getRandomValues(rawKey);
  localStorage.setItem('nota_k', btoa(String.fromCharCode(...rawKey)));
  return crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encrypt(text: string): Promise<string> {
  const key = await ensureCryptoKey();
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const enc = new TextEncoder().encode(text);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc);
  const combined = new Uint8Array(iv.length + new Uint8Array(ct).length);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ct), iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decrypt(data: string): Promise<string> {
  const key = await ensureCryptoKey();
  const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
  const iv = bytes.slice(0, 12);
  const ct = bytes.slice(12);
  const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return new TextDecoder().decode(dec);
}
