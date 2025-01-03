<script lang="ts">
	import * as icons from 'lucide-svelte';
	interface Props {
		icon: string;
		class?: string;
	}
	let { icon, class: className = '' }: Props = $props();

	const Icon = icons[icon];
</script>

<Icon class={className} />
