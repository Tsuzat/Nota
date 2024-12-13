<script lang="ts">
	import NavActions from '$lib/components/customs/sidebar/nav-actions.svelte';
	import ShadEditor from '$lib/components/shad-editor/shad-editor.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import { Separator } from '$lib/components/ui/separator';
	import * as Sidebar from '$lib/components/ui/sidebar';
</script>

<main>
	<header class="flex h-14 shrink-0 items-center gap-2">
		<div class="flex flex-1 items-center gap-2 px-3">
			<Sidebar.Trigger />
			<Separator orientation="vertical" class="mr-2 h-4" />
			<Breadcrumb.Root>
				<Breadcrumb.List>
					<Breadcrumb.Item>
						<Breadcrumb.Page class="line-clamp-1"
							>Project Management & Task Tracking</Breadcrumb.Page
						>
					</Breadcrumb.Item>
				</Breadcrumb.List>
			</Breadcrumb.Root>
		</div>
		<div class="ml-auto px-3">
			<NavActions />
		</div>
	</header>
	<div class="flex flex-1 flex-col gap-4 p-2">
		<div class="bg-muted/50 mx-auto h-24 w-full max-w-3xl rounded-xl"></div>
		<div class="mx-auto h-full w-full max-w-3xl">
			<ShadEditor />
		</div>
	</div>
</main>
