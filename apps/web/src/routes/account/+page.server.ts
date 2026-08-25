import { redirect } from "@sveltejs/kit";
import { authClient } from "#lib/auth-client.ts";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ request: { headers }, fetch }) => {
	const { data, error } = await authClient.getSession({
		fetchOptions: {
			headers,
			customFetchImpl: fetch,
		},
	});
	if (error || data === null) {
		throw redirect(307, "/signin?redirectTo=/account");
	}

	return {
		...data,
	};
};
