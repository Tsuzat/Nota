import { auth } from "@nota/auth";
import { isUserPro } from "@nota/cache/user_quota";
import { env } from "@nota/env/server";
import { Hono } from "hono";

export const createPdfExportRoute = () => {
	const r = new Hono();

	r.post("/api/export/pdf", async (c) => {
		// 1. Authenticate
		const session = await auth.api.getSession({ headers: c.req.raw.headers });
		if (!session?.user) return c.json({ error: "Unauthorized" }, 401);

		// 2. Pro-only gating
		const isPro = await isUserPro(session.user.id);
		if (!isPro) {
			return c.json({ error: "PDF export requires a Pro plan" }, 403);
		}

		// 3. Parse request body
		let body: { html?: string } = {};
		try {
			body = await c.req.json();
		} catch {
			return c.json({ error: "Invalid request body" }, 400);
		}

		const html = body.html?.trim();
		if (!html) {
			return c.json({ error: "HTML content is required" }, 400);
		}

		// Reject excessively large payloads (2MB of HTML text)
		if (html.length > 2 * 1024 * 1024) {
			return c.json({ error: "Content too large" }, 413);
		}

		// 4. Build multipart/form-data for Gotenberg
		const formData = new FormData();

		// The HTML document as a file named "index.html"
		const htmlBlob = new Blob([html], { type: "text/html" });
		formData.append("files", htmlBlob, "index.html");

		// Gotenberg Chromium conversion options
		formData.append("waitForExpression", "window.notaReady === true");
		formData.append("waitDelay", "3s");
		formData.append("marginTop", "0.4");
		formData.append("marginBottom", "0.4");
		formData.append("marginLeft", "0.4");
		formData.append("marginRight", "0.4");
		formData.append("printBackground", "true");
		formData.append("preferCssPageSize", "false");
		formData.append("emulatedMediaType", "print");

		// 5. Forward to Gotenberg — streaming proxy
		try {
			const gotenbergUrl = `${env.PDF_RENDERER_URL}/forms/chromium/convert/html`;
			const gotenbergResponse = await fetch(gotenbergUrl, {
				method: "POST",
				body: formData,
			});

			if (!gotenbergResponse.ok) {
				const errorText = await gotenbergResponse
					.text()
					.catch(() => "Unknown error");
				console.error(
					`[pdf-export] Gotenberg error ${gotenbergResponse.status}: ${errorText}`,
				);
				return c.json(
					{ error: "PDF generation failed. Please try again." },
					502,
				);
			}

			// 6. Stream the PDF response directly to the client
			c.header("Content-Type", "application/pdf");
			c.header("Content-Disposition", 'attachment; filename="note.pdf"');

			// Forward content-length if Gotenberg provides it
			const contentLength = gotenbergResponse.headers.get("content-length");
			if (contentLength) {
				c.header("Content-Length", contentLength);
			}

			// Pipe the response body directly — no buffering
			return c.body(gotenbergResponse.body as ReadableStream);
		} catch (err) {
			console.error("[pdf-export] Failed to reach Gotenberg:", err);
			return c.json(
				{ error: "PDF service unavailable. Please try again later." },
				503,
			);
		}
	});

	return r;
};
