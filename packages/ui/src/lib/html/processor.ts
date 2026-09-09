import katex from "katex";
import { common, createLowlight } from "lowlight";
import { getEmbeddedStyles } from "./styles.js";
import type { FullHtmlOptions, HtmlProcessorOptions } from "./types.js";

const lowlight = createLowlight(common);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

function unescapeHtml(str: string): string {
	return str
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#039;/g, "'");
}

interface HastNode {
	type?: string;
	value?: string;
	tagName?: string;
	properties?: { className?: string[] };
	children?: HastNode[];
}

/**
 * Converts a lowlight HAST syntax tree to an HTML string.
 */
function hastToHtml(node?: HastNode | null): string {
	if (!node) return "";
	if (node.type === "text") {
		return escapeHtml(node.value || "");
	}
	if (node.type === "element") {
		const tag = node.tagName || "span";
		const classes = node.properties?.className
			? ` class="${node.properties.className.join(" ")}"`
			: "";
		const children = (node.children || []).map(hastToHtml).join("");
		return `<${tag}${classes}>${children}</${tag}>`;
	}
	if (node.type === "root") {
		return (node.children || []).map(hastToHtml).join("");
	}
	return "";
}

// ─── Browser DOM Processing ───────────────────────────────────────────────────

let mermaidInstance: typeof import("mermaid").default | null = null;

async function getMermaid(theme?: "light" | "dark" | "system") {
	if (!mermaidInstance) {
		const mod = await import("mermaid");
		mermaidInstance = mod.default;
	}
	const isDark =
		theme === "dark" ||
		(theme !== "light" &&
			typeof document !== "undefined" &&
			document.documentElement.classList.contains("dark"));

	mermaidInstance.initialize({
		startOnLoad: false,
		theme: isDark ? "dark" : "default",
		securityLevel: "loose",
		fontFamily: "Inter, system-ui, -apple-system, sans-serif",
		fontSize: 16,
		flowchart: {
			htmlLabels: true,
			useMaxWidth: false,
			curve: "basis",
		},
		themeVariables: {
			fontSize: "16px",
			fontFamily: "Inter, system-ui, -apple-system, sans-serif",
		},
	});
	return mermaidInstance;
}

/**
 * Transforms Callout nodes into structured elements with emoji & content wrapper.
 */
function processCallouts(container: HTMLElement): void {
	const callouts = container.querySelectorAll<HTMLElement>(
		'div.callout, div[data-type="callout"]',
	);

	for (const callout of Array.from(callouts)) {
		// If already structured with callout-emoji and edra-callout-content, skip
		if (callout.querySelector(".callout-emoji")) continue;

		const emoji = callout.getAttribute("emoji") || "💡";

		// Create emoji icon element
		const emojiEl = callout.ownerDocument.createElement("div");
		emojiEl.className = "callout-emoji";
		emojiEl.setAttribute("aria-hidden", "true");
		emojiEl.textContent = emoji;

		// Create content wrapper and move children into it
		const contentEl = callout.ownerDocument.createElement("div");
		contentEl.className = "edra-callout-content";
		while (callout.firstChild) {
			contentEl.appendChild(callout.firstChild);
		}

		// Update parent container
		callout.className = "callout";
		callout.setAttribute("data-type", "callout");
		callout.setAttribute("emoji", emoji);
		callout.appendChild(emojiEl);
		callout.appendChild(contentEl);
	}
}

/**
 * Typesets KaTeX math formulas into pre-rendered HTML.
 */
function processMath(container: HTMLElement): void {
	const mathNodes = container.querySelectorAll<HTMLElement>(
		'[data-type="inline-math"], [data-type="block-math"], span.inline-math, div.block-math',
	);

	for (const node of Array.from(mathNodes)) {
		// If already rendered by KaTeX, skip
		if (node.querySelector(".katex")) continue;

		const latex =
			node.getAttribute("data-latex") ||
			node.getAttribute("data-value") ||
			node.textContent?.trim() ||
			"";
		if (!latex) continue;

		const isBlock =
			node.getAttribute("data-type") === "block-math" ||
			node.tagName.toLowerCase() === "div";

		try {
			const renderedHtml = katex.renderToString(latex, {
				displayMode: isBlock,
				throwOnError: false,
				macros: {
					"\\R": "\\mathbb{R}",
					"\\N": "\\mathbb{N}",
				},
			});
			node.innerHTML = renderedHtml;
			node.classList.add("katex-rendered");
		} catch (err) {
			console.error("KaTeX render error in getHTMLBody:", err);
		}
	}
}

/**
 * Applies syntax highlighting to code blocks using lowlight.
 */
function processCodeBlocks(
	container: HTMLElement,
	options?: HtmlProcessorOptions,
): void {
	const codeBlocks = container.querySelectorAll<HTMLElement>("pre code");

	for (const codeEl of Array.from(codeBlocks)) {
		// Skip mermaid diagrams (handled separately)
		if (
			codeEl.classList.contains("language-mermaid") ||
			codeEl.parentElement?.getAttribute("data-type") === "mermaid"
		) {
			continue;
		}

		// Skip already highlighted blocks
		if (codeEl.querySelector(".hljs-keyword, .hljs-string, .hljs-title")) {
			continue;
		}

		const langClass = Array.from(codeEl.classList).find((c) =>
			c.startsWith("language-"),
		);
		const lang = langClass ? langClass.replace("language-", "") : "";
		const rawCode = codeEl.textContent || "";
		if (!rawCode.trim()) continue;

		try {
			let highlightedHtml = "";
			if (lang && lowlight.registered(lang)) {
				const tree = lowlight.highlight(lang, rawCode);
				highlightedHtml = hastToHtml(tree);
			} else {
				const tree = lowlight.highlightAuto(rawCode);
				highlightedHtml = hastToHtml(tree);
			}

			codeEl.innerHTML = highlightedHtml;
			codeEl.classList.add("hljs");

			// Optionally add code header bar with language label
			if (options?.includeCodeHeader && lang) {
				const pre = codeEl.parentElement;
				if (pre && !pre.querySelector(".code-header")) {
					const header = pre.ownerDocument.createElement("div");
					header.className = "code-header";
					const badge = pre.ownerDocument.createElement("span");
					badge.className = "lang-badge";
					badge.textContent = lang.toUpperCase();
					header.appendChild(badge);
					pre.insertBefore(header, codeEl);
				}
			}
		} catch (err) {
			console.error("Code highlighting error in getHTMLBody:", err);
		}
	}
}

/**
 * Renders Mermaid diagrams into static SVG elements.
 */
async function processMermaid(
	container: HTMLElement,
	options?: HtmlProcessorOptions,
): Promise<void> {
	const mermaidNodes = container.querySelectorAll<HTMLElement>(
		'div[data-type="mermaid"], pre > code.language-mermaid',
	);

	if (mermaidNodes.length === 0) return;

	try {
		const mermaid = await getMermaid(options?.theme);

		for (let i = 0; i < mermaidNodes.length; i++) {
			const node = mermaidNodes[i];
			const target =
				node?.tagName.toLowerCase() === "code"
					? (node.parentElement as HTMLElement)
					: node;

			// If already rendered into a container with an SVG, skip
			if (
				target?.querySelector("svg") &&
				target.classList.contains("mermaid-container")
			) {
				continue;
			}

			const rawCode =
				target?.getAttribute("data-raw-mermaid") ||
				unescapeHtml(node?.textContent?.trim() || "");

			if (!rawCode) continue;

			const renderId = `mermaid-svg-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`;
			try {
				const { svg } = await mermaid.render(renderId, rawCode);
				const wrapper = target?.ownerDocument.createElement("div");
				if (!wrapper) continue;
				wrapper.className = "mermaid-container";
				wrapper.setAttribute("data-raw-mermaid", rawCode);
				wrapper.innerHTML = svg;

				const svgEl = wrapper.querySelector("svg");
				if (svgEl) {
					svgEl.removeAttribute("height");
					svgEl.style.width = "100%";
					svgEl.style.maxWidth = "100%";
					svgEl.style.height = "auto";
				}

				target?.replaceWith(wrapper);
			} catch (err) {
				console.error("Mermaid rendering error in getHTMLBody:", err);
				// Clean up stray elements created by Mermaid on error
				if (typeof document !== "undefined") {
					const stray = document.getElementById(renderId);
					if (stray) stray.remove();
				}
			}
		}
	} catch (e) {
		console.error("Failed to initialize Mermaid:", e);
	}
}

// ─── SSR Fallback Processing ──────────────────────────────────────────────────

function processHtmlServerSide(rawHtml: string): string {
	let output = rawHtml;

	// 1. Process Callouts via regex
	output = output.replace(
		/<div\s+([^>]*?)class="callout"([^>]*?)>([\s\S]*?)<\/div>/gi,
		(_match, before, after, content) => {
			const attrs = `${before} ${after}`;
			const emojiMatch = attrs.match(/emoji="([^"]*)"/i);
			const emoji = emojiMatch ? emojiMatch[1] : "💡";
			return `<div class="callout" data-type="callout" emoji="${escapeHtml(emoji ?? "💡")}"><div class="callout-emoji" aria-hidden="true">${escapeHtml(emoji ?? "💡")}</div><div class="edra-callout-content">${content}</div></div>`;
		},
	);

	// 2. Process KaTeX math via regex
	output = output.replace(
		/<(span|div)\s+([^>]*?)data-type="(inline-math|block-math)"([^>]*?)>([\s\S]*?)<\/\1>/gi,
		(_match, tag, before, type, after, inner) => {
			const attrs = `${before} ${after}`;
			const latexMatch =
				attrs.match(/data-latex="([^"]*)"/i) ||
				attrs.match(/data-value="([^"]*)"/i);
			const latex = latexMatch
				? unescapeHtml(latexMatch[1] ?? "")
				: inner.trim();
			if (!latex) return _match;

			const isBlock = type === "block-math" || tag.toLowerCase() === "div";
			try {
				const rendered = katex.renderToString(latex, {
					displayMode: isBlock,
					throwOnError: false,
					macros: { "\\R": "\\mathbb{R}", "\\N": "\\mathbb{N}" },
				});
				return `<${tag} ${before} data-type="${type}" ${after} class="katex-rendered">${rendered}</${tag}>`;
			} catch {
				return _match;
			}
		},
	);

	// 3. Process Code blocks via regex
	output = output.replace(
		/<pre><code(?:\s+class="([^"]*)")?>([\s\S]*?)<\/code><\/pre>/gi,
		(_match, classes, rawCode) => {
			if (classes?.includes("language-mermaid")) return _match;
			const langMatch = classes?.match(/language-([a-zA-Z0-9_-]+)/);
			const lang = langMatch ? langMatch[1] : "";
			const unescapedCode = unescapeHtml(rawCode);
			try {
				let highlightedHtml = "";
				if (lang && lowlight.registered(lang)) {
					const tree = lowlight.highlight(lang, unescapedCode);
					highlightedHtml = hastToHtml(tree);
				} else {
					const tree = lowlight.highlightAuto(unescapedCode);
					highlightedHtml = hastToHtml(tree);
				}
				const newClasses = [classes, "hljs"].filter(Boolean).join(" ");
				return `<pre><code class="${newClasses}">${highlightedHtml}</code></pre>`;
			} catch {
				return _match;
			}
		},
	);

	return output;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the fully-processed HTML body string with:
 * - Callout elements structured with emoji & content wrapper
 * - Math formulas typeset into KaTeX HTML
 * - Code blocks syntax-highlighted with lowlight
 * - Mermaid diagrams rendered into responsive SVGs
 */
export async function getHTMLBody(
	rawHtml: string,
	options?: HtmlProcessorOptions,
): Promise<string> {
	if (!rawHtml?.trim()) return "";

	// In browser/DOM environments, use DOMParser for accurate tree manipulation
	if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
		const parser = new DOMParser();
		const doc = parser.parseFromString(rawHtml, "text/html");
		const container = doc.body;

		// 1. Callouts
		processCallouts(container);

		// 2. KaTeX Math
		processMath(container);

		// 3. Code Syntax Highlighting
		processCodeBlocks(container, options);

		// 4. Mermaid Diagrams
		await processMermaid(container, options);

		return container.innerHTML;
	}

	// SSR / non-browser fallback
	return processHtmlServerSide(rawHtml);
}

/**
 * Returns a complete, self-contained HTML document containing:
 * - Complete <!DOCTYPE html> document structure
 * - Inter, DM Sans, and Fira Code font links
 * - KaTeX stylesheet link
 * - Complete Nota typography, callout, code, table, and print styles
 * - Pre-rendered body content (no client-side JS needed to view)
 */
export async function getFullHTML(
	name: string,
	content: string,
	options?: FullHtmlOptions,
): Promise<string> {
	const title = options?.title || name || "Untitled Note";
	const escapedTitle = escapeHtml(title);

	const bodyContent = options?.alreadyProcessed
		? content
		: await getHTMLBody(content, options);

	const embeddedCss = getEmbeddedStyles(options?.theme);
	const customCss = options?.customStyles
		? `\n/* Custom Styles */\n${options.customStyles}`
		: "";

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapedTitle}</title>

<!-- Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=DM+Sans:wght@400;500;600;700;800&family=Fira+Code:wght@400;500;600&display=swap" rel="stylesheet">

<!-- KaTeX CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css">

<style>
${embeddedCss}${customCss}
</style>
</head>
<body>
<h1 class="note-title">${escapedTitle}</h1>
<div class="article-content">
${bodyContent}
</div>
</body>
</html>`;
}
