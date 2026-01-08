import { getContext, setContext } from 'svelte';
import { PUBLIC_BACKEND_URL } from '$env/static/public';
import request from './request';
import { type User, UserSchema } from './types';

class Auth {
  #user = $state<User>();

  get user() {
    return this.#user;
  }

  set user(user: User | undefined) {
    this.#user = user;
  }

  private async generatePKCE() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const verifier = btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const challenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return { verifier, challenge };
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
    }
  }

  /**
   * Sign up a new user
   * @param email - The email of the user
   * @param password - The password of the user
   * @param name - The name of the user (optional)
   * @returns The signed up user
   * @throws {Error} If the request fails with a non-200 status code
   * @deprecated Do not use signup from email, password. Use signup from OAuth instead.
   */
  async signup(email: string, password: string, name?: string) {
    const url = `${PUBLIC_BACKEND_URL}/api/auth/signup`;
    const res = await request(url, {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    if (res.ok) {
      // do nothing and prompt user to login
    } else {
      throw new Error(await res.text());
    }
  }

  /**
   * Sign in with OAuth
   * @param provider - The OAuth provider to use ('github' or 'google')
   * @param platform - The platform to use ('desktop' or 'web') (optional)
   * @returns A promise that resolves when the sign-in request is successful
   * @throws {Error} If the request fails with a non-200 status code
   */
  async signInWithOAuth(provider: 'github' | 'google', isDesktop = false) {
    let url = `${PUBLIC_BACKEND_URL}/api/auth/login/${provider}${isDesktop ? '?platform=desktop' : ''}`;

    if (isDesktop) {
      const { verifier, challenge } = await this.generatePKCE();
      localStorage.setItem('pkce_verifier', verifier);
      url += `&code_challenge=${challenge}`;
      return url;
    }

    // Use direct navigation instead of fetch to avoid CORS issues with redirects
    window.location.href = url;
  }

  /**
   * Exchange auth code for tokens (PKCE flow)
   * @param code - The auth code received from deep link
   */
  async exchangeCode(code: string) {
    const verifier = localStorage.getItem('pkce_verifier');
    if (!verifier) throw new Error('No PKCE verifier found');

    const url = `${PUBLIC_BACKEND_URL}/api/auth/exchange`;
    const res = await request(url, {
      method: 'POST',
      body: JSON.stringify({
        code,
        code_verifier: verifier,
      }),
    });
    if (res.ok) {
      localStorage.removeItem('pkce_verifier');
      const { access_token, refresh_token } = await res.json();
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      await this.init();
    } else {
      throw new Error(await res.text());
    }
  }

  /**
   * Sign in with email and password
   * @param email - The email of the user
   * @param password - The password of the user
   * @returns A promise that resolves when the sign-in request is successful
   * @throws {Error} If the request fails with a non-200 status code
   */
  async signInWithEmailAndPassword(email: string, password: string) {
    const url = `${PUBLIC_BACKEND_URL}/api/auth/login`;
    const res = await request(url, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      await this.init();
    } else {
      throw new Error(await res.text());
    }
  }

  /**
   * Log out the current user by revoking all sessions
   * @returns A promise that resolves when the logout request is successful
   * @throws {Error} If the request fails with a non-200 status code
   */
  async logout() {
    const url = `${PUBLIC_BACKEND_URL}/api/auth/logout`;
    const res = await request(url);
    if (res.ok) {
      this.#user = undefined;
    } else {
      throw new Error(await res.text());
    }
  }
}

const NOTAAUTHKEY = Symbol('NOTAAUTHKEY');

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
