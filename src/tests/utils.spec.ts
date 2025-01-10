import { getIconType, validateURL } from '$lib/utils';
import { describe, expect, test, vi } from 'vitest';

// Mock platform detection
vi.mock('@tauri-apps/plugin-os', () => ({
	platform: () => 'windows'
}));

vi.mock('@tauri-apps/api/window', () => ({
	getCurrentWindow: () => ({
		label: 'main',
		isVisible: () => true,
		show: () => Promise.resolve(),
		hide: () => Promise.resolve()
	})
}));

describe('Utils Unit Tests for validate URL', () => {
	const validUrls = [
		'https://www.google.com',
		'https://www.google.com/',
		'https://www.google.com/search?q=hello',
		'https://tsuzat.com',
		'https://youtube.com',
		'https://next.shadcn-svelte.com/docs/components/tabs',
		'https://v2.tauri.app/develop/tests/mocking/',
		'https://shad-editor.tsuzat.com/',
		'https://tsuzat.com/path/to/resource?query=hello#fragment',
		'https://youtube.com/search?q=hello&page=2&sort=asc',
		'https://next.shadcn-svelte.com/docs/components/tabs?theme=dark&mode=compact'
	];
	const invalidUrls = [
		'google-com',
		'google',
		'some random text',
		'https://',
		'https://google',
		'https://google.',
		'https://google.c',
		'',
		'//example.com',
		'://example.com',
		'://example.com',
		'.',
		'..',
		'/path/to/resource/../resource',
		'http://user:password@host/path?query#fragment'
	];

	validUrls.forEach((url) => {
		test(`should validate ${url}`, () => {
			expect(validateURL(url)).toBe(true);
		});
	});

	invalidUrls.forEach((url) => {
		test(`should invalidate ${url}`, () => {
			expect(validateURL(url)).toBe(false);
		});
	});
});

describe('Utils Unit Tests for getIconType', () => {
	const icons = [
		{ icon: '😂', type: 'emoji' },
		{ icon: '❤️', type: 'emoji' },
		{ icon: 'FolderIcon', type: 'lucide' },
		{ icon: 'https://placehold.co/800x400/6A00F5/white', type: 'url' }
	];

	const errorIcons = [
		{ icon: '', type: undefined }, // Empty string
		{ icon: null, type: undefined }, // Null
		{ icon: undefined, type: undefined }, // Undefined
		{ icon: 123, type: undefined }, // Number
		{ icon: true, type: undefined }, // Boolean
		{ icon: { a: 1 }, type: undefined }, // Object
		{ icon: [1, 2], type: undefined } // Array
	];

	icons.forEach((icon) => {
		test(`should return icon type "${icon.type}" for "${icon.icon}`, () => {
			expect(getIconType(icon.icon)).toBe(icon.type);
		});
	});

	errorIcons.forEach((icon) => {
		test(`should throw an error for ${JSON.stringify(icon)}`, () => {
			//@ts-ignore
			expect(() => getIconType(icon.icon)).toThrowError();
		});
	});
});
