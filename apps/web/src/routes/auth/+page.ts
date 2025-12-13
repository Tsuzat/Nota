import { redirect } from "@sveltejs/kit";
export const prerender = false;
export const ssr = false;

redirect(307, "/login");
