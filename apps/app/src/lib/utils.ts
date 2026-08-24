import { type } from "@tauri-apps/plugin-os";

export const ISDESKTOP =
	typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
export const ISMACOS = () => {
	if (ISDESKTOP) {
		return type() === "macos";
	}
	return (
		navigator.userAgent.includes("Macintosh") ||
		navigator.userAgent.includes("Mac OS X")
	);
};
export const ISWINDOWS = () => {
	if (ISDESKTOP) {
		return type() === "windows";
	}
	return (
		navigator.userAgent.includes("Windows") ||
		navigator.userAgent.includes("Win32")
	);
};

export const getKeyboardShortcut = (
	key: string,
	ctrl = false,
	shift = false,
	alt = false,
) => {
	const modifiers: string[] = [];
	if (ISMACOS()) {
		if (ctrl) modifiers.push("⌘");
		if (shift) modifiers.push("⇧");
		if (alt) modifiers.push("⌥");
	} else {
		if (ctrl) modifiers.push("Ctrl");
		if (shift) modifiers.push("Shift");
		if (alt) modifiers.push("Alt");
	}

	return [...modifiers, key].join(" ");
};

export enum FileType {
	IMAGE = "image/*",
	VIDEO = "video/*",
	AUDIO = "audio/*",
	DOCS = "docs/*",
	IFRAME = "iframe",
	UNKNOWN = "unknown",
}

/**
 * Helper function to get web standard file extensions
 * @param fileType - FileType
 * @returns - Array of file extensions
 */
export const getFileTypeExtensions = (fileType: FileType) => {
	switch (fileType) {
		case FileType.IMAGE:
			return ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];
		case FileType.VIDEO:
			return ["mp4", "webm", "ogg", "mov", "avi", "mkv"];
		case FileType.AUDIO:
			return ["mp3", "wav", "ogg", "flac", "aac"];
		case FileType.DOCS:
			return ["docx", "doc", "pptx", "ppt", "xlsx", "xls"];
		case FileType.UNKNOWN:
			return [];
		default:
			return [];
	}
};

/**
 * Get file MIME type from file extension
 * @param fileName - file name with extension
 * @returns - file type or null if unknown
 */
export const getFileTypeFromExtension = (fileName: string): string | null => {
	const extension = fileName.toLowerCase().split(".").pop();

	if (!extension) return null;

	const mimeTypes: Record<string, string> = {
		// Images
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
		png: "image/png",
		gif: "image/gif",
		bmp: "image/bmp",
		webp: "image/webp",
		svg: "image/svg+xml",
		ico: "image/x-icon",
		tiff: "image/tiff",
		tif: "image/tiff",

		// Videos
		mp4: "video/mp4",
		avi: "video/x-msvideo",
		mov: "video/quicktime",
		wmv: "video/x-ms-wmv",
		flv: "video/x-flv",
		webm: "video/webm",
		mkv: "video/x-matroska",
		m4v: "video/x-m4v",
		"3gp": "video/3gpp",
		ogv: "video/ogg",

		// Audio
		mp3: "audio/mpeg",
		wav: "audio/wav",
		flac: "audio/flac",
		aac: "audio/aac",
		ogg: "audio/ogg",
		m4a: "audio/mp4",
		wma: "audio/x-ms-wma",
		opus: "audio/opus",
		aiff: "audio/aiff",

		// Docs
		docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		doc: "application/msword",
		pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
		ppt: "application/vnd.ms-powerpoint",
		xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		xls: "application/vnd.ms-excel",
		pdf: "application/pdf",
	};

	return mimeTypes[extension] ?? null;
};

/**
 * Format a timestamp as a human friendly relative date,
 * e.g. "Today at 4:20 PM", "Yesterday at 9:05 AM", "Aug 12 at 3:00 PM"
 */
export function formatDate(val: number | Date | string | null | undefined) {
	if (!val) return "";
	const date = typeof val === "number" ? new Date(val * 1000) : new Date(val);
	if (Number.isNaN(date.getTime())) return "";

	const now = new Date();
	const diffTime = Math.abs(now.getTime() - date.getTime());
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

	const timeStr = date.toLocaleTimeString(undefined, {
		hour: "numeric",
		minute: "2-digit",
	});

	if (date.toDateString() === now.toDateString()) {
		return `Today at ${timeStr}`;
	}
	if (diffDays === 1) {
		return `Yesterday at ${timeStr}`;
	}
	return `${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} at ${timeStr}`;
}

// Format file size
export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
