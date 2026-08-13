<script lang="ts">
  import favicon from "#lib/assets/favicon.svg";
  import "../global.css";

  let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
