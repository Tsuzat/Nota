import { isTauri } from '@tauri-apps/api/core';
import { type } from '@tauri-apps/plugin-os';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { isMac } from './components/edra/utils';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export const ISTAURI = isTauri();
export const ISMACOS = ISTAURI ? type() === 'macos' : isMac;
export const ISWINDOWS = ISTAURI ? type() === 'windows' : false;

export const getNewUUID = (uuids: string[]) => {
	const threshold = 1000;
	const i = 0;
	while (i < threshold) {
		const uuid = crypto.randomUUID();
		if (!uuids.includes(uuid)) {
			return uuid;
		}
	}
	throw new Error('Could not generate a new UUID');
};

export const getKeyboardShortcut = (key: string, ctrl = false, shift = false, alt = false) => {
	const modifiers: string[] = [];
	if (ISMACOS) {
		if (ctrl) modifiers.push('⌘');
		if (shift) modifiers.push('⇧');
		if (alt) modifiers.push('⌥');
	} else {
		if (ctrl) modifiers.push('Ctrl');
		if (shift) modifiers.push('Shift');
		if (alt) modifiers.push('Alt');
	}

	return [...modifiers, key].join(' ');
};

export function handleKeydown(e: KeyboardEvent) {
	if (e.metaKey || e.ctrlKey) {
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			history.back();
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			history.forward();
		}
	}
}

export enum FileType {
	IMAGE = 'image',
	VIDEO = 'video',
	AUDIO = 'audio',
	DOCS = 'docs',
	UNKNOWN = 'unknown'
}

/**
 * Helper function to get web standard file extensions
 * @param fileType - FileType
 * @returns - Array of file extensions
 */
export const getFileTypeExtensions = (fileType: FileType) => {
	switch (fileType) {
		case FileType.IMAGE:
			return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
		case FileType.VIDEO:
			return ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];
		case FileType.AUDIO:
			return ['mp3', 'wav', 'ogg', 'flac', 'aac'];
		case FileType.DOCS:
			return ['docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls'];
		case FileType.UNKNOWN:
			return [];
	}
};
