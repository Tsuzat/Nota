<script lang="ts">
    import { Button } from "@lib/components/ui/button";
    import Sun from '@lucide/svelte/icons/sun';
    import MoonStar from '@lucide/svelte/icons/moon';
    import { toggleMode } from "mode-watcher";


</script>

<Button onclick={toggleMode} variant="ghost" size="icon">
    <Sun  class="darK:hidden block"/>
    <MoonStar class="dark:block hidden" />
</Button>
