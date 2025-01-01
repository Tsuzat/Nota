<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { type Editor } from '@tiptap/core';
	import { Table, ChevronDown } from 'lucide-svelte';

	let { editor }: { editor: Editor } = $props();
</script>

<Tooltip.Provider delayDuration={100}>
	<Tooltip.Root>
		<Tooltip.Trigger>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					<Button variant="ghost" size="sm" class="h-8 w-fit px-2">
						<Table />
						<ChevronDown class="!size-3" />
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content class="max-h-[25rem] w-40 overflow-auto">
					<DropdownMenu.Item
						onclick={() =>
							editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
					>
						<span>Insert Table</span>
					</DropdownMenu.Item>
					<DropdownMenu.Sub>
						<DropdownMenu.SubTrigger>
							<span>Header</span>
						</DropdownMenu.SubTrigger>
						<DropdownMenu.SubContent>
							<DropdownMenu.Item onclick={() => editor.chain().focus().toggleHeaderColumn().run()}>
								<span>Toggle Column</span>
							</DropdownMenu.Item>
							<DropdownMenu.Item onclick={() => editor.chain().focus().toggleHeaderRow().run()}>
								<span>Toggle Row</span>
							</DropdownMenu.Item>
							<DropdownMenu.Item onclick={() => editor.chain().focus().toggleHeaderCell().run()}>
								<span>Toggle Cell</span>
							</DropdownMenu.Item>
						</DropdownMenu.SubContent>
					</DropdownMenu.Sub>
					<DropdownMenu.Sub>
						<DropdownMenu.SubTrigger>
							<span>Cells</span>
						</DropdownMenu.SubTrigger>
						<DropdownMenu.SubContent>
							<DropdownMenu.Item onclick={() => editor.chain().focus().mergeCells().run()}>
								<span>Merge</span>
							</DropdownMenu.Item>
							<DropdownMenu.Item onclick={() => editor.chain().focus().splitCell().run()}>
								<span>Split</span>
							</DropdownMenu.Item>
							<DropdownMenu.Item onclick={() => editor.chain().focus().mergeOrSplit().run()}>
								<span>Merge or Split</span>
							</DropdownMenu.Item>
						</DropdownMenu.SubContent>
					</DropdownMenu.Sub>
					<DropdownMenu.Sub>
						<DropdownMenu.SubTrigger>
							<span>Row</span>
						</DropdownMenu.SubTrigger>
						<DropdownMenu.SubContent>
							<DropdownMenu.Item onclick={() => editor.chain().focus().addRowBefore().run()}>
								<span>Insert Above</span>
							</DropdownMenu.Item>
							<DropdownMenu.Item onclick={() => editor.chain().focus().addRowAfter().run()}>
								<span>Insert Below</span>
							</DropdownMenu.Item>
							<DropdownMenu.Item
								onclick={() => editor.chain().focus().deleteRow().run()}
								class="text-destructive hover:text-foreground data-[highlighted]:bg-destructive"
							>
								<span>Delete Row</span>
							</DropdownMenu.Item>
						</DropdownMenu.SubContent>
					</DropdownMenu.Sub>
					<DropdownMenu.Sub>
						<DropdownMenu.SubTrigger>
							<span>Column</span>
						</DropdownMenu.SubTrigger>
						<DropdownMenu.SubContent>
							<DropdownMenu.Item onclick={() => editor.chain().focus().addColumnBefore().run()}>
								<span>Insert Before</span>
							</DropdownMenu.Item>
							<DropdownMenu.Item onclick={() => editor.chain().focus().addColumnAfter().run()}>
								<span>Insert After</span>
							</DropdownMenu.Item>
							<DropdownMenu.Item
								onclick={() => editor.chain().focus().deleteColumn().run()}
								class="text-destructive hover:text-foreground data-[highlighted]:bg-destructive"
							>
								<span>Delete</span>
							</DropdownMenu.Item>
						</DropdownMenu.SubContent>
					</DropdownMenu.Sub>
					<DropdownMenu.Item
						onclick={() => editor.chain().focus().deleteTable().run()}
						class="text-destructive hover:text-foreground data-[highlighted]:bg-destructive"
					>
						<span>Delete</span>
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</Tooltip.Trigger>
		<Tooltip.Content avoidCollisions class="bg-background text-foreground border font-medium p-2">
			<p>Tables</p>
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
