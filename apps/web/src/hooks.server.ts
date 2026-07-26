import { request as apiRequest } from "@nota/client";
import type { Handle } from "@sveltejs/kit";
import { env } from "$env/dynamic/public";

export const handle: Handle = async ({ event, resolve }) => {
  const url = `${env.PUBLIC_BACKEND_URL}/api/v1/user/me`;
  const res = await apiRequest(url, {
    headers: event.request.headers,
    fetch: event.fetch,
  });

  if (res.ok) {
    try {
      const data: any = await res.json();
      event.locals.user = data.data.user;
      event.locals.session = data.data.session;
    } catch (error) {
      console.error("Error fetching user data:", error);
      event.locals.user = null;
      event.locals.session = null;
    }
  } else {
    event.locals.user = null;
    event.locals.session = null;
  }

  // Forward refreshed access_token cookie to the browser.
  // request.ts attaches the Set-Cookie from the refresh response
  // onto the final response headers — we parse it and use
  // event.cookies.set() which MUST happen before resolve().
  const setCookie = res.headers.get("Set-Cookie");
  if (setCookie) {
    const match = setCookie.match(/access_token=([^;]+)/);
    if (match) {
      event.cookies.set("access_token", match[1], {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      });
    }
  }

  return resolve(event);
};
