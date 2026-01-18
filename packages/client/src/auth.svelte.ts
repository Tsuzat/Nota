import { getContext, setContext } from "svelte";
import { PUBLIC_BACKEND_URL } from "$env/static/public";
import request from "./request";
import { type User, UserSchema } from "./types";
import { authClient } from "./auth";

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
    const url = `${PUBLIC_BACKEND_URL}/api/user/me`;
    const res = await request(url);
    if (res.ok) {
      const data = await res.json();
      const user = data.user;
      const parsedUser = UserSchema.parse(user);
      this.#user = parsedUser;
    } else {
      console.log(await res.text());
      throw new Error("Please signin again");
    }
  }

  /**
   * Sign in with OAuth
   * @param provider - The OAuth provider to use ('github' or 'google')
   * @param platform - The platform to use ('desktop' or 'web') (optional)
   * @returns A promise that resolves when the sign-in request is successful
   * @throws {Error} If the request fails with a non-200 status code
   */
  async signInWithOAuth(provider: "github" | "google", isDesktop = false) {
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
