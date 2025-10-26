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
	IMAGE = 'image/*',
	VIDEO = 'video/*',
	AUDIO = 'audio/*',
	DOCS = 'docs/*',
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

export const getFileTypeFromExtension = (fileName: string): FileType => {
	const extension = fileName.toLowerCase().split('.').pop();

	if (!extension) return FileType.UNKNOWN;

	const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif'];
	const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v', '3gp', 'ogv'];
	const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'opus', 'aiff'];
	const docsExtensions = ['docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'pdf'];

	if (imageExtensions.includes(extension)) {
		return FileType.IMAGE;
	} else if (videoExtensions.includes(extension)) {
		return FileType.VIDEO;
	} else if (audioExtensions.includes(extension)) {
		return FileType.AUDIO;
	} else if (docsExtensions.includes(extension)) {
		return FileType.DOCS;
	} else return FileType.UNKNOWN;
};

export function timeAgo(date: string): string {
	const now = new Date();
	const then = new Date(date);
	const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

	// Just now: less than 60 seconds ago
	if (diffInSeconds < 60) {
		return diffInSeconds < 5
			? 'Just now'
			: `${diffInSeconds} sec${diffInSeconds !== 1 ? 's' : ''} ago`;
	}

	// Minutes ago: less than 60 minutes ago
	const diffInMinutes = Math.floor(diffInSeconds / 60);
	if (diffInMinutes < 60) {
		return `${diffInMinutes} min${diffInMinutes !== 1 ? 's' : ''} ago`;
	}

	// Hours ago: less than 24 hours ago
	const diffInHours = Math.floor(diffInMinutes / 60);
	if (diffInHours < 24) {
		return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
	}

	// Yesterday: if it was yesterday
	const yesterday = new Date(now);
	yesterday.setDate(yesterday.getDate() - 1);
	if (
		then.getDate() === yesterday.getDate() &&
		then.getMonth() === yesterday.getMonth() &&
		then.getFullYear() === yesterday.getFullYear()
	) {
		return 'Yesterday';
	}

	// Day of week: if it was within the last week
	const diffInDays = Math.floor(diffInHours / 24);
	if (diffInDays < 7) {
		const daysOfWeek = [
			'Sunday',
			'Monday',
			'Tuesday',
			'Wednesday',
			'Thursday',
			'Friday',
			'Saturday'
		];
		return daysOfWeek[then.getDay()];
	}

	// Date format: if it was more than a week ago
	const months = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec'
	];
	return `${months[then.getMonth()]}, ${then.getDate()}`;
}

export function getUserIntials(name?: string) {
	if (!name) return 'U';
	const names = name.split(' ');
	if (names.length > 1) {
		return names[0][0] + names[1][0];
	} else {
		if (names[0].length > 1) {
			return names[0][0] + names[0][1];
		} else {
			return names[0][0];
		}
	}
}
