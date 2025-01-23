<script lang="ts">
	import { ArrowLeft, ArrowRight } from 'lucide-svelte';
	import { Button } from '../ui/button';
	import Tooltip from './tooltip.svelte';
	import { OS } from '$lib/contants';

	const nextKey = `${OS === 'macos' ? 'Cmd' : 'Ctrl'}+]`;
	const prevKey = `${OS === 'macos' ? 'Cmd' : 'Ctrl'}+[`;

	let canGoNext = $derived.by(() => {
		//@ts-ignore
		return navigation ? navigation.canGoForward : true;
	});

	let canGoPrev = $derived.by(() => {
		//@ts-ignore
		return navigation ? navigation.canGoBack : true;
	});

	async function goPrev() {
		//@ts-ignore
		if (navigation && navigation.canGoBack) {
			//@ts-ignore
			await navigation.back().finished;
		} else {
			history.back();
		}
	}

	async function goNext() {
		//@ts-ignore
		if (navigation && navigation.canGoForward) {
			//@ts-ignore
			await navigation.forward().finished;
		} else {
			history.forward();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === '[' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			goPrev();
		}
		if (e.key === ']' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			goNext();
		}
	}
</script>

<svelte:document onkeydown={handleKeydown} />

<Tooltip text="Go Back" key={prevKey}>
	<Button variant="ghost" class="size-7 p-0" disabled={!canGoPrev} onclick={goPrev}>
		<ArrowLeft />
	</Button>
</Tooltip>
<Tooltip text="Go Next" key={nextKey}>
	<Button variant="ghost" class="size-7 p-0" disabled={!canGoNext} onclick={goNext}>
		<ArrowRight />
	</Button>
</Tooltip>
