<script lang="ts">
	import { icons } from '@lucide/svelte';

	interface Props {
		icon: keyof typeof icons;
		[key: string]: unknown;
	}

	const { icon, ...props }: Props = $props();

	const Icon = $derived.by(() => icons[icon]);
</script>

<Icon {...props} />
