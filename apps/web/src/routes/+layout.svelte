<script lang="ts">
import '../app.css';
import { ModeWatcher } from '@nota/ui';
import { Toaster } from '@nota/ui/shadcn/sonner';
import Metadata from '$lib/components/seo/Metadata.svelte';

let { children } = $props();
</script>

<Metadata />
<ModeWatcher />
<Toaster richColors />

{@render children()}
