import { getContext, setContext } from 'svelte';
import type { Session, User } from './types';

class UserAndSession {
  #user = $state<User>();
  #session = $state<Session>();
  get user() {
    return this.#user;
  }
  get session() {
    return this.#session;
  }
  set user(user: User | undefined) {
    this.#user = user;
  }
  set session(session: Session | undefined) {
    this.#session = session;
  }
}

const USERANDSESSIONKEY = Symbol('USERANDSESSIONKEY');

/**
 * Set the user and session context.
 */
export const setUserAndSessionContext = () => {
  setContext(USERANDSESSIONKEY, new UserAndSession());
};

/**
 * Get the user and session context.
 */
export function getUserAndSessionContext() {
  return getContext<ReturnType<typeof setUserAndSessionContext>>(USERANDSESSIONKEY);
}
