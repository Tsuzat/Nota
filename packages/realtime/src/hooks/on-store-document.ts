import type { onStoreDocumentPayload } from "@hocuspocus/server";
import { updateContentState } from "@nota/db/data/notes";
import * as Y from "yjs";

export const onStoreDocument = async (data: onStoreDocumentPayload) => {
	const { document, documentName } = data;

	const state = Buffer.from(Y.encodeStateAsUpdate(document));
	console.log(
		`[onStoreDocument] Saving ${state.byteLength} bytes for note ${documentName}`,
	);
	await updateContentState(documentName, state);
	console.log(`[onStoreDocument] Successfully saved note ${documentName}`);
};
