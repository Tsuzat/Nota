import { getContent } from "@nota/db/data/notes";
import * as Y from "yjs";

export const onLoadDocument = async (data: any) => {
	const { document, documentName } = data;

	const content = await getContent(documentName);

	if (content) {
		const update = new Uint8Array(content);
		Y.applyUpdate(document, update);
	}

	return document;
};
