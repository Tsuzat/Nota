<script lang="ts">
import { setAuthContext } from '@nota/client';
import '../app.css';
import { ModeWatcher } from '@nota/ui';
import { Toaster } from '@nota/ui/shadcn/sonner';
import { onMount } from 'svelte';

let { data, children } = $props();

const auth = setAuthContext();

onMount(() => {
  auth.user = data.user;
});
</script>

<ModeWatcher />
<Toaster richColors />

{@render children()}
