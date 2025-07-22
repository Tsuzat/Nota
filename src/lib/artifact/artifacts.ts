import { PUBLIC_NOTA_ARTIFACT_URL } from '$env/static/public';
import type { Component } from 'svelte';
import Mac from './icons/mac.svelte';
import Windows from './icons/windows.svelte';
import Linux from './icons/linux.svelte';
import latest from '$lib/assets/jsons/latest.json';

export interface Artifact {
	icon?: Component;
	osName: string;
	downloadUrl: string;
	isCurrent: boolean;
}

const osIcons: Record<string, Component> = {
	MacOS: Mac,
	Windows: Windows,
	Linux: Linux
};

const artifactLabels: Record<string, string> = {
	'darwin-aarch64': 'MacOS Apple Silicon',
	'darwin-x86_64': 'MacOS Intel Chip',
	'linux-x86_64': 'Linux x86_64',
	'windows-x86_64': 'Windows',
	'windows-aarch64': 'Windows ARM'
};

// Maps platformKey to OS category
function getOSBaseLabel(platformKey: string): keyof typeof osIcons | undefined {
	if (platformKey.startsWith('darwin')) return 'MacOS';
	if (platformKey.startsWith('windows')) return 'Windows';
	if (platformKey.startsWith('linux')) return 'Linux';
	return undefined;
}

export function detectCurrentPlatform(): string {
	const userAgent = navigator.userAgent.toLowerCase();

	if (userAgent.includes('mac')) {
		return 'darwin-aarch64';
	}

	if (userAgent.includes('win')) {
		// Windows ARM detection
		if (userAgent.includes('arm') || userAgent.includes('wow64')) {
			return 'windows-aarch64';
		}
		return 'windows-x86_64';
	}

	if (userAgent.includes('linux')) {
		// Linux ARM detection
		if (userAgent.includes('arm') || userAgent.includes('aarch64')) {
			return 'linux-aarch64';
		}
		return 'linux-x86_64';
	}

	// Default fallback
	return 'darwin-aarch64';
}

export async function getArtifacts(): Promise<Artifact[]> {
	const url = PUBLIC_NOTA_ARTIFACT_URL;

	// const response = await fetch(url);
	// if (!response.ok) throw new Error(`Failed to fetch latest.json: ${response.statusText}`);

	const json = latest;
	const platforms = json.platforms;
	if (!platforms) throw new Error('No platforms data found in JSON');

	const currentPlatform = detectCurrentPlatform();

	const artifacts: Artifact[] = Object.entries(platforms).map(
		([platformKey, data]: [string, any]) => {
			const osBaseLabel = getOSBaseLabel(platformKey);
			const icon = osBaseLabel ? osIcons[osBaseLabel] : undefined;
			return {
				osName: artifactLabels[platformKey] || platformKey,
				downloadUrl: data.url,
				isCurrent: currentPlatform === platformKey,
				icon
			};
		}
	);

	return artifacts;
}
