<script lang="ts">
import * as Dialog from '@nota/ui/shadcn/dialog';
import { getGlobalSignInContext } from '.';
import OAuth from './oauth.svelte';

const signInContext = getGlobalSignInContext();
</script>

<Dialog.Root bind:open={signInContext.open}>
	<Dialog.Content class="w-96 overflow-y-auto">
		<Dialog.Title class="*:mb-4">
			<Dialog.Header>Sign In to Nota</Dialog.Header>
			<Dialog.Description>Use following OAuth methods to sign in to Nota.</Dialog.Description>
		</Dialog.Title>
		<OAuth />
	</Dialog.Content>
</Dialog.Root>
