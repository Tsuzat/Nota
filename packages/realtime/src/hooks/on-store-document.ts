import { updateContentState } from "@nota/db/data/notes";
import * as Y from "yjs";

export const onStoreDocument = async (data: any) => {
	const { document, documentName } = data;

	const state = Buffer.from(Y.encodeStateAsUpdate(document));
	await updateContentState(documentName, state);
};
