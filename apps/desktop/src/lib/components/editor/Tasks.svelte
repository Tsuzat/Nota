<script lang="ts">
import type { Editor } from '@nota/ui/edra/types.js';
import { CircularProgress } from '@nota/ui/custom/index.js';
import { onDestroy, onMount } from 'svelte';
interface Props {
  editor: Editor;
}
const { editor }: Props = $props();
let total = $state(0);
let completed = $state(0);
function updateCounts() {
  const store = editor?.storage?.trackTasks as { total: number; completed: number } | undefined;
  total = store?.total ?? 0;
  completed = store?.completed ?? 0;
}
onMount(() => {
  updateCounts();
  editor?.on('update', updateCounts);
  editor?.on('selectionUpdate', updateCounts);
});
onDestroy(() => {
  editor?.off('update', updateCounts);
  editor?.off('selectionUpdate', updateCounts);
});
</script>

<div class="inline-flex items-center gap-1">
    <CircularProgress size={1} value={completed} max={total} />
    <span class="text-sm text-muted-foreground">{completed}/{total}</span>
</div>
