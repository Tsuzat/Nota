<script lang="ts">
import Github from '@nota/ui/icons/customs/github.svelte';
import Google from '@nota/ui/icons/customs/google.svelte';
import { Button } from '@nota/ui/shadcn/button';
import * as Card from '@nota/ui/shadcn/card';
import { onMount } from 'svelte';
import { page } from '$app/state';
import Particles from '$lib/components/custom/utils/particles.svelte';
import { signInWithOAuth } from '$lib/supabase/index.js';

const { data } = $props();

let ref = $state<HTMLDivElement>();

let fromDesktop = $derived(page.url.searchParams.get('desktop') === 'true');

// variables for animation
let mouseX = $state(0);
let mouseY = $state(0);
let rotateX = $derived.by(() => {
  // Convert mouse Y position to rotation around X axis (tilt up/down)
  // Normalize to a small angle range for subtle effect
  return (mouseY / 360) * -10; // Max 10 degrees rotation
});
let rotateY = $derived.by(() => {
  // Convert mouse X position to rotation around Y axis (tilt left/right)
  // Normalize to a small angle range for subtle effect
  return (mouseX / 360) * 10; // Max 10 degrees rotation
});

function handleMouseMove(e: MouseEvent) {
  if (!ref) return;
  e.preventDefault();
  // mouse x and y position
  const x = e.clientX;
  const y = e.clientY;
  // get the element that was clicked
  const rect = ref.getBoundingClientRect();
  // Center the coordinates and normalize to card dimensions
  mouseX = x - rect.left - rect.width / 2;
  mouseY = y - rect.top - rect.height / 2;
}

function handleMouseLeave(e: MouseEvent) {
  e.preventDefault();
  // Reset mouse position to center when mouse leaves
  mouseX = 0;
  mouseY = 0;
}

onMount(() => {
  ref = document.getElementById('login-card') as HTMLDivElement;
  ref.addEventListener('mousemove', handleMouseMove);
  ref.addEventListener('mouseleave', handleMouseLeave);
  return () => {
    ref?.removeEventListener('mousemove', handleMouseMove);
    ref?.removeEventListener('mouseleave', handleMouseLeave);
  };
});
</script>

<Particles className="fixed top-0 -z-10 h-screen w-screen overflow-hidden" />


<div
	class="inset-0 flex h-screen w-screen flex-col items-center justify-center gap-8"
>
    <a href="/">
        <img src="/favicon.webp" alt="applogo" class="mx-auto size-20 aspect-square" />
    </a>
	<Card.Root
	 id="login-card"
		class="w-120 max-w-full border bg-transparent p-4 backdrop-blur-2xl transition-transform duration-500 ease-out"
		style="transform: perspective(1000px) rotateX({rotateX}deg) rotateY({rotateY}deg); transform-style: preserve-3d;"
	>
		<Card.Header class="text-center">
			<Card.Title class="text-xl">Login to Nota {fromDesktop ? '(Desktop)' : ''}</Card.Title>
		</Card.Header>
		<Card.Content>
				<div class="grid gap-6">
					<div class="flex flex-col gap-4">
						<Button
							variant="outline"
							size="lg"
							class="w-full"
							onclick={() => signInWithOAuth(data.supabase, 'google', fromDesktop)}
						>
							<Google class="size-4" />
							Login with Google
						</Button>
						<Button
							variant="outline"
							size="lg"
							class="w-full"
							onclick={() => signInWithOAuth(data.supabase, 'github', fromDesktop)}
						>
							<Github class="size-4" />
							Sign up with Github
						</Button>
					</div>
                </div>

		</Card.Content>
        <Card.Footer>

	<div
		class="text-center text-xs text-balance text-muted-foreground *:[a]:underline *:[a]:underline-offset-4 *:[a]:hover:text-primary"
	>
		By clicking continue, you agree to our <a href="/terms">Terms of Service</a>
		and <a href="/privacy">Privacy Policy</a>.
	</div>
        </Card.Footer>
	</Card.Root>	
</div>
