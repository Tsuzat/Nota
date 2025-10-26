<script lang="ts">
	import { Button } from '../ui/button';
	import src from '$lib/assets/static/icon.png';
	import { APPMENU } from '$lib/appMenu';

	async function showMenu() {
		await APPMENU.popup();
	}
</script>

<Button variant="ghost" size="icon" class="z-10 !size-6 p-0.5" onclick={showMenu}>
	<img {src} alt="AppLogo" class="aspect-square" />
</Button>
