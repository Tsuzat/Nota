import { describe, expect, it } from "bun:test";
import { getFullHTML, getHTMLBody } from "../processor.js";

describe("HTML Processor", () => {
	it("transforms callouts into structured emoji + content divs", async () => {
		const raw = `<div class="callout" emoji="💡"><p>This is an important note</p></div>`;
		const result = await getHTMLBody(raw);

		expect(result).toContain('class="callout-emoji"');
		expect(result).toContain("💡");
		expect(result).toContain('class="edra-callout-content"');
		expect(result).toContain("<p>This is an important note</p>");
	});

	it("renders inline and block KaTeX math equations", async () => {
		const rawInline = `<span data-type="inline-math" data-latex="E = mc^2"></span>`;
		const resInline = await getHTMLBody(rawInline);
		expect(resInline).toContain("katex-rendered");
		expect(resInline).toContain("katex");

		const rawBlock = `<div data-type="block-math" data-latex="x^2 + y^2 = z^2"></div>`;
		const resBlock = await getHTMLBody(rawBlock);
		expect(resBlock).toContain("katex-rendered");
		expect(resBlock).toContain("katex-display");
	});

	it("highlights code blocks using lowlight", async () => {
		const rawCode = `<pre><code class="language-typescript">const answer: number = 42;</code></pre>`;
		const result = await getHTMLBody(rawCode);

		expect(result).toContain("hljs");
		expect(result).toContain("hljs-keyword");
		expect(result).toContain("hljs-number");
	});

	it("generates full standalone HTML documents", async () => {
		const title = "My Project Plan";
		const rawContent = `<div class="callout" emoji="🚀"><p>Launch ready!</p></div>`;

		const fullHtml = await getFullHTML(title, rawContent);

		expect(fullHtml).toContain("<!DOCTYPE html>");
		expect(fullHtml).toContain("<title>My Project Plan</title>");
		expect(fullHtml).toContain("<style>");
		expect(fullHtml).toContain(".callout-emoji");
		expect(fullHtml).toContain("Launch ready!");
	});
});
