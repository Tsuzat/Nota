<script lang="ts">
import { Button } from '@lib/components/ui/button';
import { icons } from '@lib/icons';
import { cn } from '@lib/utils';
import { AnimatePresence, createLayoutMotion } from 'motion-sv';
import { onMount } from 'svelte';
import { resolve } from '$app/paths';
import FrequencyToggle, { type FREQUENCY } from './frequency-toggle.svelte';

let NumberFlow: typeof import('@number-flow/svelte').default | undefined = $state(undefined);

onMount(async () => {
  const mod = await import('@number-flow/svelte');
  NumberFlow = mod.default;
});

let frequency = $state<FREQUENCY>('monthly');

type Plan = {
  name: string;
  info: string;
  price: {
    monthly: number;
    yearly?: number;
  };
  features: string[];
  btn: {
    text: string;
    onclick?: () => void;
  };
  highlighted?: boolean;
};

type PlanBadge =
  | {
      id: 'popular';
      label: string;
      variant: 'neutral';
    }
  | {
      id: 'discount';
      label: string;
      variant: 'primary';
    };

const plans = $derived<Plan[]>([
  {
    name: 'Free',
    info: 'Local-first purists & BYOK users',
    price: {
      monthly: 0,
    },
    features: [
      'Unlimited Local Notes & Workspaces',
      '1 Cloud Workspace, 5 Cloud Notes',
      'Local Media Storage Only',
      'Local only Collaboration',
      'BYOK (Bring Your Own Key)',
      'Local app access',
      'Regular Updates & Bug Fixes',
      'Local Notes Backup',
    ],
    btn: {
      text: 'Copy Brew Command',
      onclick: () => {
        window.navigator.clipboard.writeText('brew install --cask Tsuzat/tap/nota');
      },
    },
  },
  {
    highlighted: true,
    name: 'Pro',
    info: 'Cloud-sync power users',
    price: {
      monthly: 5,
      yearly: 50,
    },
    features: [
      'Everything in Free Plan',
      'Unlimited Cloud Notes & Workspaces',
      '5 GB Cloud Storage',
      'Full Cloud Collaborative Notes',
      'PDF Export',
      'Cloud Snapshots (Auto + Manual)',
      'Browser Previews & Web Access',
      'Encrypted Data',
    ],
    btn: {
      text: 'Start Pro Plan',
      onclick: async () => {
        window.location.href = resolve(`/payment?type=${frequency}`);
      },
    },
  },
]);

const layout = createLayoutMotion();

const setFrequency = layout.update.with((nextFrequency: FREQUENCY) => {
  frequency = nextFrequency;
});

function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
  }).format(value);
}

function getDiscount(plan: Plan) {
  if (!plan.price.yearly) return;
  if (plan.price.monthly === 0 || plan.price.yearly === 0) {
    return 0;
  }
  const defaultYearly = plan.price.monthly * 12;
  return Math.round(((defaultYearly - plan.price.yearly) / defaultYearly) * 100);
}

function getBadges(plan: Plan, activeFrequency: FREQUENCY): PlanBadge[] {
  const badges: PlanBadge[] = [];

  if (plan.highlighted) {
    badges.push({
      id: 'popular',
      label: 'Popular',
      variant: 'neutral',
    });
  }

  if (activeFrequency === 'yearly') {
    const discount = getDiscount(plan);

    if (discount && discount >= 0) {
      badges.push({
        id: 'discount',
        label: `${discount}% off`,
        variant: 'primary',
      });
    }
  }

  return badges;
}
</script>

<section class="flex w-full flex-col items-center justify-center space-y-7 p-4">
  <div class="mx-auto max-w-xl space-y-2">
    <h1>
      Simple <span
        class="animate-pulse bg-linear-to-r from-[#ffaa40] via-[#9c40ff] to-[#ffaa40] bg-size-[var(--bg-size)_100%] bg-clip-text text-transparent"
        >Pricing</span
      > for you
    </h1>

    <span class="text-center text-sm text-muted-foreground md:text-base">
      Free for local-first, affordable & transparent for cloud-based users
    </span>
  </div>

  <div
    class="mx-auto flex w-full max-w-3xl flex-col items-center gap-2 sm:flex-row"
  >
    {#each plans as plan (plan.name)}
      <div
        class={cn(
          "relative flex w-full flex-col overflow-hidden rounded-lg border shadow-xs",
        )}
      >
        <div
          class={cn(
            "border-b px-4 py-2",
            plan.highlighted && "bg-card dark:bg-card/80",
          )}
        >
          <layout.div
            class="absolute top-2 right-2 z-10 flex items-center gap-2"
            layout
            layoutDependency={frequency}
          >
            <AnimatePresence initial={false}>
              {@const badges = getBadges(plan, frequency)}
              {#each badges as badge (badge.id)}
                <layout.div
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  class={cn(
                    "z-10 flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs",
                    badge.variant === "primary"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background",
                  )}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  layout
                  transition={{ duration: badge.id === "popular" ? 0.1 : 0.15 }}
                >
                  {#if badge.id === "popular"}
                    <icons.Star class="size-3 fill-current" />
                  {/if}
                  {badge.label}
                </layout.div>
              {/each}
            </AnimatePresence>
          </layout.div>

          <div class="text-lg font-medium">{plan.name}</div>
          <span class="text-sm font-normal text-muted-foreground"
            >{plan.info}</span
          >

          <h3 class="my-1 flex w-max items-end gap-1">
            {#if NumberFlow}
              <NumberFlow
                class="text-3xl font-extrabold [&::part(suffix)]:text-base [&::part(suffix)]:font-normal [&::part(suffix)]:text-muted-foreground"
                format={{
                  style: "currency",
                  currency: "USD",
                  notation: "compact",
                }}
                suffix={plan.name === "Pro"
                  ? frequency === "yearly"
                    ? "/year"
                    : "/month"
                  : ""}
                value={plan.price[frequency] ?? plan.price.monthly}
              />
            {:else}
              <span class="text-3xl font-extrabold">
                {formatPrice(plan.price[frequency] ?? plan.price.monthly)}
                <span class="text-base font-normal text-muted-foreground">
                  {plan.name === "Pro"
                    ? frequency === "yearly"
                      ? "/year"
                      : "/month"
                    : ""}
                </span>
              </span>
            {/if}
          </h3>

          {#if plan.name === "Pro"}
            <div class="mt-4 mb-2 flex justify-start">
              <FrequencyToggle {frequency} {setFrequency} class="mx-0" />
            </div>
            <span class="text-xs font-normal text-muted-foreground">
              billed {frequency}
            </span>
          {:else}
            <span class="text-xs font-normal text-muted-foreground">
              {plan.name === "Free" ? "Free forever" : "one-time payment"}
            </span>
          {/if}
        </div>

        <div
          class={cn(
            "space-y-3 px-4 py-2 text-sm text-muted-foreground",
            plan.highlighted && "bg-muted/10",
          )}
        >
          {#each plan.features as feature, idx (idx)}
            <div class="flex items-center gap-2">
              <icons.CircleCheck class="size-3.5 text-foreground" />
              <span>{feature}</span>
            </div>
          {/each}
        </div>

        <div class={cn("mt-auto w-full p-3")}>
          <Button
            class="nodefault w-full"
            onclick={plan.btn.onclick}
            variant={plan.highlighted ? "default" : "outline"}
          >
            {plan.btn.text}
          </Button>
        </div>
      </div>
    {/each}
  </div>

  <div class="mx-auto mt-8 flex w-full max-w-3xl flex-col items-center justify-between rounded-xl border bg-card/60 p-6 shadow-lg backdrop-blur-sm sm:flex-row gap-6 relative overflow-hidden">
    <div class="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-emerald-400 to-cyan-400 opacity-80"></div>
    <div class="flex flex-col space-y-2">
      <div class="flex items-center gap-2 text-xl font-bold">
        <icons.Sparkles class="size-5 text-emerald-500" />
        AI Credits Add-on
      </div>
      <p class="text-sm text-muted-foreground">
        Works with both Free and Pro plans. Requires sign-in.
      </p>
      <div class="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <div class="flex items-center gap-1.5"><icons.CircleCheck class="size-4 text-emerald-500" /> Pay as you go</div>
        <div class="flex items-center gap-1.5"><icons.CircleCheck class="size-4 text-emerald-500" /> $0.60/1M input tokens</div>
        <div class="flex items-center gap-1.5"><icons.CircleCheck class="size-4 text-emerald-500" /> $5.00/1M output tokens</div>
        <div class="flex items-center gap-1.5"><icons.CircleCheck class="size-4 text-emerald-500" /> Never expires</div>
      </div>
    </div>
    <div class="flex flex-col items-center sm:items-end space-y-3 shrink-0">
      <div class="text-3xl font-extrabold">$5<span class="text-base font-normal text-muted-foreground">/top-up</span></div>
      <Button variant="secondary" href={resolve("/payment?type=credits")} class="w-full sm:w-auto shadow-md hover:shadow-lg transition-all duration-300">
        Buy AI Credits
      </Button>
    </div>
  </div>
</section>
