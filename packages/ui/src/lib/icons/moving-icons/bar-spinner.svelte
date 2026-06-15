<script lang="ts">
	import { cn } from '@lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	type Props = HTMLAttributes<HTMLDivElement> & {
		size?: number;
		color?: string;
	};

	let bars = Array.from({ length: 10 }, (_, index) => index);

	let {
		size = 16,
		color = 'currentColor',
		class: className,
		style: styleAttribute,
		...restProps
	}: Props = $props();
</script>

<div
	data-slot="bar-spinner"
	class={cn('bars-spinner-wrapper', className)}
	style="--spinner-size: {size}px; --spinner-color: {color}; {styleAttribute}"
	{...restProps}
>
	<div class="bars-spinner">
		{#each bars as bar (`spinner-bar-${bar}`)}
			<div class="bar"></div>
		{/each}
	</div>
</div>

<style>
	.bars-spinner-wrapper {
		height: var(--spinner-size, 20px);
		width: var(--spinner-size, 20px);
	}

	.bars-spinner {
		position: relative;
		top: 50%;
		left: 50%;
		height: var(--spinner-size, 20px);
		width: var(--spinner-size, 20px);
	}

	.bar {
		position: absolute;
		top: -3.9%;
		left: -10%;
		width: 30%;
		height: 12%;
		border-radius: 30%;
		background: var(--spinner-color);
		animation: bar-spinner-fade 0.8s linear infinite;
	}

	.bar:nth-child(1) {
		animation-delay: -0.8s;
		transform: rotate(0deg) translate(130%);
	}

	.bar:nth-child(2) {
		animation-delay: -0.72s;
		transform: rotate(36deg) translate(130%);
	}

	.bar:nth-child(3) {
		animation-delay: -0.64s;
		transform: rotate(72deg) translate(130%);
	}

	.bar:nth-child(4) {
		animation-delay: -0.56s;
		transform: rotate(108deg) translate(130%);
	}

	.bar:nth-child(5) {
		animation-delay: -0.48s;
		transform: rotate(144deg) translate(130%);
	}

	.bar:nth-child(6) {
		animation-delay: -0.4s;
		transform: rotate(180deg) translate(130%);
	}

	.bar:nth-child(7) {
		animation-delay: -0.32s;
		transform: rotate(216deg) translate(130%);
	}

	.bar:nth-child(8) {
		animation-delay: -0.24s;
		transform: rotate(252deg) translate(130%);
	}

	.bar:nth-child(9) {
		animation-delay: -0.16s;
		transform: rotate(288deg) translate(130%);
	}

	.bar:nth-child(10) {
		animation-delay: -0.08s;
		transform: rotate(324deg) translate(130%);
	}

	@keyframes bar-spinner-fade {
		0% {
			opacity: 1;
		}

		100% {
			opacity: 0.15;
		}
	}
</style>