import type { ReleaseAssetsResponse } from "#components/artefact/artifacts.ts";
import { GITHUB_API_TOKEN } from "$app/env/private";
import { query } from "$app/server";

interface ReleaseAsset {
	label: string;
	url: string;
}

type OSType = "mac" | "windows" | "linux";

export const getArtefacts = query(async () => {
	console.log(
		"[data.remote.ts] getArtefacts called. Checking GITHUB_API_TOKEN...",
	);
	if (!GITHUB_API_TOKEN) {
		console.warn("[data.remote.ts] GITHUB_API_TOKEN is missing!");
	}

	try {
		console.log("[data.remote.ts] Fetching latest release from GitHub API...");
		// Call Github API to get latest release
		const res = await fetch(
			"https://api.github.com/repos/Tsuzat/Nota/releases/latest",
			{
				headers: {
					Authorization: `Bearer ${GITHUB_API_TOKEN}`,
					"User-Agent": "Nota-Release-Fetcher",
					Accept: "application/vnd.github+json",
				},
			},
		);

		console.log(`[data.remote.ts] GitHub API response status: ${res.status}`);

		if (!res.ok) {
			const errorText = await res.text();
			console.error(
				`[data.remote.ts] GitHub API error: ${res.status} - ${errorText}`,
			);
			throw new Error(`GitHub API error: ${res.status}`);
		}

		const release = (await res.json()) as any;
		console.log(
			`[data.remote.ts] Successfully parsed JSON. Release tag: ${release?.tag_name}, Assets count: ${release?.assets?.length}`,
		);

		const platforms: Record<OSType, ReleaseAsset[]> = {
			mac: [],
			windows: [],
			linux: [],
		};

		for (const asset of release.assets) {
			const name = asset.name.toLowerCase();
			const url = asset.browser_download_url;

			// macOS
			if (name.endsWith(".dmg")) {
				if (name.includes("aarch64")) {
					platforms.mac.push({ label: "Apple Silicon", url });
				} else if (name.includes("x64") || name.includes("intel")) {
					platforms.mac.push({ label: "Intel", url });
				}
			}

			// Windows
			if (name.endsWith(".exe")) {
				if (name.includes("arm64")) {
					platforms.windows.push({ label: "ARM", url });
				} else if (name.includes("x64")) {
					platforms.windows.push({ label: "x64", url });
				}
			}

			// Linux
			if (name.endsWith(".appimage")) {
				platforms.linux.push({ label: "Linux (AppImage)", url });
			}
			if (name.endsWith(".deb")) {
				platforms.linux.push({ label: "Linux (deb)", url });
			}
			if (name.endsWith(".rpm")) {
				platforms.linux.push({ label: "Linux (rpm)", url });
			}
		}
		const artefacts: ReleaseAssetsResponse = {
			tag: release.tag_name,
			name: release.name,
			published_at: release.published_at,
			platforms,
		};
		console.log(
			`[data.remote.ts] Processed artefacts: ${JSON.stringify(artefacts.platforms)}`,
		);
		return artefacts;
	} catch (error) {
		console.error("[data.remote.ts] Error in getArtefacts:", error);
		return null;
	}
});
