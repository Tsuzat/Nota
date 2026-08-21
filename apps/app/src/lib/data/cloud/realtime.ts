import { HocuspocusProvider } from "@hocuspocus/provider";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import { Doc } from "yjs";
import { secureStorage } from "#lib/platform/securestorage.ts";
import { ISDESKTOP } from "#lib/utils.ts";

const getRandomColor = () =>
	[
		"#FF4136",
		"#FF851B",
		"#FFDC00",
		"#2ECC40",
		"#0074D9",
		"#01FF70",
		"#B10DC9",
		"#FF4136",
		"#FF851B",
		"#FFDC00",
		"#2ECC40",
		"#0074D9",
		"#01FF70",
		"#B10DC9",
	][Math.floor(Math.random() * 7)];

export const realtimeProvider = async (id: string, name: string) => {
	let token: string | undefined;
	if (ISDESKTOP) {
		token = await secureStorage.getItem("access_token");
	}
	const ydoc = new Doc();
	const provider = new HocuspocusProvider({
		url: "",
		name: id,
		document: ydoc,
		token,
	});

	return {
		ydoc,
		provider: provider,
		extensions: [
			Collaboration.configure({ document: ydoc, provider }),
			CollaborationCaret.configure({
				provider,
				user: { name, color: getRandomColor() },
			}),
		],
	};
};
