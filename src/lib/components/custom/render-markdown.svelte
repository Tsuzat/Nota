<script lang="ts">
	import { cn } from '$lib/utils';
	import { Marked } from 'marked';
	import markedKatex from 'marked-katex-extension';
	import { markedHighlight } from 'marked-highlight';
	import hljs from 'highlight.js';

	interface Props {
		data: string;
		class?: string;
	}
	const { data, class: className }: Props = $props();

	const renderer = {
		code({ text, lang }: { text: string; lang?: string }) {
			const language = lang || 'plaintext';
			return `<div class="relative rounded-md border bg-muted my-2">
			<div class="absolute left-3 top-1.5 text-xs text-muted-foreground select-none font-mono capitalize">${language}</div>
			<div class="overflow-x-auto p-3 pt-8">
				<pre class="!bg-transparent !p-0 !border-0 !m-0"><code class="hljs language-${language}">${text}</code></pre>
			</div>
		</div>`;
		}
	};
</script>

{#await new Marked( markedKatex( { nonStandard: true } ), markedHighlight( { async: true, emptyLangClass: 'hljs bg-muted border p-1', langPrefix: 'hljs language-', highlight(code, lang, info) {
				const language = hljs.getLanguage(lang) ? lang : 'plaintext';
				return hljs.highlight(code, { language }).value;
			} } ), { renderer } ).parse(data)}
	<div>Loading...</div>
{:then html}
	<div class={cn('tiptap Prosemirror markedrenderer', className)}>
		{@html html}
	</div>
{/await}
