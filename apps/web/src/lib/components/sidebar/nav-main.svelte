<script lang="ts">
import { MovingHome } from '@nota/ui/icons/index.js';
import * as Sidebar from '@nota/ui/shadcn/sidebar';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';

let isHomeHovered = $state(false);
</script>

<Sidebar.Menu>
  <Sidebar.MenuItem>
    <Sidebar.MenuButton
      onclick={() => goto(resolve('/home'))}
      onmouseenter={() => (isHomeHovered = true)}
      onmouseleave={() => (isHomeHovered = false)}
    >
      <MovingHome size={18} isHovered={isHomeHovered} />
      <span>Home</span>
    </Sidebar.MenuButton>
  </Sidebar.MenuItem>
</Sidebar.Menu>
