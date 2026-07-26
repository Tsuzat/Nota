<script lang="ts">
import { Toaster } from '@nota/ui/shadcn/sonner';
import './layout.css';
import { ModeWatcher } from '@nota/ui';
let { children } = $props();
</script>


<ModeWatcher />
<Toaster richColors />

{@render children()}
