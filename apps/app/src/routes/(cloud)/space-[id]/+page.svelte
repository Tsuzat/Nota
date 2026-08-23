<script lang="ts">
import { Topbar, WorkspaceNotes } from "#lib/components/custom/index.ts";

const { data }: { data: { id: string } } = $props();
</script>

<div class="flex min-h-0 flex-1 flex-col">
  <Topbar class="shrink-0" />
  <div class="min-h-0 max-h-[calc(100vh-4rem)] flex-1 overflow-y-auto ">
    <WorkspaceNotes id={data.id} isCloud />
  </div>
</div>
