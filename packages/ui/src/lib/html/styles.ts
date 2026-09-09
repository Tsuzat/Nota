export function getEmbeddedStyles(theme?: "light" | "dark" | "system"): string {
	const isDarkTheme = theme === "dark";

	return `
/* ── CSS Custom Properties ────────────────────────────────────── */
:root {
  --background: ${isDarkTheme ? "#09090b" : "#ffffff"};
  --foreground: ${isDarkTheme ? "#f4f4f5" : "#171717"};
  --muted: ${isDarkTheme ? "#27272a" : "#f5f5f5"};
  --muted-foreground: ${isDarkTheme ? "#a1a1aa" : "#737373"};
  --border: ${isDarkTheme ? "#3f3f46" : "#e5e5e5"};
  --primary: ${isDarkTheme ? "#fafafa" : "#171717"};
  --code-bg: ${isDarkTheme ? "#18181b" : "#f8f9fa"};
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
  padding: 2.5rem 1.5rem;
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
  background-color: var(--muted);
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
  pointer-events: none;
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
  background-color: var(--code-bg);
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
  color: var(--foreground);
}

.code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.375rem 1rem;
  font-size: 0.75rem;
  color: var(--muted-foreground);
  background-color: var(--muted);
  border-bottom: 1px solid var(--border);
  font-family: ui-monospace, monospace;
  user-select: none;
  border-top-left-radius: 0.625rem;
  border-top-right-radius: 0.625rem;
}

.code-header .lang-badge {
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
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
  background-color: ${isDarkTheme ? "rgba(255,255,255,0.02)" : "#fafafa"};
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
.article-content div.callout,
.article-content div[data-type="callout"] {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  margin: 1.25rem 0;
  border-radius: 0.5rem;
  border: 1px solid var(--border);
  background-color: var(--muted);
  box-sizing: border-box;
}

.article-content div.callout .callout-emoji,
.article-content div[data-type="callout"] .callout-emoji {
  font-size: 1.25rem;
  line-height: 1.5;
  flex-shrink: 0;
  user-select: none;
}

.article-content div.callout .edra-callout-content,
.article-content div[data-type="callout"] .edra-callout-content {
  flex: 1;
  min-width: 0;
  line-height: 1.7;
}

.article-content div.callout .edra-callout-content > p:first-child,
.article-content div[data-type="callout"] .edra-callout-content > p:first-child {
  margin-top: 0;
}

.article-content div.callout .edra-callout-content > p:last-child,
.article-content div[data-type="callout"] .edra-callout-content > p:last-child {
  margin-bottom: 0;
}

.article-content div.callout .edra-callout-content > p + p,
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
  background: ${isDarkTheme ? "#18181b" : "#ffffff"};
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

/* ── Highlight.js Syntax Theme ────────────────────────────────── */
.hljs-comment,
.hljs-quote {
  color: ${isDarkTheme ? "#768390" : "#6a737d"};
  font-style: italic;
}

.hljs-keyword,
.hljs-selector-tag,
.hljs-subst {
  color: ${isDarkTheme ? "#f47067" : "#d73a49"};
  font-weight: 600;
}

.hljs-number,
.hljs-literal,
.hljs-variable,
.hljs-template-variable,
.hljs-attr,
.hljs-attribute,
.hljs-tag .hljs-attr {
  color: ${isDarkTheme ? "#6cb6ff" : "#005cc5"};
}

.hljs-string,
.hljs-doctag {
  color: ${isDarkTheme ? "#96d0ff" : "#22863a"};
}

.hljs-title,
.hljs-section,
.hljs-selector-id {
  color: ${isDarkTheme ? "#dcbdfb" : "#6f42c1"};
  font-weight: 600;
}

.hljs-type,
.hljs-class .hljs-title {
  color: ${isDarkTheme ? "#f69d50" : "#e36209"};
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
  .article-content div.callout,
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
`;
}
