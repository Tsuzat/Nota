<script lang="ts">
import { Button } from '@nota/ui/shadcn/button';
import { Menu } from '@tauri-apps/api/menu';
import src from '$lib/assets/static/icon.png';

async function showMenu() {
  const appMenu = await Menu.default();
  await appMenu.popup();
}
</script>

<Button variant="ghost" size="icon-sm" class="z-10" onclick={showMenu}>
	<img {src} alt="AppLogo" class="aspect-square" />
</Button>