import { TiptapTransformer } from "@hocuspocus/transformer";
import { isDeepStrictEqual } from "node:util";
import * as Y from "yjs";

const BASE64_PATTERN =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

export function prepareRestoreContent(
  restoreUpdate: string,
  expectedContent: Record<string, unknown>,
): Array<Y.XmlElement | Y.XmlText> {
  if (!restoreUpdate || !BASE64_PATTERN.test(restoreUpdate)) {
    throw new Error("Invalid restore_update base64");
  }

  const update = new Uint8Array(Buffer.from(restoreUpdate, "base64"));
  const snapshot = new Y.Doc();

  try {
    Y.applyUpdate(snapshot, update);

    const sharedFields = Array.from(snapshot.share.keys());
    if (sharedFields.length !== 1 || sharedFields[0] !== "default") {
      throw new Error(
        "Restore update must contain only the default document field",
      );
    }

    const decodedContent = TiptapTransformer.fromYdoc(snapshot, "default");
    if (!isDeepStrictEqual(decodedContent, expectedContent)) {
      throw new Error("Restore update does not match the requested content");
    }

    return snapshot
      .getXmlFragment("default")
      .toArray()
      .map((node) => node.clone());
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Invalid restore update");
  } finally {
    snapshot.destroy();
  }

}

export function replaceDocumentContent(
  document: Y.Doc,
  restoredContent: Array<Y.XmlElement | Y.XmlText>,
): void {
  document.transact(() => {
    const fragment = document.getXmlFragment("default");
    if (fragment.length > 0) {
      fragment.delete(0, fragment.length);
    }
    fragment.insert(0, restoredContent);
  }, "version-restore");
}
