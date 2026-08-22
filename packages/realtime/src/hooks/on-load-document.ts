import type { onLoadDocumentPayload } from "@hocuspocus/server";
import { getContent } from "@nota/db/data/notes";
import * as Y from "yjs";

export const onLoadDocument = async (data: onLoadDocumentPayload) => {
	const { document, documentName } = data;

	const content = await getContent(documentName);

	if (content) {
		const update = new Uint8Array(content);
		if (update.byteLength > 0) {
			console.log(
				`[onLoadDocument] Loaded ${update.byteLength} bytes for note ${documentName}`,
			);
			try {
				Y.applyUpdate(document, update);
			} catch (e) {
				console.error(
					`[onLoadDocument] Failed to apply update for note ${documentName}:`,
					e,
				);
			}
		} else {
			console.log(
				`[onLoadDocument] Empty binary content (0 bytes) for note ${documentName}`,
			);
		}
	} else {
		console.log(
			`[onLoadDocument] No existing content found for note ${documentName}`,
		);
	}

	return document;
};
