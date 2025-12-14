import { logerror } from "$lib/sentry/index.js";
import { redirect } from "@sveltejs/kit";

export const GET = async (event) => {
  const {
    url,
    locals: { supabase },
  } = event;
  const code = url.searchParams.get("code") as string;
  const next = url.searchParams.get("next") ?? "/";
  const desktop = url.searchParams.get("desktop") === "true";
  console.log({ code, next, desktop });

  if (code) {
    if (desktop) {
      const url = `nota://auth/callback?code=${code}`;
      return redirect(307, url);
    }
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirect(307, next);
    }
    logerror("Error when exchanging code for session in auth/oauth", { error });
  }
  // return the user to an error page with instructions
  return redirect(307, "/auth/auth-error");
};
