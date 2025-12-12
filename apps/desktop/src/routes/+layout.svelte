<script lang="ts">
	import '../app.css';
	
	let { children } = $props();
	import {ModeWatcher } from '@nota/ui';
	import {Toaster} from '@nota/ui/shadcn/sonner'
</script>


<ModeWatcher />
<Toaster richColors />
{@render children()}
