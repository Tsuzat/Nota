import { HocuspocusProvider } from "@hocuspocus/provider";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import { Doc } from "yjs";
import { authClient } from "#lib/auth-client.ts";
import { getAuthSession } from "#lib/auth-session.svelte.ts";
import { secureStorage } from "#lib/platform/securestorage.ts";
import { ISDESKTOP } from "#lib/utils.ts";
import { PUBLIC_REALTIME_URL } from "$app/env/public";

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

export const realtimeProvider = async (
	id: string,
	name: string,
	image?: string,
) => {
	let token: string | undefined;
	if (ISDESKTOP) {
		token = await secureStorage.getItem("access_token");
	}

	if (!token) {
		const currentSession = getAuthSession();
		token = currentSession.data?.session?.token;

		if (!token) {
			try {
				const sessionRes = await authClient.getSession();
				token = sessionRes.data?.session?.token;
				if (token && ISDESKTOP) {
					void secureStorage
						.setItem("access_token", token)
						.catch(console.error);
				}
			} catch (e) {
				console.error(
					"Failed to retrieve auth token for realtime provider:",
					e,
				);
			}
		}
	}

	console.log("Token = ", token);
	const ydoc = new Doc();
	const provider = new HocuspocusProvider({
		url: PUBLIC_REALTIME_URL,
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
				user: { name, color: getRandomColor(), image },
				render: (user) => {
					const cursor = document.createElement("span");
					cursor.classList.add("collaboration-carets__caret");
					cursor.setAttribute("style", `border-color: ${user.color}`);

					const label = document.createElement("div");
					label.classList.add("collaboration-carets__label");
					label.setAttribute("style", `background-color: ${user.color}`);

					const avatarWrapper = document.createElement("div");
					avatarWrapper.classList.add("collaboration-carets__avatar");

					if (user.image) {
						const img = document.createElement("img");
						img.src = user.image;
						img.alt = user.name || "User";
						avatarWrapper.appendChild(img);
					} else {
						const initials = document.createElement("span");
						initials.innerText = user.name
							? user.name.charAt(0).toUpperCase()
							: "?";
						avatarWrapper.appendChild(initials);
					}

					const nameSpan = document.createElement("span");
					nameSpan.classList.add("collaboration-carets__name");
					nameSpan.innerText = user.name || "Unknown";

					label.appendChild(avatarWrapper);
					label.appendChild(nameSpan);
					cursor.appendChild(label);
					return cursor;
				},
			}),
		],
	};
};
