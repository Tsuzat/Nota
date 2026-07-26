import { onMount } from "svelte";

export function useResizeObserver(
  getContainerRef: () => HTMLElement | null,
  callback: () => void,
) {
  onMount(() => {
    const containerRef = getContainerRef();
    if (!containerRef) return;

    const resizeObserver = new ResizeObserver(() => {
      callback();
    });

    resizeObserver.observe(containerRef);

    // Initial call
    callback();

    return () => {
      resizeObserver.disconnect();
    };
  });
}
