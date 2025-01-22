<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import Star from 'lucide-svelte/icons/star';
	import { onDestroy, onMount } from 'svelte';
	import { render as timeAgoRender, cancel } from 'timeago.js';
	import {
		ArrowDown,
		ArrowUp,
		Copy,
		CornerUpRight,
		LockKeyhole,
		PenBox,
		Redo,
		Settings2,
		Trash2,
		Undo
	} from 'lucide-svelte';
	import { Switch } from '$lib/components/ui/switch';
	import { fade } from 'svelte/transition';
	import Tooltip from '../tooltip.svelte';
	import { OS } from '$lib/contants';

	let open = $state(false);

	interface Props {
		lastEdited: string;
		isLocked: boolean;
		showToolbar: boolean;
		favorite: boolean;
		onFavorite: () => void;
		onDuplicate: () => void;
		onTrash: () => void;
	}
	let {
		lastEdited = $bindable(''),
		isLocked = $bindable(false),
		showToolbar = $bindable(true),
		favorite,
		onFavorite,
		onDuplicate,
		onTrash
	}: Props = $props();

	const data = [
		[
			{
				label: 'Customize Page',
				icon: Settings2,
				onclick: () => {}
			},
			{
				label: 'Duplicate',
				icon: Copy,
				onclick: onDuplicate
			},
			// {
			// 	label: 'Move to',
			// 	icon: CornerUpRight,
			// 	onclick: () => {}
			// },
			{
				label: 'Move to Trash',
				icon: Trash2,
				onclick: onTrash
			}
		],
		[
			{
				label: 'Import',
				icon: ArrowUp,
				onclick: () => {}
			},
			{
				label: 'Export',
				icon: ArrowDown,
				onclick: () => {}
			}
		]
	];

	let timeAgoHTML: HTMLDivElement | undefined = $state(undefined);

	onMount(() => {
		if (!timeAgoHTML) return;
		timeAgoRender(timeAgoHTML, undefined, {
			minInterval: 10
		});
		return () => {
			cancel(timeAgoHTML);
		};
	});

	onDestroy(() => {
		cancel(timeAgoHTML);
	});
</script>

<div class="flex items-center gap-2 text-sm">
	{#if isLocked}
		<span transition:fade={{ duration: 200 }}>
			<Tooltip text="Toggle page lock" side="left" key={`${OS === 'macos' ? '⌘' : 'Ctrl'} L`}>
				<LockKeyhole class="size-4" />
			</Tooltip>
		</span>
	{/if}
	<div
		bind:this={timeAgoHTML}
		class="text-muted-foreground hidden font-medium md:inline-block"
		datetime={lastEdited}
	></div>
	<Button variant="ghost" size="icon" class="size-7" onclick={onFavorite}>
		<Star
			data-favorite={favorite}
			class="data-[favorite=true]:text-yellow-400 data-[favorite=true]:fill-yellow-400"
		/>
	</Button>
	<Popover.Root bind:open>
		<Popover.Trigger>
			{#snippet child({ props })}
				<Button {...props} variant="ghost" size="icon" class="data-[state=open]:bg-accent h-7 w-7">
					<Ellipsis />
				</Button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content class="w-56 max-h-[85vh] overflow-auto rounded-lg p-0" align="end">
			<Sidebar.Root collapsible="none" class="bg-transparent">
				<Sidebar.Content>
					<Sidebar.Group class="border-b last:border-none">
						<Sidebar.GroupContent class="gap-0">
							<Sidebar.Menu class="gap-4">
								<Sidebar.MenuItem class="flex gap-2 w-full items-center mx-1.5">
									<LockKeyhole class="size-4" /> <span>Lock Page</span>
									<Switch bind:checked={isLocked} class="ml-auto mr-4" />
								</Sidebar.MenuItem>
								<Sidebar.MenuItem class="flex gap-2 w-full items-center mx-1.5">
									<PenBox class="size-4" /> <span>Show Toolbar</span>
									<Switch bind:checked={showToolbar} class="ml-auto mr-4" />
								</Sidebar.MenuItem>
							</Sidebar.Menu>
						</Sidebar.GroupContent>
					</Sidebar.Group>
					{#each data as group, index (index)}
						<Sidebar.Group class="border-b last:border-none">
							<Sidebar.GroupContent class="gap-0">
								<Sidebar.Menu>
									{#each group as item, index (index)}
										<Sidebar.MenuItem>
											<Sidebar.MenuButton onclick={item.onclick}>
												<item.icon /> <span>{item.label}</span>
											</Sidebar.MenuButton>
										</Sidebar.MenuItem>
									{/each}
								</Sidebar.Menu>
							</Sidebar.GroupContent>
						</Sidebar.Group>
					{/each}
				</Sidebar.Content>
			</Sidebar.Root>
		</Popover.Content>
	</Popover.Root>
</div>
