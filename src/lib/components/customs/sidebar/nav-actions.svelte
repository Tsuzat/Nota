<script lang="ts" module>
</script>

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
		PenBox,
		Redo,
		Settings2,
		Trash2,
		Undo
	} from 'lucide-svelte';
	import type { NotesDB } from '$lib/database/notes';

	let open = $state(false);

	interface Props {
		lastEdited: string;
		favorite: boolean;
		onDuplicate: () => void;
		onTrash: () => void;
	}
	let {
		lastEdited = $bindable(''),
		favorite = $bindable(false),
		onDuplicate,
		onTrash
	}: Props = $props();

	const data = [
		[
			{
				label: 'Show Toolbar',
				icon: PenBox,
				onclick: () => {}
			},
			{
				label: 'Customize Page',
				icon: Settings2,
				onclick: () => {}
			}
		],
		[
			{
				label: 'Duplicate',
				icon: Copy,
				onclick: onDuplicate
			},
			{
				label: 'Move to',
				icon: CornerUpRight,
				onclick: () => {}
			},
			{
				label: 'Move to Trash',
				icon: Trash2,
				onclick: onTrash
			}
		],
		[
			{
				label: 'Undo',
				icon: Undo,
				onclick: () => {}
			},
			{
				label: 'Redo',
				icon: Redo,
				onclick: () => {}
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
	<div
		bind:this={timeAgoHTML}
		class="text-muted-foreground hidden font-medium md:inline-block"
		datetime={lastEdited}
	></div>
	<Button
		variant="ghost"
		size="icon"
		class="size-7"
		onclick={() => {
			favorite = !favorite;
		}}
	>
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
