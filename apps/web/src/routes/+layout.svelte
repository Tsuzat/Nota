<script lang="ts">
import '../app.css';
import { setAuthContext } from '@nota/client';
import { ModeWatcher } from '@nota/ui';
import { Toaster } from '@nota/ui/shadcn/sonner';
import Metadata from '$lib/components/seo/Metadata.svelte';

let { children, data } = $props();
const authContext = setAuthContext();

$effect(() => {
  if (data.user) authContext.user = data.user;
});
</script>

<Metadata />
<ModeWatcher />
<Toaster richColors />

{@render children()}
