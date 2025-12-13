<script lang="ts">
import { Streamdown } from 'svelte-streamdown';
import Code from 'svelte-streamdown/code';
import Math from 'svelte-streamdown/math';
import Mermaid from 'svelte-streamdown/mermaid';

interface Props {
  content: string;
  class?: string;
}
const { content, class: className = '' }: Props = $props();
</script>


<Streamdown
    {content}
    class={className}
    components={{ code: Code, mermaid: Mermaid, math: Math }}
    katexConfig={{
        throwOnError: true,
        macros: {
            '\\R': '\\mathbb{R}',
            '\\N': '\\mathbb{N}'
        }
    }}
/>