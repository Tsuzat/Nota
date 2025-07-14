<script lang="ts">
	import { ArrowLeft, ArrowRight } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import SimpleTooltip from './simple-tooltip.svelte';

	function gotoPrev() {
		window.history.back();
	}

	function gotoNext() {
		window.history.forward();
	}
</script>

<div class="flex items-center">
	<SimpleTooltip content="Go Back">
		<Button variant="ghost" class="size-7" onclick={gotoPrev}>
			<ArrowLeft />
		</Button>
	</SimpleTooltip>
	<SimpleTooltip content="Go Next">
		<Button variant="ghost" class="size-7" onclick={gotoNext}>
			<ArrowRight />
		</Button>
	</SimpleTooltip>
</div>
