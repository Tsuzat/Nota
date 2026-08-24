import { error } from "@sveltejs/kit";
import { client } from "#lib/orpc.ts";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
	const slug = params.slug?.trim();
	if (!slug) {
		throw error(404, "Note not found");
	}

	try {
		const note = await client.publish.get({ slug });
		if (!note) {
			throw error(404, "Note not found or has been unpublished");
		}

		return {
			note,
		};
	} catch (err: unknown) {
		const isNotFound =
			typeof err === "object" &&
			err !== null &&
			("status" in err || "code" in err) &&
			((err as { status?: number }).status === 404 ||
				(err as { code?: string }).code === "NOT_FOUND");

		if (isNotFound) {
			throw error(404, "Note not found or has been unpublished");
		}
		console.error(
			"[p/[slug]/+page.server.ts] Error loading published note:",
			err,
		);
		throw error(404, "Note not found or has been unpublished");
	}
};
