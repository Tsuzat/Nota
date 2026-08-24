import { redirect } from "@sveltejs/kit";
import { ISDESKTOP } from "#lib/utils.ts";

export const load = () => {
	if (!ISDESKTOP) {
		throw redirect(307, "/");
	}
};
