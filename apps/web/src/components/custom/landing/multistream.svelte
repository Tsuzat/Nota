<script lang="ts">
import Briefcase from "@lucide/svelte/icons/briefcase";
import User from "@lucide/svelte/icons/user";
import UserLock from "@lucide/svelte/icons/user-lock";
import Users from "@lucide/svelte/icons/users";
import { cn } from "@nota/ui/utils";
import AppLogo from "../app-logo.svelte";
import { AnimatedBeam, Circle } from "./animated-beam";

const { class: className }: { class: string } = $props();

let containerRef: HTMLDivElement | null = $state(null);
let div1Ref: HTMLDivElement | null = $state(null);
let div2Ref: HTMLDivElement | null = $state(null);
let div3Ref: HTMLDivElement | null = $state(null);
let div4Ref: HTMLDivElement | null = $state(null);
let div5Ref: HTMLDivElement | null = $state(null);
let div6Ref: HTMLDivElement | null = $state(null);
let div7Ref: HTMLDivElement | null = $state(null);
</script>

<div
  class={cn(
    "relative flex h-96 w-full items-center justify-center overflow-hidden border p-10",
    className,
  )}
  bind:this={containerRef}
>
  <div
    class="flex size-full max-w-lg flex-row items-stretch justify-between gap-10"
  >
    <div class="flex flex-col justify-center gap-2">
      <Circle bind:ref={div1Ref} content="Programing">
        <svg
          viewBox="0 0 1024 1024"
          xmlns="http://www.w3.org/2000/svg"
          width="1024"
          height="1024"
          fill="none"
          ><path
            fill="currentColor"
            fill-rule="evenodd"
            d="M512 0C229.12 0 0 229.12 0 512c0 226.56 146.56 417.92 350.08 485.76 25.6 4.48 35.2-10.88 35.2-24.32 0-12.16-.64-52.48-.64-95.36-128.64 23.68-161.92-31.36-172.16-60.16-5.76-14.72-30.72-60.16-52.48-72.32-17.92-9.6-43.52-33.28-.64-33.92 40.32-.64 69.12 37.12 78.72 52.48 46.08 77.44 119.68 55.68 149.12 42.24 4.48-33.28 17.92-55.68 32.64-68.48-113.92-12.8-232.96-56.96-232.96-252.8 0-55.68 19.84-101.76 52.48-137.6-5.12-12.8-23.04-65.28 5.12-135.68 0 0 42.88-13.44 140.8 52.48 40.96-11.52 84.48-17.28 128-17.28s87.04 5.76 128 17.28c97.92-66.56 140.8-52.48 140.8-52.48 28.16 70.4 10.24 122.88 5.12 135.68 32.64 35.84 52.48 81.28 52.48 137.6 0 196.48-119.68 240-233.6 252.8 18.56 16 34.56 46.72 34.56 94.72 0 68.48-.64 123.52-.64 140.8 0 13.44 9.6 29.44 35.2 24.32C877.44 929.92 1024 737.92 1024 512 1024 229.12 794.88 0 512 0"
            clip-rule="evenodd"
          /></svg
        >
      </Circle>
      <Circle bind:ref={div2Ref} content="Content Creation">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid"
          viewBox="0 0 256 180"
          ><path
            fill="red"
            d="M250.346 28.075A32.18 32.18 0 0 0 227.69 5.418C207.824 0 127.87 0 127.87 0S47.912.164 28.046 5.582A32.18 32.18 0 0 0 5.39 28.24c-6.009 35.298-8.34 89.084.165 122.97a32.18 32.18 0 0 0 22.656 22.657c19.866 5.418 99.822 5.418 99.822 5.418s79.955 0 99.82-5.418a32.18 32.18 0 0 0 22.657-22.657c6.338-35.348 8.291-89.1-.164-123.134Z"
          /><path
            fill="#FFF"
            d="m102.421 128.06 66.328-38.418-66.328-38.418z"
          /></svg
        >
      </Circle>
      <Circle bind:ref={div3Ref} content="Teams">
        <Users />
      </Circle>
      <Circle bind:ref={div4Ref} content="Personal">
        <UserLock />
      </Circle>
      <Circle bind:ref={div5Ref} content="Business">
        <Briefcase />
      </Circle>
    </div>
    <div class="flex flex-col justify-center">
      <Circle bind:ref={div6Ref} content="Nota">
        <AppLogo showLogo={false} />
      </Circle>
    </div>
    <div class="flex flex-col justify-center">
      <Circle bind:ref={div7Ref} content="You">
        <User />
      </Circle>
    </div>
  </div>

  <AnimatedBeam {containerRef} fromRef={div1Ref} toRef={div6Ref} />
  <AnimatedBeam {containerRef} fromRef={div2Ref} toRef={div6Ref} />
  <AnimatedBeam {containerRef} fromRef={div3Ref} toRef={div6Ref} />
  <AnimatedBeam {containerRef} fromRef={div4Ref} toRef={div6Ref} />
  <AnimatedBeam {containerRef} fromRef={div5Ref} toRef={div6Ref} />
  <AnimatedBeam {containerRef} fromRef={div6Ref} toRef={div7Ref} />
</div>
