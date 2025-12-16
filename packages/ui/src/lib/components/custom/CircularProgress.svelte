<script lang="ts">
interface Props {
  value: number;
  max: number;
  size: number;
  class?: string;
}
let { value = 0, max = 100, size = 6, class: className = '' }: Props = $props();

// Calculate progress percentage
const progress = $derived(Math.min(Math.max((value / max) * 100, 0), 100));

// SVG circle properties
const radius = 40;
const circumference = 2 * Math.PI * radius;
const strokeDashoffset = $derived(circumference - (progress / 100) * circumference);
</script>

<div class="circular-progress {className}" style="width: {size}rem; height: {size}rem;">
	<svg width="100%" height="100%" viewBox="0 0 100 100">
		<!-- Background circle -->
		<circle
			cx="50"
			cy="50"
			r={radius}
			fill="transparent"
			stroke="var(--secondary)"
			stroke-width="16"
			class="progress-bg"
		/>

		<!-- Progress circle -->
		<circle
			cx="50"
			cy="50"
			r={radius}
			fill="transparent"
			stroke="var(--primary)"
			stroke-width="16"
			stroke-linecap="round"
			stroke-dasharray={circumference}
			stroke-dashoffset={strokeDashoffset}
			class="progress-fill"
			transform="rotate(-90 50 50)"
		/>
	</svg>
</div>

<style>
	.circular-progress {
		display: inline-block;
	}

	.progress-fill {
		transition: stroke-dashoffset 0.3s ease;
	}
</style>
