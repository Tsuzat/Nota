<script lang="ts">
import { SimpleToolTip } from '@lib/components/custom';
import { Button } from '@lib/components/ui/button';
import { getAuthContext } from '@nota/client';
import * as Label from '@nota/ui/shadcn/label';
import * as Switch from '@nota/ui/shadcn/switch';
import { openUrl } from '@tauri-apps/plugin-opener';
import { PUBLIC_NOTA_FRONTEND_URL } from '$env/static/public';
import { getGlobalSettings } from '../constants.svelte';

const useSettings = getGlobalSettings();

const user = $derived(getAuthContext().user);

function getAICredits() {
  if (!user) return '0 Credits';
  if (!user.aiCredits) return '0 Credits';
  return user.aiCredits >= 1000000
    ? `${(user.aiCredits / 1000000).toFixed(1)}M`
    : user.aiCredits >= 1000
      ? `${(user.aiCredits / 1000).toFixed(1)}K`
      : `${user.aiCredits}`;
}
</script>

<div class="mx-auto w-120 space-y-6 p-6">
	<div>
		<h3 class="text-lg font-medium">AI</h3>
		<p class="text-muted-foreground text-sm">Configure and See AI settings.</p>
	</div>
	<div class="space-y-4">
		<div class="flex items-center justify-between rounded-lg border p-4">
			<div>
				<Label.Root for="use-ai">Use AI</Label.Root>
				<p class="text-muted-foreground text-xs">Enable or disable all AI features.</p>
			</div>
			<Switch.Root id="use-ai" bind:checked={useSettings.useAI} />
		</div>
		<div class="flex items-center justify-between rounded-lg border p-4">
			<div>
				<Label.Root for="use-ai">Available AI Credits</Label.Root>
				<p class="text-muted-foreground text-xs">
					Your AI credits are used to power the AI features. They never expire. Regardles of the subscription tier.
				</p>	
			</div>
			<SimpleToolTip content={`${user?.aiCredits || 0} AI Credits Available`}>
				<span class="text-sm text-muted-foreground">{getAICredits()}</span>
			</SimpleToolTip>
		</div>
		<Button onclick={() => openUrl(`${PUBLIC_NOTA_FRONTEND_URL}#pricing`)}>Buy More AI Credits</Button>
	</div>
</div>
