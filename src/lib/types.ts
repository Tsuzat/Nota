export type NotePageSettingsType = {
	showtoolbar: boolean;
	showbubblemenu: boolean;
	compressmedia: boolean;
	spellcheck: boolean;
	locked: boolean;
};

export const DEFAULT_SETTINGS: NotePageSettingsType = {
	showtoolbar: false,
	showbubblemenu: true,
	compressmedia: false,
	spellcheck: true,
	locked: false
};
