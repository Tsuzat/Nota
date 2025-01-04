<script lang="ts">
	interface Props {
		icon: string;
		class?: string;
	}
	let { icon, class: className = '' }: Props = $props();
</script>

<span class={className}>{icon}</span>
