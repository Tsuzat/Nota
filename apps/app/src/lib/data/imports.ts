import { ISDESKTOP } from "../utils";

// ─── importFile ─────────────────────────────────────────────────────────────
// Universal file import function. On desktop (Tauri), opens a native file
// dialog and reads the file using the filesystem plugin. On browser,
// creates a hidden file input and triggers it.

export async function importFile(
	acceptExtensions: string[] = [".md", ".markdown", ".json", ".txt"],
): Promise<{ name: string; content: string } | null> {
	if (ISDESKTOP) {
		const { open } = await import("@tauri-apps/plugin-dialog");
		const { readTextFile } = await import("@tauri-apps/plugin-fs");

		// Convert dot-prefixed extensions (.md, .json) to just the extension name (md, json)
		const cleanExtensions = acceptExtensions.map((ext) =>
			ext.startsWith(".") ? ext.slice(1) : ext,
		);

		const selected = await open({
			multiple: false,
			filters: [
				{
					name: `Documents (${cleanExtensions.join(", ")})`,
					extensions: cleanExtensions,
				},
			],
		});

		if (!selected || Array.isArray(selected)) {
			return null;
		}

		const content = await readTextFile(selected);

		// Extract filename from path (cross-platform)
		const name = selected.split(/[\\/]/).pop() || "imported_file";

		return { name, content };
	}

	return new Promise((resolve) => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = acceptExtensions.join(",");

		input.onchange = (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) {
				resolve(null);
				return;
			}

			const reader = new FileReader();
			reader.onload = (readerEvent) => {
				resolve({
					name: file.name,
					content: (readerEvent.target?.result as string) || "",
				});
			};
			reader.onerror = () => resolve(null);
			reader.readAsText(file);
		};

		input.click();
	});
}
