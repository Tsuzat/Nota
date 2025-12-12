<script lang="ts">
	import '../app.css';
    import { ModeWatcher } from 'mode-watcher';
    import {Toaster} from '@nota/ui/shadcn/sonner'
	let { children } = $props();
</script>

<ModeWatcher />
<Toaster richColors />

{@render children()}
