// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { User } from '@nota/client';

declare global {
  namespace App {
    interface Locals {
      user: User | null;
    }
    interface Error {
      server: { message: string; stack?: string; status?: number };
      client: { message: string; stack?: string; status?: number };
    }
  }
}
