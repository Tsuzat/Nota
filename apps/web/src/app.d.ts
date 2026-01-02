// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    interface Error {
      server: { message: string; stack?: string; status?: number };
      client: { message: string; stack?: string; status?: number };
    }
  }
}
