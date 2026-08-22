import { ISDESKTOP } from "#lib/utils.ts";
import { goto } from "$app/navigation";

export const load = () => {
	if (!ISDESKTOP) return goto("/home");
};
