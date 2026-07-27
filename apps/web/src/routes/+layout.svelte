<script lang="ts">
import { Toaster } from '@nota/ui/shadcn/sonner';
import '../app.css';
import { setAuthContext, setStorageContext } from '@nota/client';
import { ModeWatcher } from '@nota/ui';
import { onMount } from 'svelte';

let { children, data } = $props();

const authClient = setAuthContext();
setStorageContext();

onMount(() => {
  if (data.user && data.session) {
    authClient.user = data.user;
    authClient.session = data.session;
  }
});
</script>

<ModeWatcher />
<Toaster closeButton richColors />

{@render children()}
