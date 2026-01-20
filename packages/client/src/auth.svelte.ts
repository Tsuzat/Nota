import { getContext, setContext } from "svelte";
import { authClient } from "./auth";
import type { User } from "./types";

class Auth {
  #user = $state<User>();

  get user() {
    return this.#user;
  }

  set user(user: User | undefined) {
    this.#user = user;
  }

  /**
   * Initializes auth and sets the current user
   * You can use `auth.user` getter to get the current user
   * @throws {Error} If the request fails with a non-200 status code
   */
  async init() {
    const session = await authClient.getSession();
    if (session.data) {
      this.#user = session.data.user;
    }
  }

  /**
   * Sign in with OAuth
   * @param provider - The OAuth provider to use ('github' or 'google')
   * @param platform - The platform to use ('desktop' or 'web') (optional)
   * @returns A promise that resolves when the sign-in request is successful
   * @throws {Error} If the request fails with a non-200 status code
   */
  async signInWithOAuth(provider: "github" | "google") {
    await authClient.signIn.social({ provider });
  }

  /**
   * Log out the current user by revoking all sessions
   * @returns A promise that resolves when the logout request is successful
   * @throws {Error} If the request fails with a non-200 status code
   */
  async logout() {
    await authClient.signOut();
    localStorage.removeItem("bearer_token");
  }
}

const NOTAAUTHKEY = Symbol("NOTAAUTHKEY");

/**
 * Set the auth context.
 */
export const setAuthContext = () => {
  return setContext(NOTAAUTHKEY, new Auth());
};

/**
 * Get the auth context.
 */
export const getAuthContext = () => {
  return getContext<ReturnType<typeof setAuthContext>>(NOTAAUTHKEY);
};
