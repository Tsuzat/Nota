<script lang="ts" module>
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import GalleryVerticalEndIcon from '@lucide/svelte/icons/gallery-vertical-end';
	import LinkIcon from '@lucide/svelte/icons/link';
	import Settings2Icon from '@lucide/svelte/icons/settings-2';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	const data = [
		{
			label: 'Copy Link',
			icon: LinkIcon
		},
		{
			label: 'Duplicate',
			icon: CopyIcon
		},
		{
			label: 'Version History',
			icon: GalleryVerticalEndIcon
		},
		{
			label: 'Import',
			icon: ArrowUpIcon
		},
		{
			label: 'Export',
			icon: ArrowDownIcon
		}
	];
</script>

<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dropdown from '$lib/components/ui/dropdown-menu';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import StarIcon from '@lucide/svelte/icons/star';
	import { type NotePageSettingsType } from '$lib/types';
	import { cn, getKeyboardShortcut } from '$lib/utils';
	import { Bubbles, Film, Lock, PenTool, SpellCheck } from '@lucide/svelte';
	import SimpleTooltip from '../simple-tooltip.svelte';

	interface Props {
		settings: NotePageSettingsType;
		starred?: boolean;
		toggleStar?: () => void;
	}

	let { settings = $bindable(), starred, toggleStar }: Props = $props();

	let open = $state(false);
</script>

<div class="flex items-center gap-2 text-sm">
	{#if settings.locked}
		<SimpleTooltip>
			<Button
				variant="ghost"
				size="icon"
				class="size-7"
				onclick={() => (settings = { ...settings, locked: !settings.locked })}
			>
				<Lock />
			</Button>
			{#snippet child()}
				<div class="flex flex-col">
					<span class="font-semibold">Content Read-only</span>
					<span>
						Click to unlock
						<span class="bg-background text-primary rounded p-0.5"
							>{getKeyboardShortcut('L', true)}</span
						>
					</span>
				</div>
			{/snippet}
		</SimpleTooltip>
	{/if}
	<Button variant="ghost" size="icon" class="size-7" onclick={toggleStar}>
		<StarIcon class={cn(starred && 'fill-yellow-500 text-yellow-500')} />
	</Button>
	<Dropdown.Root bind:open>
		<Dropdown.Trigger
			class={buttonVariants({
				variant: 'ghost',
				size: 'icon',
				class: 'data-[state=open]:bg-accent size-7'
			})}
		>
			<EllipsisIcon />
		</Dropdown.Trigger>
		<Dropdown.Content class="bg-popover h-full w-fit overflow-auto" align="end">
			<Dropdown.Group>
				<Dropdown.Sub>
					<Dropdown.SubTrigger>
						<Settings2Icon />
						Settings
					</Dropdown.SubTrigger>
					<Dropdown.SubContent>
						<Dropdown.CheckboxItem
							checked={settings.locked}
							onclick={() => (settings = { ...settings, locked: !settings.locked })}
						>
							<Lock />
							{settings.locked ? 'Unlock' : 'Lock'}
						</Dropdown.CheckboxItem>
						<Dropdown.CheckboxItem
							checked={settings.showtoolbar}
							onclick={() => (settings = { ...settings, showtoolbar: !settings.showtoolbar })}
						>
							<PenTool />
							Toolbar
						</Dropdown.CheckboxItem>
						<Dropdown.CheckboxItem
							checked={settings.spellcheck}
							onclick={() => (settings = { ...settings, spellcheck: !settings.spellcheck })}
						>
							<SpellCheck />
							Spell Check
						</Dropdown.CheckboxItem>
						<Dropdown.CheckboxItem
							checked={settings.showbubblemenu}
							onclick={() => (settings = { ...settings, showbubblemenu: !settings.showbubblemenu })}
						>
							<Bubbles />
							Bubble Menu
						</Dropdown.CheckboxItem>
						<Dropdown.CheckboxItem
							checked={settings.compressmedia}
							onclick={() => (settings = { ...settings, compressmedia: !settings.compressmedia })}
						>
							<Film />
							Compress Media
						</Dropdown.CheckboxItem>
					</Dropdown.SubContent>
				</Dropdown.Sub>
			</Dropdown.Group>
			<Dropdown.Separator />
			<Dropdown.Group>
				{#each data as d}
					{@const Icon = d.icon}
					<Dropdown.Item>
						<Icon />
						{d.label}
					</Dropdown.Item>
				{/each}
			</Dropdown.Group>
			<Dropdown.Separator />
			<Dropdown.Group>
				<Dropdown.Item>
					<Trash2Icon />
					<span>Move to Trash</span>
				</Dropdown.Item>
				<Dropdown.Item variant="destructive">
					<Trash2Icon />
					<span>Delete Note</span>
				</Dropdown.Item>
			</Dropdown.Group>
		</Dropdown.Content>
	</Dropdown.Root>
</div>
