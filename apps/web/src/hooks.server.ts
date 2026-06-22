import { type Handle, redirect } from "@sveltejs/kit";
import { PUBLIC_BACKEND_URL } from "$env/static/public";
import { request as apiRequest } from "@nota/client";

export const handle: Handle = async ({ event, resolve }) => {
  const url = `${PUBLIC_BACKEND_URL}/api/v1/user/me`;
  const res = await apiRequest(url, {
    headers: event.request.headers,
    fetch: event.fetch,
  });
  if (res.ok) {
    try {
      const data: any = await res.json();
      event.locals.user = data.data;
    } catch (error) {
      console.error("Error fetching user data:", error);
      event.locals.user = null;
    }
  } else {
    event.locals.user = null;
  }
  return resolve(event);
};
