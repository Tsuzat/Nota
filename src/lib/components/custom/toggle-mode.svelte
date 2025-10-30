<script lang="ts">
	import Sun from '@lucide/svelte/icons/sun';
	import MoonStar from '@lucide/svelte/icons/moon-star';
	import { Button } from '../ui/button';
	import SimpleTooltip from './simple-tooltip.svelte';
	import { toggleMode } from 'mode-watcher';
</script>

<SimpleTooltip content="Toggle Mode">
	<Button variant="ghost" size="icon" class="size-7" onclick={toggleMode}>
		<Sun class="block dark:hidden" />
		<MoonStar class="hidden dark:block" />
	</Button>
</SimpleTooltip>
