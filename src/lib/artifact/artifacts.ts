import type { Component } from 'svelte';
import Mac from './icons/mac.svelte';
import Windows from './icons/windows.svelte';
import Linux from './icons/linux.svelte';
import { PUBLIC_NOTA_ARTIFACT_URL } from '$env/static/public';

export type ReleaseAssetsResponse = {
	tag: string;
	name: string;
	published_at: string;
	platforms: Record<'mac' | 'windows' | 'linux', { label: string; url: string }[]>;
};
export interface Artifact {
	icon?: Component;
	osName: string;
	downloadUrl: string;
	isCurrent: boolean;
}

const osIcons: Record<string, Component> = {
	mac: Mac,
	windows: Windows,
	linux: Linux
};

const platformMap = {
	mac: ['mac', 'macos', 'darwin'],
	windows: ['win', 'windows'],
	linux: ['linux', 'ubuntu', 'debian', 'arch']
} satisfies Record<string, string[]>;

function detectCurrentOS(): keyof typeof osIcons {
	const ua = navigator.userAgent.toLowerCase();
	if (platformMap.mac.some((key) => ua.includes(key))) return 'mac';
	if (platformMap.windows.some((key) => ua.includes(key))) return 'windows';
	if (platformMap.linux.some((key) => ua.includes(key))) return 'linux';
	return 'mac'; // default fallback
}

/**
 * Fetch and transform GitHub release artifacts into UI-friendly format
 */
export async function getArtifacts(): Promise<Artifact[]> {
	const url = PUBLIC_NOTA_ARTIFACT_URL;

	const response = await fetch(url);
	if (!response.ok) throw new Error(`Failed to fetch release assets: ${response.statusText}`);

	const { platforms }: ReleaseAssetsResponse = await response.json();
	const currentOS = detectCurrentOS();

	const artifacts: Artifact[] = [];

	for (const [os, list] of Object.entries(platforms)) {
		for (const item of list) {
			artifacts.push({
				icon: osIcons[os as keyof typeof osIcons],
				osName: item.label,
				downloadUrl: item.url,
				isCurrent: os === currentOS
			});
		}
	}
	return artifacts;
}
