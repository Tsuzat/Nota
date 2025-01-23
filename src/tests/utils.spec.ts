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
		{
			icon: '<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M8 6v12M8 6L5 9m7 3c0-4.5.583-6 3.5-6S19 7.5 19 12s-.583 6-3.5 6s-3.5-1.5-3.5-6m1-5l5 10\"/>',
			type: 'svg'
		},
		{
			icon: '<defs><mask id=\"letsIconsAddRingDuotoneLine0\"><g fill=\"none\" stroke-width=\"1.2\"><circle cx=\"12\" cy=\"12\" r=\"8.4\" stroke=\"silver\" stroke-opacity=\".25\"/><path stroke=\"#fff\" stroke-linecap=\"square\" d=\"M12 15V9m3 3H9\"/></g></mask></defs><path fill=\"currentColor\" d=\"M0 0h24v24H0z\" mask=\"url(#letsIconsAddRingDuotoneLine0)\"/>',
			type: 'svg'
		},
		{
			icon: '<g fill=\"none\" stroke=\"currentColor\"><path d=\"M9.15 7.831a2.976 2.976 0 1 1 5.701 0l-1.564 5.211c-.07.234-.105.351-.159.447a1 1 0 0 1-.654.487C12.366 14 12.244 14 12 14s-.366 0-.474-.024a1 1 0 0 1-.654-.487c-.054-.096-.09-.213-.16-.447z\"/><circle cx=\"12\" cy=\"19\" r=\"2\"/></g>',
			type: 'svg'
		},
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
