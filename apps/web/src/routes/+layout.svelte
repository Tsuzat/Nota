<script lang="ts">
import '../app.css';
import { ModeWatcher } from '@nota/ui';
import { Toaster } from '@nota/ui/shadcn/sonner';

let { children } = $props();
</script>

<ModeWatcher />
<Toaster richColors />

{@render children()}
