<script lang="ts">
  import { ISDESKTOP } from "#lib/utils.ts";
</script>

{#if ISDESKTOP}{:else}
  <a href="/"></a>
{/if}
