<script lang="ts">
import { Button } from '@lib/components/ui/button';
import MoonStar from '@lucide/svelte/icons/moon-star';
import Sun from '@lucide/svelte/icons/sun';
import { toggleMode } from 'mode-watcher';
import SimpleToolTip from './SimpleToolTip.svelte';
</script>

<SimpleToolTip content="Toggle Mode">
  <Button onclick={toggleMode} variant="ghost" size="icon-sm">
    <MoonStar class="dark:block hidden" />
    <Sun class="block dark:hidden" />
  </Button>
</SimpleToolTip>
