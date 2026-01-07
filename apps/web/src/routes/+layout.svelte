<script lang="ts">
import { setAuthContext } from '@nota/client';
import '../app.css';
import { ModeWatcher } from '@nota/ui';
import { Toaster } from '@nota/ui/shadcn/sonner';
import { onMount } from 'svelte';
import Metadata from '$lib/components/seo/Metadata.svelte';

let { data, children } = $props();

const auth = setAuthContext();

onMount(() => {
  auth.user = data.user;
});
</script>

<Metadata />
<ModeWatcher />
<Toaster richColors />

{@render children()}
