<script lang="ts">
import { cn } from '@lib/utils';
import { onMount } from 'svelte';

let { children, class: className = undefined, threshold = 0.1, delay = 0 } = $props();

let element: HTMLElement;
let isVisible = $state(false);

onMount(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isVisible = true;
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold,
    }
  );

  if (element) {
    observer.observe(element);
  }

  return () => {
    if (element) {
      observer.unobserve(element);
    }
  };
});
</script>

<div
	bind:this={element}
	class={cn(
		'transition-all duration-1000 ease-out',
		isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0',
		className
	)}
	style="transition-delay: {delay}ms"
>
	{@render children?.()}
</div>
