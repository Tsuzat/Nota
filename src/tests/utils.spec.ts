import { validateURL } from '../lib/utils';
import { describe, expect, it, test, vi } from 'vitest';

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
		'https://shad-editor.tsuzat.com/'
	];
	const invalidUrls = [
		'google-com',
		'google',
		'some random text',
		'https://',
		'https://google',
		'https://google.',
		'https://google.c'
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
