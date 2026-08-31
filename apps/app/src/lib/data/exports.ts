import { fetch as fetchTauri } from "@tauri-apps/plugin-http";
import { PUBLIC_SERVER_URL } from "$app/env/public";
import { secureStorage } from "../platform/securestorage";
import { ISDESKTOP } from "../utils";

// ─── getFullHTML ──────────────────────────────────────────────────────────────
// Builds a complete, self-contained HTML document optimised for print/PDF.
// Includes CDN-loaded fonts, KaTeX CSS/JS, Highlight.js, Mermaid JS, and
// all typography/layout styles derived from the Nota editor theme.

export function getFullHTML(name: string, content: string): string {
	const title = name || "Untitled Note";
	const escapedTitle = escapeHtml(title);

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

<!-- KaTeX -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.js"></script>

<!-- Highlight.js -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-light.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>

<style>
/* ── CSS Custom Properties (Light Mode) ───────────────────────── */
:root {
  --background: #ffffff;
  --foreground: #171717;
  --muted: #f5f5f5;
  --muted-foreground: #737373;
  --border: #e5e5e5;
  --primary: #171717;
  --destructive: #dc2626;
}

/* ── Reset & Base ─────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html {
  font-size: 15px;
  line-height: 1.6;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: var(--foreground);
  background: var(--background);
  max-width: 48rem;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  box-sizing: border-box;
  overflow-wrap: break-word;
  word-wrap: break-word;
}

/* ── Note Title ───────────────────────────────────────────────── */
.note-title {
  font-family: 'DM Sans', 'Inter', sans-serif;
  font-size: 2.25rem;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.02em;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--border);
  color: var(--foreground);
  overflow-wrap: break-word;
}

/* ── Article Content (Typography) ─────────────────────────────── */
.article-content {
  font-size: 1.0625rem;
  line-height: 1.8;
  color: var(--foreground);
  word-break: break-word;
  overflow-wrap: break-word;
}

.article-content > *:first-child { margin-top: 0; }
.article-content > *:last-child { margin-bottom: 0; }

/* Headings */
.article-content h1,
.article-content h2,
.article-content h3,
.article-content h4,
.article-content h5,
.article-content h6 {
  font-family: 'DM Sans', 'Inter', sans-serif;
  color: var(--foreground);
  font-weight: 700;
  letter-spacing: -0.02em;
  text-wrap: balance;
}

.article-content h1 {
  font-size: 2.125rem;
  line-height: 1.25;
  margin-top: 2.75rem;
  margin-bottom: 1rem;
  font-weight: 800;
}

.article-content h2 {
  font-size: 1.625rem;
  line-height: 1.3;
  margin-top: 2.25rem;
  margin-bottom: 0.875rem;
  padding-bottom: 0.375rem;
  border-bottom: 1px solid var(--border);
}

.article-content h3 {
  font-size: 1.3125rem;
  line-height: 1.35;
  margin-top: 1.75rem;
  margin-bottom: 0.75rem;
}

.article-content h4 {
  font-size: 1.125rem;
  line-height: 1.4;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

/* Paragraphs */
.article-content p {
  margin-top: 1rem;
  margin-bottom: 1rem;
  line-height: 1.8;
}

/* Links */
.article-content a {
  color: var(--primary);
  text-decoration: underline;
  text-underline-offset: 3px;
  font-weight: 500;
}

/* Blockquotes */
.article-content blockquote {
  position: relative;
  margin: 1.5rem 0;
  padding: 0.75rem 1.25rem;
  border-left: 3px solid var(--primary);
  background-color: #f9f9f9;
  border-radius: 0 0.5rem 0.5rem 0;
  color: var(--muted-foreground);
  font-style: italic;
}

.article-content blockquote p { margin: 0.25rem 0; }

/* Lists */
.article-content ul,
.article-content ol {
  padding-left: 1.75rem;
  margin: 1rem 0;
}

.article-content ul { list-style-type: disc; }
.article-content ol { list-style-type: decimal; }
.article-content ul ul { list-style-type: circle; }
.article-content ul ul ul { list-style-type: square; }
.article-content ol ol { list-style-type: lower-alpha; }
.article-content ol ol ol { list-style-type: lower-roman; }

.article-content li {
  margin: 0.375rem 0;
  line-height: 1.75;
}

.article-content li > p { margin: 0.25rem 0; }

/* Task Lists */
.article-content ul[data-type="taskList"] {
  list-style: none;
  padding-left: 0;
}

.article-content ul[data-type="taskList"] li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.article-content ul[data-type="taskList"] li > label {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  height: 1.5rem;
  user-select: none;
}

.article-content ul[data-type="taskList"] li > div {
  flex: 1;
  min-width: 0;
}

.article-content ul[data-type="taskList"] li > div > p {
  margin: 0;
}

.article-content ul[data-type="taskList"] input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  margin-top: 0.25rem;
  accent-color: var(--primary);
}

.article-content ul[data-type="taskList"] li[data-checked="true"] > div {
  color: var(--muted-foreground);
  text-decoration: line-through;
}

/* Horizontal Rule */
.article-content hr {
  margin: 2rem 0;
  border: 0;
  border-top: 1px solid var(--border);
}

/* Inline Code */
.article-content code:not(pre code) {
  font-family: 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.875em;
  padding: 0.15rem 0.375rem;
  background-color: var(--muted);
  color: var(--foreground);
  border: 1px solid var(--border);
  border-radius: 0.375rem;
  font-weight: 500;
}

/* Code Blocks */
.article-content pre {
  position: relative;
  margin: 1.5rem 0;
  padding: 0;
  background-color: #f8f9fa;
  border: 1px solid var(--border);
  border-radius: 0.625rem;
  overflow: hidden;
  font-family: 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  box-sizing: border-box;
}

.article-content pre code {
  display: block;
  padding: 1rem 1.25rem;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: break-word;
  background: transparent !important;
  border: 0;
}

/* Tables */
.article-content table {
  width: 100%;
  margin: 1.5rem 0;
  border-collapse: collapse;
  font-size: 0.9375rem;
  border: 1px solid var(--border);
  word-break: break-word;
  box-sizing: border-box;
}

.article-content th,
.article-content td {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  text-align: left;
}

.article-content th p,
.article-content td p { margin: 0; }

.article-content th {
  background-color: var(--muted);
  font-weight: 600;
}

.article-content tr:nth-child(even) td {
  background-color: #fafafa;
}

/* Images & Media */
.article-content img {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 1.5rem auto;
  border-radius: 0.5rem;
  border: 1px solid var(--border);
  box-sizing: border-box;
}

.article-content audio {
  width: 100%;
  margin: 1rem 0;
}

.article-content iframe {
  width: 100%;
  aspect-ratio: 16 / 9;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  margin: 1.5rem 0;
  box-sizing: border-box;
}

/* Highlight Mark */
.article-content mark {
  background-color: rgba(253, 224, 71, 0.4);
  color: inherit;
  padding: 0.1rem 0.25rem;
  border-radius: 0.2rem;
}

/* ── Callout Styles ───────────────────────────────────────────── */
.article-content div[data-type="callout"] {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  margin: 1.25rem 0;
  border-radius: 0.5rem;
  border: 1px solid var(--border);
  background-color: var(--muted);
  box-sizing: border-box;
}

.article-content div[data-type="callout"] .callout-emoji {
  font-size: 1.25rem;
  line-height: 1.5;
  flex-shrink: 0;
}

.article-content div[data-type="callout"] .edra-callout-content {
  flex: 1;
  min-width: 0;
}

.article-content div[data-type="callout"] .edra-callout-content > p {
  margin: 0;
}

.article-content div[data-type="callout"] .edra-callout-content > p + p {
  margin-top: 0.5rem;
}

/* ── KaTeX Math ───────────────────────────────────────────────── */
.article-content [data-type="inline-math"] {
  display: inline-block;
  vertical-align: middle;
  margin: 0 0.15rem;
}

.article-content [data-type="block-math"] {
  display: block;
  margin: 1.5rem 0;
  text-align: center;
  overflow-x: auto;
}

.article-content .katex-display {
  margin: 1rem 0;
  padding: 0.25rem 0;
  overflow-x: auto;
  overflow-y: hidden;
}

/* ── Mermaid Diagrams ─────────────────────────────────────────── */
.mermaid-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: 1.25rem 0.75rem;
  margin: 1.5rem 0;
  border: 1px solid var(--border);
  border-radius: 0.625rem;
  background: #ffffff;
  overflow: hidden;
}

.mermaid-container svg {
  display: block;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  height: auto !important;
  box-sizing: border-box;
}

/* ── Print Styles ─────────────────────────────────────────────── */
@media print {
  body {
    padding: 0 8px;
    max-width: 100%;
    margin: 0 auto;
    box-sizing: border-box;
  }
  .note-title { page-break-after: avoid; }
  .article-content pre,
  .article-content table,
  .article-content div[data-type="callout"],
  .mermaid-container {
    page-break-inside: avoid;
    max-width: 100%;
    box-sizing: border-box;
  }
  .article-content h1,
  .article-content h2,
  .article-content h3,
  .article-content h4 {
    page-break-after: avoid;
  }
  .article-content img { page-break-inside: avoid; max-width: 100%; }
}
</style>
</head>
<body>
<h1 class="note-title">${escapedTitle}</h1>
<div class="article-content">
${content}
</div>

<!-- Mermaid JS -->
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<script>
(async function() {
  try {
    // 1. Render KaTeX formulas for inline-math and block-math
    document.querySelectorAll('[data-type="inline-math"], [data-type="block-math"]').forEach(function(el) {
      try {
        var latex = el.getAttribute('data-latex') || el.getAttribute('data-value') || el.textContent || '';
        var isBlock = el.getAttribute('data-type') === 'block-math' || el.tagName.toLowerCase() === 'div';
        if (latex && typeof katex !== 'undefined') {
          katex.render(latex, el, {
            displayMode: isBlock,
            throwOnError: false
          });
        }
      } catch(e) {
        console.error('KaTeX render error:', e);
      }
    });

    // 2. Syntax highlighting for code blocks
    if (typeof hljs !== 'undefined') {
      document.querySelectorAll('pre code').forEach(function(el) {
        if (!el.classList.contains('language-mermaid')) {
          hljs.highlightElement(el);
        }
      });
    }

    // 3. Render Mermaid diagrams
    if (typeof mermaid !== 'undefined') {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        fontSize: 16,
        flowchart: {
          htmlLabels: true,
          useMaxWidth: false,
          curve: 'basis'
        },
        themeVariables: {
          fontSize: '16px',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }
      });

      var mermaidNodes = [];
      document.querySelectorAll('pre > code.language-mermaid').forEach(function(codeEl) {
        mermaidNodes.push({
          target: codeEl.parentElement,
          code: codeEl.textContent || ''
        });
      });
      document.querySelectorAll('div[data-type="mermaid"]').forEach(function(divEl) {
        mermaidNodes.push({
          target: divEl,
          code: divEl.textContent || ''
        });
      });

      for (var i = 0; i < mermaidNodes.length; i++) {
        var item = mermaidNodes[i];
        var code = item.code.trim();
        if (!code) continue;
        var renderId = 'mermaid-svg-' + i + '-' + Math.random().toString(36).slice(2, 7);
        try {
          var renderRes = await mermaid.render(renderId, code);
          var wrapper = document.createElement('div');
          wrapper.className = 'mermaid-container';
          wrapper.innerHTML = renderRes.svg;

          var svgEl = wrapper.querySelector('svg');
          if (svgEl) {
            svgEl.removeAttribute('height');
            svgEl.style.width = '100%';
            svgEl.style.maxWidth = '100%';
            svgEl.style.height = 'auto';
          }

          item.target.parentNode.replaceChild(wrapper, item.target);
        } catch (err) {
          console.error('Mermaid render error:', err);
          var errEl = document.getElementById(renderId);
          if (errEl) errEl.remove();
        }
      }
    }

    window.notaReady = true;
  } catch (e) {
    console.error('Render error:', e);
    window.notaReady = true;
  }

  // Safety timeout
  setTimeout(function() { window.notaReady = true; }, 5000);
})();

// If no mermaid blocks, mark ready immediately after short tick for katex/hljs
setTimeout(function() {
  if (!document.querySelector('pre > code.language-mermaid') &&
      !document.querySelector('div[data-type="mermaid"]')) {
    window.notaReady = true;
  }
}, 300);
</script>
</body>
</html>`;
}

// ─── exportPDF ────────────────────────────────────────────────────────────────
// Sends the full HTML to the server, which proxies it to Gotenberg and returns
// the PDF. Handles authentication for both browser and desktop (Tauri).

export async function exportPDF(name: string, content: string): Promise<void> {
	const html = getFullHTML(name, content);

	// Build request options
	const requestUrl = `${PUBLIC_SERVER_URL}/api/export/pdf`;
	const body = JSON.stringify({ html });

	let response: Response;

	if (ISDESKTOP) {
		// Desktop (Tauri): Use Tauri HTTP plugin with Bearer auth
		const token = await secureStorage.getItem("access_token");
		response = await fetchTauri(requestUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token || ""}`,
			},
			body,
			credentials: "include",
		});
	} else {
		// Browser: Use standard fetch with cookies
		response = await fetch(requestUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body,
			credentials: "include",
		});
	}

	// Handle error responses
	if (!response.ok) {
		let errorMessage = "PDF export failed";
		try {
			const errorData = await response.json();
			if (errorData.error) errorMessage = errorData.error;
		} catch {
			// If response is not JSON, use status-based messages
			if (response.status === 401)
				errorMessage = "Please sign in to export PDFs";
			else if (response.status === 403)
				errorMessage = "PDF export requires a Pro plan";
			else if (response.status === 413)
				errorMessage = "Note is too large to export";
			else if (response.status >= 500)
				errorMessage = "PDF service is temporarily unavailable";
		}
		throw new Error(errorMessage);
	}

	const blob = await response.blob();
	const sanitizedName = sanitizeFilename(name);
	await exportFile(`${sanitizedName}.pdf`, blob);
}

// ─── exportFile ─────────────────────────────────────────────────────────────
// Universal file export function. On browser, creates a blob URL and triggers an
// <a> download. On desktop (Tauri), opens a native save dialog and writes the
// file using the filesystem plugin.

export async function exportFile(filename: string, blob: Blob): Promise<void> {
	if (ISDESKTOP) {
		// Desktop: Native save dialog + filesystem write
		const { save } = await import("@tauri-apps/plugin-dialog");
		const { writeFile } = await import("@tauri-apps/plugin-fs");

		// Extract extension from filename
		const ext = filename.split(".").pop() || "";
		const filters = ext
			? [{ name: `${ext.toUpperCase()} File`, extensions: [ext] }]
			: [];

		const filePath = await save({
			defaultPath: filename,
			filters,
		});

		if (!filePath) return; // User cancelled the dialog

		const arrayBuffer = await blob.arrayBuffer();
		await writeFile(filePath, new Uint8Array(arrayBuffer));
	} else {
		// Browser: Blob URL + <a> download
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

function sanitizeFilename(name: string): string {
	return (
		(name || "Untitled Note")
			.replace(/[^a-zA-Z0-9\s\-_]/g, "")
			.replace(/\s+/g, "-")
			.replace(/^-+|-+$/g, "")
			.substring(0, 100) || "note"
	);
}
