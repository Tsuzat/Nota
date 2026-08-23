import type { onStoreDocumentPayload } from "@hocuspocus/server";
import { mayCreateAutoCloudSnapshot } from "@nota/db/data/note_snapshots";
import { updateContentState } from "@nota/db/data/notes";
import { redis } from "bun";
import * as Y from "yjs";

const LAST_AUTO_SNAPSHOT_KEY = (id: string) => `last_auto_snapshot:${id}`;

export const onStoreDocument = async (data: onStoreDocumentPayload) => {
	const { document, documentName } = data;

	const state = Buffer.from(Y.encodeStateAsUpdate(document));
	console.log(
		`[onStoreDocument] Saving ${state.byteLength} bytes for note ${documentName}`,
	);
	await updateContentState(documentName, state);
	console.log(`[onStoreDocument] Successfully saved note ${documentName}`);

	// Periodically create auto snapshot in background without blocking
	void (async () => {
		try {
			const key = LAST_AUTO_SNAPSHOT_KEY(documentName);
			const exists = await redis.get(key);
			if (exists) {
				return;
			}

			const snapshot = await mayCreateAutoCloudSnapshot(documentName, state);
			await redis.set(key, "true", "EX", 10 * 60);

			if (snapshot) {
				console.log(
					`[onStoreDocument] Created auto snapshot for note ${documentName}`,
				);
			}
		} catch (err) {
			console.error(
				`[onStoreDocument] Auto snapshot failed for note ${documentName}:`,
				err,
			);
		}
	})();
};
