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

  if (code) {
    if (desktop) {
      const url = `nota://auth-success?code=${code}`;
      return redirect(303, url);
    }
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirect(303, `/${next.slice(1)}`);
    }
    logerror("Error when exchanging code for session in auth/oauth", { error });
  }
  // return the user to an error page with instructions
  return redirect(307, "/auth/auth-error");
};
