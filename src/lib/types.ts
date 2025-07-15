export type NotePageSettingsType = {
	showtoolbar: boolean;
	showbubblemenu: boolean;
	compressmedia: boolean;
	spellcheck: boolean;
	locked: boolean;
};

export const DEFAULT_SETTINGS: NotePageSettingsType = {
	showtoolbar: true,
	showbubblemenu: true,
	compressmedia: false,
	spellcheck: true,
	locked: false
};
