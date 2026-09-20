<script lang="ts" module>
import { ISDESKTOP } from "#lib/utils.ts";

let open = $state(false);

export const openAbout = () => {
	if (!ISDESKTOP) return;
	open = true;
};

export const closeAbout = () => {
	open = false;
};
</script>

<script lang="ts">
import Bug from "@lucide/svelte/icons/bug";
import Check from "@lucide/svelte/icons/check";
import Copy from "@lucide/svelte/icons/copy";
import Cpu from "@lucide/svelte/icons/cpu";
import Globe from "@lucide/svelte/icons/globe";
import Heart from "@lucide/svelte/icons/heart";
import Laptop from "@lucide/svelte/icons/laptop";
import Layers from "@lucide/svelte/icons/layers";
import RefreshCw from "@lucide/svelte/icons/refresh-cw";
import Sparkles from "@lucide/svelte/icons/sparkles";
import Clock from "@lucide/svelte/icons/clock-4";
import { toast } from "@nota/ui";
import { BarSpinner, Github, } from "@nota/ui/icons/index.js";
import { Badge } from "@nota/ui/shadcn/badge/index.ts";
import { Button } from "@nota/ui/shadcn/button/index.ts";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@nota/ui/shadcn/dialog/index.ts";
import { Separator } from "@nota/ui/shadcn/separator/index.ts";

let appVersion = $state("0.9.94-beta");
let tauriVersion = $state("");
let osType = $state("");
let osArch = $state("");
let osVersion = $state("");
let isCopied = $state(false);
let hasLoadedInfo = $state(false);

type UpdateState = "idle" | "checking" | "available" | "up-to-date" | "error";
let updateStatus = $state<UpdateState>("idle");
let updateInfo = $state<{ version: string; date?: string } | null>(null);
let updateErrorMsg = $state<string>("");

function formatOsName(type: string): string {
	switch (type.toLowerCase()) {
		case "macos":
		case "darwin":
			return "macOS";
		case "windows":
		case "windows_nt":
			return "Windows";
		case "linux":
			return "Linux";
		default:
			return type || "Desktop";
	}
}

function formatArch(arch: string): string {
	switch (arch.toLowerCase()) {
		case "aarch64":
		case "arm64":
			return "Apple Silicon (arm64)";
		case "x86_64":
		case "x64":
			return "Intel / AMD (x86_64)";
		default:
			return arch || "x86_64";
	}
}

async function loadSystemInfo() {
	if (!ISDESKTOP || hasLoadedInfo) return;

	try {
		const { getVersion, getTauriVersion } = await import("@tauri-apps/api/app");
		appVersion = await getVersion();
		tauriVersion = await getTauriVersion();
	} catch (err) {
		console.warn("[About] Failed to get Tauri app info:", err);
	}

	try {
		const { type, arch, version } = await import("@tauri-apps/plugin-os");
		osType = formatOsName(type());
		osArch = formatArch(arch());
		osVersion = version();
	} catch (err) {
		console.warn("[About] Failed to get OS info:", err);
	}

	hasLoadedInfo = true;
}

$effect(() => {
	if (open) {
		loadSystemInfo();
	}
});

async function openExternalUrl(url: string) {
	try {
		const { openUrl } = await import("@tauri-apps/plugin-opener");
		await openUrl(url);
	} catch (err) {
		console.warn("[About] Native openUrl failed, using window.open fallback:", err);
		window.open(url, "_blank");
	}
}

async function handleCheckForUpdates() {
	if (updateStatus === "checking") return;
	updateStatus = "checking";
	updateErrorMsg = "";

	try {
		const { check } = await import("@tauri-apps/plugin-updater");
		const update = await check();
		if (update?.available) {
			updateStatus = "available";
			updateInfo = {
				version: update.version,
				date: update.date,
			};
		} else {
			updateStatus = "up-to-date";
		}
	} catch (err: any) {
		console.warn("[About] Update check failed:", err);
		updateStatus = "error";
		updateErrorMsg = err?.message || "Could not check for updates at this time.";
	}
}

async function copySystemDiagnostics() {
	const details = [
		"### Nota System Diagnostics",
		`- **App Version:** v${appVersion}`,
		tauriVersion ? `- **Tauri Core:** v${tauriVersion}` : null,
		osType ? `- **OS:** ${osType} ${osVersion}`.trim() : null,
		osArch ? `- **Architecture:** ${osArch}` : null,
		`- **Distribution:** Desktop Native`,
		`- **Timestamp:** ${new Date().toISOString()}`,
	]
		.filter(Boolean)
		.join("\n");

	try {
		await navigator.clipboard.writeText(details);
		isCopied = true;
		toast.success("System diagnostics copied to clipboard!");
		setTimeout(() => {
			isCopied = false;
		}, 2000);
	} catch (err) {
		console.warn("[About] Failed to copy diagnostics:", err);
		toast.error("Failed to copy diagnostics");
	}
}
</script>

<Dialog bind:open>
  <DialogContent
    class="overflow-hidden bg-popover/85 backdrop-blur-2xl p-0 sm:max-w-120 rounded-2xl shadow-2xl border flex flex-col gap-0"
  >
    <DialogHeader class="sr-only">
      <DialogTitle>About Nota</DialogTitle>
      <DialogDescription>
        Information about Nota, version details, and system specifications.
      </DialogDescription>
    </DialogHeader>

    <!-- Top Hero Section -->
    <div
      class="relative overflow-hidden pt-7 pb-5 px-6 flex flex-col items-center text-center bg-linear-to-b from-primary/5 via-primary/2 to-transparent"
    >
      <!-- Background Ambient Glow -->
      <div
        class="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10"
      ></div>

      <!-- App Logo -->
      <div class="relative group mb-3">
        <div
          class="absolute -inset-1 rounded-2xl bg-primary/20 blur-md opacity-70 group-hover:opacity-100 transition-opacity -z-10"
        ></div>
        <div
          class="size-16 rounded-2xl bg-card border border-border/60 shadow-lg flex items-center justify-center p-2.5 transition-transform duration-200 group-hover:scale-105"
        >
          <img
            src="/favicon.png"
            alt="Nota Logo"
            class="size-11 object-contain drop-shadow-sm"
          />
        </div>
      </div>

      <!-- Title & Badges -->
      <div class="flex items-center gap-2">
        <h2 class="text-xl font-bold tracking-tight text-foreground">
          Nota
        </h2>
        <Badge
          variant="secondary"
          class="font-mono text-xs px-2 py-0.5 rounded-md font-medium"
        >
          v{appVersion}
        </Badge>
        <Badge
          variant="outline"
          class="text-[11px] px-1.5 py-0 text-muted-foreground border-primary/20 bg-primary/5 rounded-md"
        >
          Beta
        </Badge>
      </div>

      <!-- Tagline -->
      <p class="mt-2 text-xs text-muted-foreground max-w-xs leading-relaxed">
        The modern, local-first note-taking and knowledge base application designed
        for speed, privacy, and clarity.
      </p>

      <!-- Live Update Checker Card -->
      <div
        class="mt-4 w-full rounded-xl border border-border/60 bg-card/60 p-2.5 px-3 flex items-center justify-between text-xs transition-colors"
      >
        <div class="flex items-center gap-2 min-w-0">
          {#if updateStatus === "checking"}
            <BarSpinner class="size-4 shrink-0 text-primary" />
            <span class="text-muted-foreground truncate">Checking for updates…</span>
          {:else if updateStatus === "available"}
            <Sparkles class="size-4 shrink-0 text-amber-500 animate-pulse" />
            <div class="flex flex-col text-left leading-tight truncate">
              <span class="font-medium text-foreground">
                Update available: v{updateInfo?.version}
              </span>
              <span class="text-[11px] text-muted-foreground">
                A new version of Nota is ready
              </span>
            </div>
          {:else if updateStatus === "up-to-date"}
            <Check class="size-4 shrink-0 text-emerald-500" />
            <span class="text-muted-foreground truncate">You're on the latest version</span>
          {:else if updateStatus === "error"}
            <span class="text-destructive text-[11px] truncate" title={updateErrorMsg}>
              {updateErrorMsg || "Update check unavailable"}
            </span>
          {:else}
            <Clock class="size-4 shrink-0 text-muted-foreground" />
            <span class="text-muted-foreground truncate">Keep Nota up to date</span>
          {/if}
        </div>

        <div class="shrink-0 pl-2">
          {#if updateStatus === "available"}
            <Button
              size="sm"
              class="h-7 text-xs px-2.5"
              onclick={() => openExternalUrl("https://github.com/Tsuzat/Nota/releases")}
            >
              Get Update
            </Button>
          {:else}
            <Button
              variant="outline"
              size="sm"
              class="h-7 text-xs px-2.5 gap-1.5"
              disabled={updateStatus === "checking"}
              onclick={handleCheckForUpdates}
            >
              <RefreshCw
                class="size-3 {updateStatus === 'checking' ? 'animate-spin' : ''}"
              />
              <span>{updateStatus === "up-to-date" ? "Check again" : "Check for updates"}</span>
            </Button>
          {/if}
        </div>
      </div>
    </div>

    <!-- Diagnostic Details Section -->
    <div class="px-6 py-4 space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
          System Specifications
        </span>
        <Button
          variant="ghost"
          size="sm"
          class="h-6 text-xs text-muted-foreground hover:text-foreground gap-1.5 px-2 -mr-1"
          onclick={copySystemDiagnostics}
        >
          {#if isCopied}
            <Check class="size-3 text-emerald-500" />
            <span class="text-emerald-500">Copied</span>
          {:else}
            <Copy class="size-3" />
            <span>Copy Specs</span>
          {/if}
        </Button>
      </div>

      <!-- Spec Cards Grid -->
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="rounded-xl border border-border/50 bg-card/40 p-2.5 flex items-start gap-2.5">
          <div class="rounded-lg bg-muted/60 p-1.5 text-muted-foreground">
            <Clock class="size-3.5" />
          </div>
          <div class="min-w-0">
            <div class="text-[11px] text-muted-foreground font-medium">Nota Version</div>
            <div class="font-mono font-medium text-foreground truncate">v{appVersion}</div>
          </div>
        </div>

        <div class="rounded-xl border border-border/50 bg-card/40 p-2.5 flex items-start gap-2.5">
          <div class="rounded-lg bg-muted/60 p-1.5 text-muted-foreground">
            <Layers class="size-3.5" />
          </div>
          <div class="min-w-0">
            <div class="text-[11px] text-muted-foreground font-medium">Tauri Core</div>
            <div class="font-mono font-medium text-foreground truncate">
              {tauriVersion ? `v${tauriVersion}` : "Native v2"}
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-border/50 bg-card/40 p-2.5 flex items-start gap-2.5">
          <div class="rounded-lg bg-muted/60 p-1.5 text-muted-foreground">
            <Laptop class="size-3.5" />
          </div>
          <div class="min-w-0">
            <div class="text-[11px] text-muted-foreground font-medium">Platform</div>
            <div class="font-medium text-foreground truncate">
              {osType || "Desktop"}{osVersion ? ` ${osVersion.split(".")[0]}` : ""}
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-border/50 bg-card/40 p-2.5 flex items-start gap-2.5">
          <div class="rounded-lg bg-muted/60 p-1.5 text-muted-foreground">
            <Cpu class="size-3.5" />
          </div>
          <div class="min-w-0">
            <div class="text-[11px] text-muted-foreground font-medium">Architecture</div>
            <div class="font-medium text-foreground truncate" title={osArch}>
              {osArch || "Native"}
            </div>
          </div>
        </div>
      </div>

      <!-- Quick External Links -->
      <div class="grid grid-cols-4 gap-1.5 pt-1">
        <Button
          variant="outline"
          size="sm"
          class="h-8 text-xs gap-1.5 px-2 hover:bg-muted/60"
          onclick={() => openExternalUrl("https://nota.ink")}
        >
          <Globe class="size-3.5 text-primary" />
          <span>Website</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          class="h-8 text-xs gap-1.5 px-2 hover:bg-muted/60"
          onclick={() => openExternalUrl("https://github.com/Tsuzat/Nota")}
        >
          <Github class="size-3.5" />
          <span>GitHub</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          class="h-8 text-xs gap-1.5 px-2 hover:bg-muted/60"
          onclick={() => openExternalUrl("https://github.com/Tsuzat/Nota/releases")}
        >
          <Sparkles class="size-3.5 text-amber-500" />
          <span>Releases</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          class="h-8 text-xs gap-1.5 px-2 hover:bg-muted/60"
          onclick={() => openExternalUrl("https://github.com/Tsuzat/Nota/issues")}
        >
          <Bug class="size-3.5 text-rose-500" />
          <span>Issues</span>
        </Button>
      </div>
    </div>

    <!-- Footer -->
    <Separator class="bg-border/60" />
    <div class="px-6 py-3 bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground">
      <div class="flex items-center gap-1">
        <span>Crafted with</span>
        <Heart class="size-3 text-red-500 fill-red-500 inline" />
        <span>by Tsuzat & contributors</span>
      </div>
      <div class="flex items-center gap-2 font-mono">
        <span>MIT License</span>
        <span>•</span>
        <span>© {new Date().getFullYear()}</span>
      </div>
    </div>
  </DialogContent>
</Dialog>
