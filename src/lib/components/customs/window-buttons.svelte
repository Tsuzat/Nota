<script lang="ts">
	import { Button } from '../ui/button';
	import { APPWINDOW, IS_MAXIMUM } from '$lib/contants';

	async function minimize() {
		await APPWINDOW.minimize();
	}
	async function toggleMaximize() {
		await APPWINDOW.toggleMaximize();
	}
	async function close() {
		await APPWINDOW.close();
	}
</script>

<div class="fixed right-0 top-0 flex items-center">
	<Button
		variant="ghost"
		size="default"
		class="h-12 rounded-none"
		title="Minimize"
		onclick={minimize}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			x="0px"
			y="0px"
			width="50"
			height="50"
			viewBox="0 0 48 48"
		>
			<path
				fill="currentColor"
				d="M 3.5 22.5 A 1.50015 1.50015 0 1 0 3.5 25.5 L 44.5 25.5 A 1.50015 1.50015 0 1 0 44.5 22.5 L 3.5 22.5 z"
			></path>
		</svg>
	</Button>
	<Button
		variant="ghost"
		size="default"
		class="h-12 rounded-none"
		title={$IS_MAXIMUM ? 'Restore' : 'Maximize'}
		onclick={toggleMaximize}
	>
		{#if $IS_MAXIMUM}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				x="0px"
				y="0px"
				width="50"
				height="50"
				viewBox="0 0 48 48"
			>
				<path
					fill="currentColor"
					d="M 16.5 5 C 14.368 5 12.520422 6.222 11.607422 8 L 37.5 8 C 38.879 8 40 9.121 40 10.5 L 40 36.392578 C 41.778 35.480578 43 33.632 43 31.5 L 43 10.5 C 43 7.468 40.532 5 37.5 5 L 16.5 5 z M 10.5 11 C 7.4802259 11 5 13.480226 5 16.5 L 5 37.5 C 5 40.519774 7.4802259 43 10.5 43 L 31.5 43 C 34.519774 43 37 40.519774 37 37.5 L 37 16.5 C 37 13.480226 34.519774 11 31.5 11 L 10.5 11 z M 10.5 14 L 31.5 14 C 32.898226 14 34 15.101774 34 16.5 L 34 37.5 C 34 38.898226 32.898226 40 31.5 40 L 10.5 40 C 9.1017741 40 8 38.898226 8 37.5 L 8 16.5 C 8 15.101774 9.1017741 14 10.5 14 z"
				></path>
			</svg>
		{:else}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				x="0px"
				y="0px"
				width="50"
				height="50"
				viewBox="0 0 48 48"
			>
				<path
					fill="currentColor"
					d="M 11.5 6 C 8.4802259 6 6 8.4802259 6 11.5 L 6 36.5 C 6 39.519774 8.4802259 42 11.5 42 L 36.5 42 C 39.519774 42 42 39.519774 42 36.5 L 42 11.5 C 42 8.4802259 39.519774 6 36.5 6 L 11.5 6 z M 11.5 9 L 36.5 9 C 37.898226 9 39 10.101774 39 11.5 L 39 36.5 C 39 37.898226 37.898226 39 36.5 39 L 11.5 39 C 10.101774 39 9 37.898226 9 36.5 L 9 11.5 C 9 10.101774 10.101774 9 11.5 9 z"
				></path>
			</svg>
		{/if}
	</Button>
	<Button
		variant="ghost"
		size="default"
		class="h-12 rounded-none hover:bg-red-500"
		title="Close"
		onclick={close}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			x="0px"
			y="0px"
			width="50"
			height="50"
			viewBox="0 0 48 48"
		>
			<path
				fill="currentColor"
				d="M 39.486328 6.9785156 A 1.50015 1.50015 0 0 0 38.439453 7.4394531 L 24 21.878906 L 9.5605469 7.4394531 A 1.50015 1.50015 0 0 0 8.484375 6.984375 A 1.50015 1.50015 0 0 0 7.4394531 9.5605469 L 21.878906 24 L 7.4394531 38.439453 A 1.50015 1.50015 0 1 0 9.5605469 40.560547 L 24 26.121094 L 38.439453 40.560547 A 1.50015 1.50015 0 1 0 40.560547 38.439453 L 26.121094 24 L 40.560547 9.5605469 A 1.50015 1.50015 0 0 0 39.486328 6.9785156 z"
			></path>
		</svg>
	</Button>
</div>
