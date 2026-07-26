<script lang="ts">
  import { AnimatePresence, createLayoutMotion } from "motion-sv";
  import FrequencyToggle, { type FREQUENCY } from "./frequency-toggle.svelte";
  import { Button } from "@lib/components/ui/button";
  import { cn } from "@lib/utils";

  import { onMount } from "svelte";
  import { icons } from "@lib/icons";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";

  let NumberFlow: typeof import("@number-flow/svelte").default | undefined =
    $state(undefined);

  onMount(async () => {
    const mod = await import("@number-flow/svelte");
    NumberFlow = mod.default;
  });

  let frequency = $state<FREQUENCY>("monthly");

  type Plan = {
    name: string;
    info: string;
    price: {
      monthly: number;
      yearly: number;
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
        id: "popular";
        label: string;
        variant: "neutral";
      }
    | {
        id: "discount";
        label: string;
        variant: "primary";
      };

  const plans = $derived<Plan[]>([
    {
      name: "Free",
      info: "Local-first purists & BYOK users",
      price: {
        monthly: 0,
        yearly: 0,
      },
      features: [
        "Unlimited Local Notes & Workspaces",
        "1 Cloud Workspace, 5 Cloud Notes",
        "Local Media Storage Only",
        "BYOK or Buy AI Credits",
        "Local only Collaboration",
        "Local app access",
        "Regular Updates & Bug Fixes",
        "Local Notes Backup",
      ],
      btn: {
        text: "Get Started",
        onclick: () => {},
      },
    },
    {
      highlighted: true,
      name: "Pro",
      info: "Cloud-sync power users",
      price: {
        monthly: 5,
        yearly: 50,
      },
      features: [
        "Unlimited Cloud Notes & Workspaces",
        "5 GB Cloud Storage",
        frequency === "monthly" ? "500K AI Credits / mo" : "6M AI Credits",
        "Collaborative Notes",
        "Browser Previews & Web Access",
        "Encrypted Data",
        "Notes Backup",
      ],
      btn: {
        text: "Get started",
        onclick: async () => {
          goto(resolve(`/payment?type=${frequency}`));
        },
      },
    },
  ]);

  const layout = createLayoutMotion();

  const setFrequency = layout.update.with((nextFrequency: FREQUENCY) => {
    frequency = nextFrequency;
  });

  function formatPrice(value: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
    }).format(value);
  }

  function getDiscount(plan: Plan) {
    if (plan.price.monthly == 0 || plan.price.yearly == 0) {
      return 0;
    }
    const defaultYearly = plan.price.monthly * 12;
    return Math.round(
      ((defaultYearly - plan.price.yearly) / defaultYearly) * 100,
    );
  }

  function getBadges(plan: Plan, activeFrequency: FREQUENCY): PlanBadge[] {
    const badges: PlanBadge[] = [];

    if (plan.highlighted) {
      badges.push({
        id: "popular",
        label: "Popular",
        variant: "neutral",
      });
    }

    if (activeFrequency === "yearly") {
      const discount = getDiscount(plan);

      if (discount >= 0) {
        badges.push({
          id: "discount",
          label: `${discount}% off`,
          variant: "primary",
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

  <FrequencyToggle {frequency} {setFrequency} />

  <div class="mx-auto grid w-full max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
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
                suffix={frequency === "yearly" ? "/year" : "/month"}
                value={plan.price[frequency]}
              />
            {:else}
              <span class="text-3xl font-extrabold">
                {formatPrice(plan.price[frequency])}
                <span class="text-base font-normal text-muted-foreground">
                  {frequency === "yearly" ? "/year" : "/month"}
                </span>
              </span>
            {/if}
          </h3>

          <span class="text-xs font-normal text-muted-foreground">
            billed {frequency}
          </span>
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
</section>
