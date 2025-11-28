<script lang="ts">
	import { cn } from '$lib/utils';
	import { marked } from 'marked';
	import markedKatex from 'marked-katex-extension';
	import { markedHighlight } from 'marked-highlight';
	import hljs from 'highlight.js';

	interface Props {
		data: string;
		class?: string;
	}
	const { data, class: className }: Props = $props();
</script>

{#await marked
	.use(markedKatex({ nonStandard: true }))
	.use(markedHighlight( { async: true, emptyLangClass: 'hljs bg-muted border p-1', langPrefix: 'hljs language-', highlight(code, lang, info) {
					const language = hljs.getLanguage(lang) ? lang : 'plaintext';
					return hljs.highlight(code, { language }).value;
				} } ))
	.parse(data)}
	<div>Loading...</div>
{:then html}
	<div class={cn('tiptap Prosemirror markedrenderer', className)}>
		{@html html}
	</div>
{/await}

<style>
	:global(.markedrenderer pre) {
		background-color: var(--color-muted);
		padding: 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
	}
</style>
