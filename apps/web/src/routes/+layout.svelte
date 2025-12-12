<script lang="ts">
	import '../app.css';
    import {Toaster} from '@nota/ui/shadcn/sonner'
    import {ModeWatcher} from "@nota/ui"
	let { children } = $props();
</script>

<ModeWatcher />
<Toaster richColors />

{@render children()}
