<script lang="ts">
import { onMount } from 'svelte';

interface Props {
  class?: string;
  quantity?: number;
  staticity?: number;
  ease?: number;
  size?: number;
  color?: string;
  vx?: number;
  vy?: number;
}

let {
  class: className = '',
  quantity = 200,
  staticity = 50,
  ease = 50,
  size = 0.4,
  color = '#808080',
  vx = 0,
  vy = 0,
}: Props = $props();

// --- SSR guard: all browser-only state lives inside onMount ---
let canvasEl = $state<HTMLCanvasElement | null>(null);
let containerEl = $state<HTMLDivElement | null>(null);

// Derived RGB kept reactive so prop changes re-draw
const rgb = $derived(hexToRgb(color));

function hexToRgb(hex: string): [number, number, number] {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const n = Number.parseInt(cleanHex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

type Circle = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  r: number;
  alpha: number;
  targetAlpha: number;
  dx: number;
  dy: number;
  mag: number;
};

onMount(() => {
  if (!canvasEl || !containerEl) return;
  const canvas = canvasEl;
  const container = containerEl;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;

  let w = 0;
  let h = 0;
  let mx = 0;
  let my = 0;
  let rafId = 0;
  // Pre-allocate fixed-size pool to avoid GC pressure
  const pool: Circle[] = new Array(quantity);
  let count = 0;

  function resize() {
    w = container.offsetWidth;
    h = container.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    count = 0;
    for (let i = 0; i < quantity; i++) pool[i] = makeCircle();
    count = quantity;
  }

  function makeCircle(): Circle {
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      tx: 0,
      ty: 0,
      r: Math.random() + size,
      alpha: 0,
      targetAlpha: +(Math.random() * 0.6 + 0.1).toFixed(1),
      dx: (Math.random() - 0.5) * 0.1,
      dy: (Math.random() - 0.5) * 0.1,
      mag: 0.1 + Math.random() * 4,
    };
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);

    const [r, g, b] = rgb; // captured from outer reactive scope each frame

    for (let i = 0; i < count; i++) {
      const c = pool[i];

      // Edge proximity alpha ramp (branchless clamp)
      const edge = Math.min(c.x + c.tx - c.r, w - c.x - c.tx - c.r, c.y + c.ty - c.r, h - c.y - c.ty - c.r);
      const remap = Math.max(0, Math.min(1, edge / 20));
      c.alpha = remap < 1 ? c.targetAlpha * remap : Math.min(c.alpha + 0.02, c.targetAlpha);

      // Position
      c.x += c.dx + vx;
      c.y += c.dy + vy;

      // Mouse magnetism (eased)
      const inv = c.mag / staticity;
      c.tx += (mx * inv - c.tx) / ease;
      c.ty += (my * inv - c.ty) / ease;

      // Draw — setTransform once per circle avoids translate/restore overhead
      ctx.beginPath();
      ctx.arc(c.x + c.tx, c.y + c.ty, c.r, 0, 6.2831853);
      ctx.fillStyle = `rgba(${r},${g},${b},${c.alpha})`;
      ctx.fill();

      // Recycle out-of-bounds particles in-place (no splice → no array shift)
      if (c.x < -c.r || c.x > w + c.r || c.y < -c.r || c.y > h + c.r) {
        pool[i] = makeCircle();
      }
    }

    rafId = requestAnimationFrame(frame);
  }

  function onMouseMove(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - w / 2;
    const y = e.clientY - rect.top - h / 2;
    if (x > -w / 2 && x < w / 2 && y > -h / 2 && y < h / 2) {
      mx = x;
      my = y;
    }
  }

  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();
  rafId = requestAnimationFrame(frame);
  window.addEventListener('mousemove', onMouseMove, { passive: true });

  return () => {
    cancelAnimationFrame(rafId);
    ro.disconnect();
    window.removeEventListener('mousemove', onMouseMove);
  };
});
</script>

<div class={className} bind:this={containerEl} aria-hidden="true">
  <canvas bind:this={canvasEl} style="width:100%;height:100%;"></canvas>
</div>
