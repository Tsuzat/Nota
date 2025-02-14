import { SvelteNodeViewRenderer } from 'svelte-tiptap';
import ImageExtendedComponent from './image-extended-component.svelte';
import Image from '@tiptap/extension-image';

export const ImageExtension = Image.extend({
	addAttributes() {
		return {
			src: {
				default: null
			},
			alt: {
				default: null
			},
			title: {
				default: null
			},
			width: {
				default: '100%'
			},
			height: {
				default: null
			},
			align: {
				default: 'left'
			}
		};
	},

	addNodeView: () => {
		return SvelteNodeViewRenderer(ImageExtendedComponent);
	}
});
