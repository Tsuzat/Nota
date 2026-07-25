import { fetchFn } from "./request";

/**
 * PDF Export Utility using Gotenberg v8 (https://render.nota.ink)
 */

export function generatePdfHtml(title: string, bodyHtml: string): string {
  const safeTitle = title.trim() || "Untitled Note";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${safeTitle}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/contrib/auto-render.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fira+Code:wght@400;500;600&display=swap');

    *, *::before, *::after {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 15px;
      line-height: 1.6;
      color: #0f172a;
      background-color: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .pdf-container {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
      padding: 1rem 0;
    }

    .doc-title {
      font-size: 2.25rem;
      font-weight: 800;
      letter-spacing: -0.025em;
      margin-top: 0;
      margin-bottom: 1.5rem;
      color: #0f172a;
      line-height: 1.25;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #e2e8f0;
    }

    /* Headings */
    h1, h2, h3, h4, h5, h6 {
      color: #0f172a;
      font-weight: 700;
      line-height: 1.3;
      margin-top: 1.75rem;
      margin-bottom: 0.75rem;
      page-break-after: avoid;
    }

    h1 { font-size: 1.85rem; font-weight: 800; margin-top: 2rem; }
    h2 { font-size: 1.45rem; font-weight: 700; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.3rem; }
    h3 { font-size: 1.2rem; font-weight: 600; }
    h4 { font-size: 1.05rem; font-weight: 600; }

    p {
      margin-top: 0;
      margin-bottom: 1rem;
    }

    a {
      color: #2563eb;
      text-decoration: underline;
    }

    /* Blockquotes */
    blockquote {
      margin: 1.25rem 0;
      padding: 0.5rem 0 0.5rem 1rem;
      border-left: 4px solid #cbd5e1;
      color: #475569;
      font-style: italic;
      background-color: #f8fafc;
      border-radius: 0 0.375rem 0.375rem 0;
    }

    blockquote p {
      margin: 0;
    }

    /* Lists */
    ul, ol {
      margin-top: 0.5rem;
      margin-bottom: 1rem;
      padding-left: 1.5rem;
    }

    li {
      margin-bottom: 0.35rem;
    }

    /* Task Lists */
    ul[data-type="taskList"] {
      list-style: none;
      padding-left: 0;
    }

    ul[data-type="taskList"] li {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      margin-bottom: 0.4rem;
    }

    ul[data-type="taskList"] input[type="checkbox"] {
      margin-top: 0.25rem;
      width: 1.1rem;
      height: 1.1rem;
      accent-color: #0f172a;
    }

    /* Code & Fenced Code Blocks */
    code:not(pre code) {
      font-family: 'Fira Code', 'SFMono-Regular', Consolas, Monaco, monospace;
      font-size: 0.875em;
      background-color: #f1f5f9;
      color: #0f172a;
      padding: 0.2rem 0.4rem;
      border-radius: 0.25rem;
      border: 1px solid #e2e8f0;
    }

    pre {
      font-family: 'Fira Code', 'SFMono-Regular', Consolas, Monaco, monospace;
      font-size: 0.875rem;
      background-color: #f8fafc;
      color: #1e293b;
      border: 1px solid #e2e8f0;
      padding: 1rem 1.25rem;
      border-radius: 0.5rem;
      overflow-x: auto;
      margin: 1.25rem 0;
      line-height: 1.6;
      page-break-inside: avoid;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
    }

    pre code {
      font-family: inherit;
      background: transparent !important;
      padding: 0;
      border: none;
    }

    .hljs {
      background: transparent !important;
      padding: 0 !important;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.25rem 0;
      font-size: 0.925rem;
      page-break-inside: avoid;
    }

    th, td {
      border: 1px solid #e2e8f0;
      padding: 0.6rem 0.8rem;
      text-align: left;
      vertical-align: top;
    }

    th {
      background-color: #f8fafc;
      font-weight: 600;
      color: #0f172a;
    }

    tr:nth-child(even) {
      background-color: #fafafa;
    }

    /* Callout */
    .callout, div[data-type="callout"] {
      display: flex;
      gap: 0.75rem;
      padding: 1rem;
      margin: 1.25rem 0;
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      page-break-inside: avoid;
    }

    /* Math (KaTeX) */
    .katex-display {
      margin: 1.25rem 0 !important;
      overflow-x: auto;
      overflow-y: hidden;
      padding: 0.5rem 0;
    }

    /* Mermaid Diagrams */
    div[data-type="mermaid"] {
      display: flex;
      justify-content: center;
      margin: 1.5rem 0;
      page-break-inside: avoid;
    }

    div[data-type="mermaid"] svg {
      max-width: 100% !important;
      height: auto !important;
    }

    /* Images */
    img {
      max-width: 100%;
      height: auto;
      border-radius: 0.5rem;
      margin: 1rem 0;
      page-break-inside: avoid;
    }

    hr {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 2rem 0;
    }
  </style>
</head>
<body>
  <div class="pdf-container">
    <h1 class="doc-title">${safeTitle}</h1>
    <div class="content">${bodyHtml}</div>
  </div>

  <script>
    document.addEventListener("DOMContentLoaded", async function() {
      // 1. Syntax Highlighting via Highlight.js
      try {
        if (window.hljs) {
          document.querySelectorAll('pre code').forEach(function(block) {
            hljs.highlightElement(block);
          });
        }
      } catch (err) {
        console.error('Highlight.js render error:', err);
      }

      // 2. Render Mermaid Diagrams
      try {
        if (window.mermaid) {
          mermaid.initialize({ startOnLoad: false, theme: 'default' });
          const mermaidNodes = document.querySelectorAll('div[data-type="mermaid"]');
          for (let i = 0; i < mermaidNodes.length; i++) {
            const node = mermaidNodes[i];
            const code = node.textContent.trim();
            if (code) {
              const { svg } = await mermaid.render('mermaid-svg-' + i, code);
              node.innerHTML = svg;
            }
          }
        }
      } catch (err) {
        console.error('Mermaid render error:', err);
      }

      // 3. Render KaTeX Math
      try {
        if (window.renderMathInElement) {
          renderMathInElement(document.body, {
            delimiters: [
              { left: '$$$', right: '$$$', display: true },
              { left: '$$', right: '$$', display: false },
              { left: '\\[', right: '\\]', display: true },
              { left: '\\(', right: '\\)', display: false }
            ],
            throwOnError: false
          });
        }
      } catch (err) {
        console.error('KaTeX render error:', err);
      }

      // 4. Mark document as ready for Gotenberg
      const readyMarker = document.createElement('div');
      readyMarker.id = 'ready-for-print';
      document.body.appendChild(readyMarker);
    });
  </script>
</body>
</html>`;
}

export async function convertHtmlToPdf(
  title: string,
  htmlContent: string,
): Promise<ArrayBuffer> {
  const fullHtml = generatePdfHtml(title, htmlContent);
  const formData = new FormData();

  const htmlBlob = new Blob([fullHtml], { type: "text/html" });
  formData.append("files", htmlBlob, "index.html");
  formData.append("paperWidth", "8.5in");
  formData.append("paperHeight", "11in");
  formData.append("marginTop", "0.6in");
  formData.append("marginBottom", "0.6in");
  formData.append("marginLeft", "0.6in");
  formData.append("marginRight", "0.6in");
  formData.append("printBackground", "true");
  formData.append("waitDelay", "2s");
  formData.append(
    "waitForExpression",
    "document.getElementById('ready-for-print') !== null",
  );

  const response = await fetchFn(
    "https://render.nota.ink/forms/chromium/convert/html",
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(
      `Gotenberg PDF generation failed (${response.status}): ${errText}`,
    );
  }

  return await response.arrayBuffer();
}
