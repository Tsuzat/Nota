import type { NodeViewProps } from "@tiptap/core";
import type { Component } from "svelte";
import { SvelteNodeViewRenderer } from "../../index.ts";
import { Video } from "./Video.js";

export const VideoExtended = (component: Component<NodeViewProps>) =>
	Video.extend({
		addAttributes() {
			return {
				src: {
					default: null,
				},
				alt: {
					default: null,
				},
				title: {
					default: null,
				},
				width: {
					default: "100%",
				},
				height: {
					default: null,
				},
				align: {
					default: "left",
				},
			};
		},

		addNodeView: () => {
			return SvelteNodeViewRenderer(component);
		},
	});
