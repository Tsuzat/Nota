import { authClient } from "./auth-client";
import { secureStorage } from "./platform/securestorage";
import { ISDESKTOP } from "./utils";

/**
 * Universal sign out handler.
 *
 * - Revokes the server session via Better Auth
 * - On desktop, also clears the stored bearer token from Stronghold
 */
export async function signOut(): Promise<void> {
	try {
		await authClient.signOut();
	} catch (e) {
		console.error("Error during server sign out:", e);
	}

	if (ISDESKTOP) {
		try {
			await secureStorage.removeItem("access_token");
		} catch (e) {
			console.error("Error clearing access token from Stronghold:", e);
		}
	}
}
