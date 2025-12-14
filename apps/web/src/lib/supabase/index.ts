import { PUBLIC_NOTA_FRONTEND_URL } from "$env/static/public";
import type { Provider, SupabaseClient } from "@supabase/supabase-js";
import { toast } from "@nota/ui/shadcn/sonner";

/**
 * Function which handle Supabase OAuth sign in
 * @param supabase SupabaseClient - Supabase client
 * @param provider Provider - Provider to use for authentication
 * @param isDesktop boolean - Whether the user is on a desktop or not
 */
export const signInWithOAuth = async (
  supabase: SupabaseClient,
  provider: Provider,
  isDesktop: boolean
) => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${PUBLIC_NOTA_FRONTEND_URL}/auth/oauth${
        isDesktop ? "?desktop=true" : ""
      }`,
    },
  });
  if (error) {
    toast.error(error.message);
  }
};

/**
 * Function which returns the initials of a name
 * @param name string - Name of the user
 * @returns Initials
 * @example
 * getIntials('John Doe'); // 'JD'
 * getIntials(); // 'U'
 * getIntials("Alok") // 'AL'
 * getIntials("A") // 'A'
 */
export function getIntials(name?: string): string {
  if (!name || name.trim() === "") {
    return "U";
  }

  const trimmedName = name.trim();
  const words = trimmedName.split(/\s+/);

  if (words.length === 1) {
    // Single word - return first character or first two if available
    return words[0].length === 1
      ? words[0].toUpperCase()
      : words[0].slice(0, 2).toUpperCase();
  }

  // Multiple words - return first character of first two words
  return (words[0][0] + words[1][0]).toUpperCase();
}
