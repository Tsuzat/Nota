<script lang="ts">
import { lucideComponentCache } from "./utils";

interface Props {
	icon: string;
	[key: string]: unknown;
}

const { icon, ...props }: Props = $props();

const loadIcon = async (name: string) => {
	if (lucideComponentCache.has(name)) return lucideComponentCache.get(name);
	const mod = await import("./icon-imports.generated");
	const loadFn = mod.iconImports[name];
	if (!loadFn) return null;
	const iconMod = await loadFn();
	if (!iconMod) return null;
	lucideComponentCache.set(name, iconMod.default);
	return iconMod.default;
};
</script>

{#await loadIcon(icon)}
  <div class="size-6 rounded bg-muted animate-pulse"></div>
{:then Icon}
  {#if Icon}
    <Icon {...props} />
  {/if}
{/await}
