import type { onAuthenticatePayload } from "@hocuspocus/server";
import { auth } from "@nota/auth";
import { getNoteUserPermission } from "@nota/db/data/permissions";

export const onAuthenticate = async (data: onAuthenticatePayload) => {
	const { token, requestHeaders, documentName, connectionConfig } = data;

	// Build headers — merge upgrade request headers + bearer token
	const headers = new Headers(requestHeaders);
	if (token) {
		headers.set("Authorization", `Bearer ${token}`);
	}

	const session = await auth.api.getSession({ headers });
	if (!session) throw new Error("Unauthorized");

	const userId = session.user.id;
	const noteId = documentName;

	// Check permissions using the DB function
	const permission = await getNoteUserPermission(noteId, userId);
	if (!permission) throw new Error("Note not found or Access denied");

	// Owner gets full access
	if (permission.isOwner) {
		return { user: session.user, noteId };
	}

	// Guests
	if (!permission.role) throw new Error("Access denied");

	if (permission.role === "viewer" || permission.role === "comment") {
		connectionConfig.readOnly = true;
	}

	return { user: session.user, noteId };
};
