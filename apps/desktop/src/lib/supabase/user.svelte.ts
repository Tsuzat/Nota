import type { Session, User } from '@supabase/supabase-js';
import { getContext, setContext } from 'svelte';
import { supabase } from '.';

export interface UserProfile {
  id: string;
  created_at: string;
  storage_used: number;
  storage_allotted: number;
  subscription_tier: 'free' | 'pro';
  subscription_type: 'monthtly' | 'yearly' | null;
  payment_status: string | null;
  subscription_start_date: string | null;
  next_billing_date: string | null;
  payment_method_id: string | null;
  ai_credits: number;
  external_customer_id: string | null;
}

class SessionAndUser {
  #user = $state<User | null>(null);
  #session = $state<Session | null>(null);
  #profile = $state<UserProfile | null>(null);

  constructor(user: User | null, session: Session | null, profile: UserProfile | null) {
    this.#user = user;
    this.#session = session;
    this.#profile = profile;
  }

  getUser() {
    return this.#user;
  }

  getSession() {
    return this.#session;
  }

  getProfile() {
    return this.#profile;
  }

  setUser(user: User | null) {
    this.#user = user;
  }

  setSession(session: Session | null) {
    this.#session = session;
  }

  async fetchUserProfile() {
    const { data, error } = await supabase.from('profiles').select().single();
    if (error) {
      console.error(error);
      this.#profile = null;
      return;
    }
    this.#profile = data;
  }
}

const SESSIONANDUSERKEY = Symbol('SESSIONANDUSERKEY');

export const setSessionAndUserContext = () => {
  return setContext(SESSIONANDUSERKEY, new SessionAndUser(null, null, null));
};

export const getSessionAndUserContext = () => {
  return getContext<ReturnType<typeof setSessionAndUserContext>>(SESSIONANDUSERKEY);
};
