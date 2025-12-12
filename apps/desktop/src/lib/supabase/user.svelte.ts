import type { User, Session } from '@supabase/supabase-js';
import { getContext, setContext } from 'svelte';

class SessionAndUser {
  #user = $state<User | null>(null);
  #session = $state<Session | null>(null);

  constructor(user: User | null, session: Session | null) {
    this.#user = user;
    this.#session = session;
  }

  getUser() {
    return this.#user;
  }

  getSession() {
    return this.#session;
  }

  setUser(user: User | null) {
    this.#user = user;
  }

  setSession(session: Session | null) {
    this.#session = session;
  }
}

const SESSIONANDUSERKEY = Symbol('SESSIONANDUSERKEY');

export const setSessionAndUserContext = () => {
  return setContext(SESSIONANDUSERKEY, new SessionAndUser(null, null));
};

export const getSessionAndUserContext = () => {
  return getContext<ReturnType<typeof setSessionAndUserContext>>(SESSIONANDUSERKEY);
};
