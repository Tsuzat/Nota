<script lang="ts">
	interface Props {
		body: string;
		[key: string]: any;
	}

	let { body, ...rest }: Props = $props();
</script>

<svg role="img" viewBox="0 0 24 24" {...rest}>
	{@html body}
</svg>
