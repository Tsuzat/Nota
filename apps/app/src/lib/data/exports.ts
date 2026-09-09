import { getFullHTML, getHTMLBody } from "@nota/ui";
import { fetch as fetchTauri } from "@tauri-apps/plugin-http";
import { PUBLIC_SERVER_URL } from "$app/env/public";
import { secureStorage } from "../platform/securestorage";
import { ISDESKTOP } from "../utils";

export { getFullHTML, getHTMLBody };

// ─── exportPDF ────────────────────────────────────────────────────────────────
// Sends the full HTML to the server, which proxies it to Gotenberg and returns
// the PDF. Handles authentication for both browser and desktop (Tauri).

export async function exportPDF(name: string, content: string): Promise<void> {
	const html = await getFullHTML(name, content);

	// Build request options
	const requestUrl = `${PUBLIC_SERVER_URL}/api/export/pdf`;
	const body = JSON.stringify({ html });

	let response: Response;

	if (ISDESKTOP) {
		// Desktop (Tauri): Use Tauri HTTP plugin with Bearer auth
		const token = await secureStorage.getItem("access_token");
		response = await fetchTauri(requestUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token || ""}`,
			},
			body,
			credentials: "include",
		});
	} else {
		// Browser: Use standard fetch with cookies
		response = await fetch(requestUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body,
			credentials: "include",
		});
	}

	// Handle error responses
	if (!response.ok) {
		let errorMessage = "PDF export failed";
		try {
			const errorData = await response.json();
			if (errorData.error) errorMessage = errorData.error;
		} catch {
			// If response is not JSON, use status-based messages
			if (response.status === 401)
				errorMessage = "Please sign in to export PDFs";
			else if (response.status === 403)
				errorMessage = "PDF export requires a Pro plan";
			else if (response.status === 413)
				errorMessage = "Note is too large to export";
			else if (response.status >= 500)
				errorMessage = "PDF service is temporarily unavailable";
		}
		throw new Error(errorMessage);
	}

	const blob = await response.blob();
	const sanitizedName = sanitizeFilename(name);
	await exportFile(`${sanitizedName}.pdf`, blob);
}

// ─── exportFile ─────────────────────────────────────────────────────────────
// Universal file export function. On browser, creates a blob URL and triggers an
// <a> download. On desktop (Tauri), opens a native save dialog and writes the
// file using the filesystem plugin.

export async function exportFile(filename: string, blob: Blob): Promise<void> {
	if (ISDESKTOP) {
		// Desktop: Native save dialog + filesystem write
		const { save } = await import("@tauri-apps/plugin-dialog");
		const { writeFile } = await import("@tauri-apps/plugin-fs");

		// Extract extension from filename
		const ext = filename.split(".").pop() || "";
		const filters = ext
			? [{ name: `${ext.toUpperCase()} File`, extensions: [ext] }]
			: [];

		const filePath = await save({
			defaultPath: filename,
			filters,
		});

		if (!filePath) return; // User cancelled the dialog

		const arrayBuffer = await blob.arrayBuffer();
		await writeFile(filePath, new Uint8Array(arrayBuffer));
	} else {
		// Browser: Blob URL + <a> download
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function sanitizeFilename(name: string): string {
	return (
		(name || "Untitled Note")
			.replace(/[^a-zA-Z0-9\s\-_]/g, "")
			.replace(/\s+/g, "-")
			.replace(/^-+|-+$/g, "")
			.substring(0, 100) || "note"
	);
}
