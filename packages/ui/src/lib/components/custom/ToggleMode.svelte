<script lang="ts">
import { Button } from '@lib/components/ui/button';
import MoonStar from '@lucide/svelte/icons/moon-star';
import Sun from '@lucide/svelte/icons/sun';
import { toggleMode } from 'mode-watcher';
import SimpleToolTip from './SimpleToolTip.svelte';
</script>

<SimpleToolTip content="Toggle Mode">
  <Button onclick={toggleMode} variant="ghost" class="relative" size="icon-sm">
    <MoonStar class="dark:scale-100 scale-0 absolute transition-all duration-500" />
    <Sun class="scale-100 dark:scale-0 absolute transition-all duration-500" />
  </Button>
</SimpleToolTip>
