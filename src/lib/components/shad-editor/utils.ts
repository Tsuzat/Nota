import { OS } from '$lib/contants';
import { convertFileSrc } from '@tauri-apps/api/core';
import { resolve } from '@tauri-apps/api/path';
import { writeFile } from '@tauri-apps/plugin-fs';
import Printd from 'printd';
import { toast } from 'svelte-sonner';

/**
 * Function to handle raw images from the file drop and save them in the assets folder
 * @param file File - File object to be handled
 * @param path string - Path of the workspace
 * @returns string - Path of the file
 */
export async function handleRawImage(file: File, path: string): Promise<string> {
	const id = toast.loading('Saving image to assets...');
	const fileReader = new FileReader();

	// Construct the asset path
	const assetsPath = await resolve(
		path + `${OS === 'windows' ? '\\' : '/'}assets` + `${OS === 'windows' ? '\\' : '/'}${file.name}`
	);

	// Create a promise to handle the asynchronous file writing
	return new Promise((resolve, reject) => {
		fileReader.onload = async () => {
			if (fileReader.result instanceof ArrayBuffer) {
				const binary = new Uint8Array(fileReader.result);
				try {
					await writeFile(assetsPath, binary);
					resolve(convertFileSrc(assetsPath));
					toast.success('Image saved successfully!', { id });
				} catch (err) {
					toast.error('Error saving image!', { id });
					reject(`Error saving file: ${err}`);
				}
			}
		};
		fileReader.onerror = (err) => {
			toast.error('Error saving image!', { id });
			reject(`Error reading file: ${err}`);
		};
		fileReader.readAsArrayBuffer(file);
	});
}

/**
 * Function to check if the file with given path is an image or not
 * @param path string - Path of the file
 * @returns boolean - Returns true if the file is an image
 */
export function checkIfImage(path: string): boolean {
	return (
		path.endsWith('.png') ||
		path.endsWith('.jpg') ||
		path.endsWith('.jpeg') ||
		path.endsWith('.gif') ||
		path.endsWith('.svg') ||
		path.endsWith('.webp') ||
		path.endsWith('.bmp')
	);
}

export function exportPDF(element: HTMLElement, title: string) {
	// Get the current page's styles (including TailwindCSS)
	const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
		.map((style) => style.outerHTML)
		.join('');

	const editor = `
	.tiptap pre code {
		--tw-text-opacity: 1;
		color: rgb(56 58 66 / var(--tw-text-opacity, 1));
	}
	`;
	console.log(styles);

	const p = new Printd();
	p.print(element, [styles, editor]);
}
