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
