<script lang="ts">
import { setAuthContext } from '@nota/client';
import '../app.css';
import { ModeWatcher } from '@nota/ui';
import { Toaster } from '@nota/ui/shadcn/sonner';
import { onMount } from 'svelte';

const auth = setAuthContext();

onMount(async () => {
  await auth.init();
});

let { children } = $props();
</script>

<ModeWatcher />
<Toaster richColors />

{@render children()}
