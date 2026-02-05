package app

import (
	"bufio"
	"context"
	"fmt"
	"strings"

	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/models"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"
	"google.golang.org/genai"
)

const MODEL = "gemini-3-flash-preview"

const systemInstruction = `
### ROLE & OBJECTIVE
You are an intelligent, context-aware AI writing assistant embedded within a collaborative note-taking application. Your goal is to seamlessly augment the user's thought process. You do not chat; you co-create.

### CORE OPERATING PRINCIPLE: INTENT INFERENCE
Before generating text, analyze the user's request AND the surrounding context to determine the appropriate "Mode."

1. **The Architect Mode (Structure & Planning)**
   - Trigger: User asks for outlines, plans, or brainstorming.
   - Output: Use hierarchical Markdown (headers, bullet points). Be organized and comprehensive.

2. **The Coder Mode (Development & Engineering)**
   - Trigger: User asks for functions, classes, or bug fixes.
   - SUB-LOGIC for Code:
     - *Default:* Provide code + brief explanation of *why* it works.
     - *Constraint "Just code":* Output ONLY the code block. No intro/outro.
     - *Constraint "Explain this":* Output code with heavy inline comments and a breakdown text.
     - *Constraint "Refactor/Fix":* Output the corrected code and a diff-style summary of changes.

3. **The Scholar Mode (Learning & Math)**
   - Trigger: User asks for solutions, definitions, or complex explanations.
   - SUB-LOGIC for Depth:
     - If the user asks "What is X?": Provide a concise definition.
     - If the user asks "Explain X like I'm 5" or "Deep dive": Adjust complexity accordingly.
     - *Math/Logic:* Use LaTeX format ($$) for equations.

4. **The Editor Mode (Refining)**
   - Trigger: User highlights text and asks to summarize, expand, or change tone.
   - Output: Maintain the user's original voice but improve clarity/grammar.

### VERBOSITY & FORMATTING RULES
- **Mirror the Context:** If the user's existing notes are bulleted, continue with bullets. If they are writing paragraphs, write paragraphs.
- **Markdown is King:** Always formatting using standard Markdown (## Headers, **Bold**, > Quotes).
- **No Fluff:** Do not use conversational filler like "Sure, here is the code you asked for" or "I hope this helps." DIVE STRAIGHT INTO THE CONTENT.
- **Conciseness Algorithm:**
  - Short, specific prompt -> Short, direct answer.
  - Open-ended, complex prompt -> Structured, detailed answer.

### EXCEPTION HANDLING
- If the user's intent is ambiguous, lean towards **brevity**. It is easier for a user to ask "expand on this" than to delete 3 paragraphs of text.
- If the request is dangerous or unethical, refuse politely and briefly.

### INPUT VARIABLES
You will receive context in this format:
[PRECEDING_TEXT]: The text immediately before the cursor (if any).
[SELECTED_TEXT]: Text the user has highlighted (if any).
[USER_PROMPT]: The specific instruction the user just typed.
`

type GenerateRequest struct {
	Prompt string `json:"prompt" validate:"required,min=1"`
}

func GenerateContent(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	if user.AiCredits <= 0 {
		return c.Status(fiber.StatusForbidden).JSON(models.APIError{
			Status: fiber.StatusForbidden,
			Error:  "Insufficient AI credits",
		})
	}

	req := new(GenerateRequest)
	if err := c.Bind().Body(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status: fiber.StatusBadRequest,
			Error:  err.Error(),
		})
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey: config.GEMINI_API_KEY,
	})
	if err != nil {
		log.Error("Failed to create GenAI client:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Failed to initialize AI client",
		})
	}

	// 1. Count Input Tokens (Approximate)
	// Currently the SDK or model might not support simple token counting without a request.
	// We'll estimate or count after if possible.
	// The Go SDK typically doesn't have a standalone CountTokens in the core package easily accessible
	// without looking at specific model capabilities.
	// For now, we will assume 0 and update with response usage metadata if available.

	// Set headers for streaming
	c.Set("Content-Type", "text/plain; charset=utf-8")
	c.Set("Transfer-Encoding", "chunked")
	c.Set("Connection", "keep-alive")
	c.Set("X-Accel-Buffering", "no")

	// Use ContextWriter to stream data
	c.SendStreamWriter(func(w *bufio.Writer) {
		var fullText strings.Builder
		stream := client.Models.GenerateContentStream(
			ctx,
			MODEL,
			genai.Text(req.Prompt),
			&genai.GenerateContentConfig{
				SystemInstruction: &genai.Content{
					Parts: []*genai.Part{
						{Text: systemInstruction},
					},
				},
			},
		)

		for chunk, err := range stream {
			if err != nil {
				log.Error("Gemini Stream Error:", err)
				w.WriteString("\n[Error generating response]")
				w.Flush()
				break
			}
			if len(chunk.Candidates) > 0 && len(chunk.Candidates[0].Content.Parts) > 0 {
				part := chunk.Candidates[0].Content.Parts[0]
				text := part.Text
				fullText.WriteString(text)
				if _, err := w.WriteString(text); err != nil {
					log.Error("Stream Write Error:", err)
					break
				}
				w.Flush()
			}
		}

		// 3. Calculate Cost & Update DB
		// Simple estimation: 1 token ~= 4 chars (very rough)
		// Or assume output tokens from fullText.
		// Since we don't have CountTokens easily available in this snippet context without extra calls:
		// We will approximate.
		// Better: If the chunk or final response has UsageMetadata, use it.
		// The Go SDK GenAI v0.2.0 might have UsageMetadata in the chunk or response.
		// Let's assume we estimate for now based on length if metadata isn't easily grabbed from the stream loop.

		// TODO: Use actual CountTokens API when possible or check stream response for UsageMetadata
		inputTokens := len(req.Prompt) / 4
		outputTokens := len(fullText.String()) / 4
		totalCost := inputTokens + outputTokens

		if totalCost > 0 {
			_, err := config.DB.NewUpdate().
				Model((*models.User)(nil)).
				Set("ai_credits = GREATEST(0, ai_credits - ?)", totalCost).
				Where("id = ?", user.Id).
				Exec(context.Background())

			if err != nil {
				log.Error("Failed to update AI credits:", err)
			} else {
				log.Info(fmt.Sprintf("Updated credits for user %s: spent %d", user.Id, totalCost))
			}
		}
	})
	return nil
}
