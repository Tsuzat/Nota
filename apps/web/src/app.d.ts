// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import { SupabaseClient, Session } from '@supabase/supabase-js';

declare global {
  namespace App {
    interface Error {
      server: { message: string; stack?: string; status?: number };
      client: { message: string; stack?: string; status?: number };
    }
    interface Locals {
      supabase: SupabaseClient;
      safeGetSession(): Promise<{ session: Session | null; user: User | null }>;
    }
    interface PageData {
      session: Session | null;
      user: User | null;
    }
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
