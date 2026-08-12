import { describe, expect, test } from "bun:test";
import { TiptapTransformer } from "@hocuspocus/transformer";
import * as Y from "yjs";
import { prepareRestoreContent, replaceDocumentContent } from "./restore";

const content = (text: string) => ({
  type: "doc",
  content: [
    {
      type: "paragraph",
      ...(text ? { content: [{ type: "text", text }] } : {}),
    },
  ],
});

const encodeContent = (value: ReturnType<typeof content>) => {
  const document = TiptapTransformer.toYdoc(value, "default");
  const update = Y.encodeStateAsUpdate(document);
  document.destroy();
  return update;
};

const prepareContent = (value: ReturnType<typeof content>) =>
  prepareRestoreContent(
    Buffer.from(encodeContent(value)).toString("base64"),
    value,
  );

describe("collaborative version restore", () => {
  test("replaces existing content and emits a convergent update", () => {
    const current = TiptapTransformer.toYdoc(content("current"), "default");
    current.getMap("metadata").set("kept", true);

    const peer = new Y.Doc();
    Y.applyUpdate(peer, Y.encodeStateAsUpdate(current));

    const restoredContent = prepareContent(content("restored"));
    let emittedUpdate: Uint8Array | undefined;
    current.on("update", (update, origin) => {
      if (origin === "version-restore") emittedUpdate = update;
    });

    replaceDocumentContent(current, restoredContent);

    expect(TiptapTransformer.fromYdoc(current, "default")).toEqual(
      content("restored"),
    );
    expect(current.getMap("metadata").get("kept")).toBe(true);
    expect(emittedUpdate).toBeDefined();

    Y.applyUpdate(peer, emittedUpdate!);
    expect(TiptapTransformer.fromYdoc(peer, "default")).toEqual(
      content("restored"),
    );

    current.destroy();
    peer.destroy();
  });

  test("supports repeated and empty-content restores", () => {
    const current = TiptapTransformer.toYdoc(content("current"), "default");

    replaceDocumentContent(current, prepareContent(content("first")));
    replaceDocumentContent(current, prepareContent(content("")));

    expect(TiptapTransformer.fromYdoc(current, "default")).toEqual(
      content(""),
    );
    current.destroy();
  });

  test("safely retries the same encoded restore", () => {
    const current = TiptapTransformer.toYdoc(content("current"), "default");
    const restored = content("restored");
    const encoded = Buffer.from(encodeContent(restored)).toString("base64");

    replaceDocumentContent(
      current,
      prepareRestoreContent(encoded, restored),
    );
    replaceDocumentContent(
      current,
      prepareRestoreContent(encoded, restored),
    );

    expect(TiptapTransformer.fromYdoc(current, "default")).toEqual(restored);
    current.destroy();
  });

  test("rejects malformed and mismatched updates", () => {
    expect(() =>
      prepareRestoreContent("not-base64", content("restored")),
    ).toThrow("Invalid restore_update base64");

    const update = encodeContent(content("different"));
    expect(() =>
      prepareRestoreContent(
        Buffer.from(update).toString("base64"),
        content("restored"),
      ),
    ).toThrow("does not match");
  });

  test("rejects updates containing additional shared fields", () => {
    const snapshot = TiptapTransformer.toYdoc(content("restored"), "default");
    snapshot.getMap("metadata").set("unexpected", true);
    const encoded = Buffer.from(Y.encodeStateAsUpdate(snapshot)).toString(
      "base64",
    );

    expect(() => prepareRestoreContent(encoded, content("restored"))).toThrow(
      "only the default document field",
    );
    snapshot.destroy();
  });
});
