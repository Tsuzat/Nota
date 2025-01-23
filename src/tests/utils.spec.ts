import { getIconTypeAndData } from '$lib/components/icons/utils';
import { validateURL } from '$lib/utils';
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
		hide: () => Promise.resolve(),
		listen: () => Promise.resolve()
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
	const goodCases = [
		// URL test cases
		{
			input: 'url:https://example.com/image.png',
			expectedType: 'url',
			expectedIcon: 'https://example.com/image.png'
		},
		{
			input: 'url:https://cdn.site.org/logo.jpg',
			expectedType: 'url',
			expectedIcon: 'https://cdn.site.org/logo.jpg'
		},
		{
			input: 'url:http://subdomain.website.net/icon.gif',
			expectedType: 'url',
			expectedIcon: 'http://subdomain.website.net/icon.gif'
		},
		{
			input: 'url:https://s3.amazonaws.com/bucket/file.webp',
			expectedType: 'url',
			expectedIcon: 'https://s3.amazonaws.com/bucket/file.webp'
		},

		// SVG test cases
		{ input: 'svg:<path d="M12 12"/>', expectedType: 'svg', expectedIcon: '<path d="M12 12"/>' },
		{
			input: 'svg:<g fill="red"><circle cx="10" cy="10" r="5"/></g>',
			expectedType: 'svg',
			expectedIcon: '<g fill="red"><circle cx="10" cy="10" r="5"/></g>'
		},
		{
			input: 'svg:<rect x="0" y="0" width="100" height="100"/>',
			expectedType: 'svg',
			expectedIcon: '<rect x="0" y="0" width="100" height="100"/>'
		},
		{
			input: 'svg:<polygon points="200,10 250,190 160,210"/>',
			expectedType: 'svg',
			expectedIcon: '<polygon points="200,10 250,190 160,210"/>'
		},

		// Emoji test cases
		{ input: 'emoji:❤️', expectedType: 'emoji', expectedIcon: '❤️' },
		{ input: 'emoji:😂', expectedType: 'emoji', expectedIcon: '😂' },
		{ input: 'emoji:🚀', expectedType: 'emoji', expectedIcon: '🚀' },
		{ input: 'emoji:🤔', expectedType: 'emoji', expectedIcon: '🤔' }
	];

	goodCases.forEach((gCase) => {
		test(`should return icon type "${gCase.expectedType}" for "${gCase.input}"`, () => {
			const { input, expectedType, expectedIcon } = gCase;
			expect(getIconTypeAndData(input)).toEqual({ type: expectedType, icon: expectedIcon });
		});
	});
});
