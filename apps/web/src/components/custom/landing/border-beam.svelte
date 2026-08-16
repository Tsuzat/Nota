<script lang="ts">
import { cn } from "@nota/ui/utils";

interface BorderBeamProps {
	size?: number;
	duration?: number;
	delay?: number;
	colorFrom?: string;
	colorTo?: string;
	class?: string;
	style?: string;
	reverse?: boolean;
	initialOffset?: number;
	borderWidth?: number;
}

let {
	class: className,
	style: styleProp,
	size = 50,
	delay = 0,
	duration = 6,
	colorFrom = "#ffaa40",
	colorTo = "#9c40ff",
	reverse = false,
	initialOffset = 0,
	borderWidth = 1,
}: BorderBeamProps = $props();

const containerStyle = $derived(`--border-beam-width: ${borderWidth}px;`);

// mirrors the old `animate` keyframe pair exactly
const fromOffset = $derived(
	reverse ? `${100 - initialOffset}%` : `${initialOffset}%`,
);
const toOffset = $derived(
	reverse ? `${-initialOffset}%` : `${100 + initialOffset}%`,
);

const beamStyle = $derived(
	[
		`width:${size}px`,
		`offset-path: rect(0 auto auto 0 round ${size}px)`,
		`offset-distance:${fromOffset}`, // static fallback if animation never runs
		`--color-from:${colorFrom}`,
		`--color-to:${colorTo}`,
		`--border-beam-from:${fromOffset}`,
		`--border-beam-to:${toOffset}`,
		`animation-duration:${duration}s`,
		`animation-delay:${-delay}s`, // negative delay = start partway in, same trick the original used
		styleProp,
	]
		.filter(Boolean)
		.join(";"),
);
</script>

<div
  class="pointer-events-none absolute inset-0 rounded-[inherit] border-(length:--border-beam-width) border-transparent mask-[linear-gradient(transparent,transparent),linear-gradient(#000,#000)] mask-intersect [mask-clip:padding-box,border-box]"
  style={containerStyle}
>
  <div
    class={cn(
      'border-beam absolute aspect-square',
      'bg-linear-to-l from-(--color-from) via-(--color-to) to-transparent',
      className,
    )}
    style={beamStyle}
  ></div>
</div>

<style>
  .border-beam {
    animation-name: border-beam-move;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
  }

  @keyframes border-beam-move {
    from {
      offset-distance: var(--border-beam-from);
    }
    to {
      offset-distance: var(--border-beam-to);
    }
  }
</style>