<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import Settings from '@lucide/svelte/icons/settings';
	import User from '@lucide/svelte/icons/user';
	import General from './general.svelte';
	import Profile from './profile.svelte';
	import Monitor from '@lucide/svelte/icons/monitor';
	import Local from './local.svelte';
</script>

<Tabs.Root value="tab-1">
	<Tabs.List class="bg-background z-50 mx-auto h-auto rounded-none p-0">
		<Tabs.Trigger
			value="tab-1"
			class="relative flex-col rounded border-1 px-4 py-2 text-xs data-[state=active]:bg-transparent data-[state=active]:shadow-none"
		>
			<Settings class="mb-1.5 opacity-60" size={14} aria-hidden="true" />
			General
		</Tabs.Trigger>
		<Tabs.Trigger
			value="tab-2"
			class="relative flex-col rounded border-1 px-4 py-2 text-xs data-[state=active]:bg-transparent data-[state=active]:shadow-none"
		>
			<User class="mb-1.5 opacity-60" size={14} aria-hidden="true" />
			Profile
		</Tabs.Trigger>
		<Tabs.Trigger
			value="tab-3"
			class="relative flex-col rounded border-1 px-4 py-2 text-xs data-[state=active]:bg-transparent data-[state=active]:shadow-none"
		>
			<Monitor class="mb-1.5 opacity-60" size={14} aria-hidden="true" />
			Local
		</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="tab-1" class="mx-auto mt-4 h-full w-full max-w-2xl overflow-y-auto px-4">
		<General />
	</Tabs.Content>
	<Tabs.Content value="tab-2" class="mx-auto mt-4 h-full w-full max-w-2xl overflow-y-auto px-4">
		<Profile />
	</Tabs.Content>
	<Tabs.Content value="tab-3" class="mx-auto mt-4 h-full w-full max-w-2xl overflow-y-auto px-4">
		<Local />
	</Tabs.Content>
</Tabs.Root>
