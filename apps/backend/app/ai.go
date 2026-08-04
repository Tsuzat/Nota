package app

import (
	"bufio"
	"context"
	"fmt"

	"strconv"
	"sync"

	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/db"
	"github.com/Tsuzat/Nota/models"
	"github.com/Tsuzat/Nota/utils"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"
	"google.golang.org/genai"
)

var (
	genAIClient *genai.Client
	genAIErr    error
	genAIOnce   sync.Once
)

func getGenAIClient() (*genai.Client, error) {
	genAIOnce.Do(func() {
		genAIClient, genAIErr = genai.NewClient(context.Background(), &genai.ClientConfig{
			APIKey: config.GEMINI_API_KEY,
		})
	})
	return genAIClient, genAIErr
}

const MODEL = "gemini-3.5-flash-lite" // Or whatever model is intended

type GenerateRequest struct {
	Prompt string `json:"prompt" validate:"required,min=1"`
	NoteId string `json:"note_id" validate:"required,uuid"`
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
	client, err := getGenAIClient()
	if err != nil {
		log.Error("Failed to create GenAI client:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Failed to initialize AI client",
		})
	}

	c.Set("Content-Type", "text/plain; charset=utf-8")
	c.Set("Transfer-Encoding", "chunked")
	c.Set("Connection", "keep-alive")
	c.Set("X-Accel-Buffering", "no")

	c.SendStreamWriter(func(w *bufio.Writer) {
		stream := client.Models.GenerateContentStream(
			ctx,
			MODEL,
			genai.Text(req.Prompt),
			&genai.GenerateContentConfig{},
		)

		var inputTokens, outputTokens int

		for chunk, err := range stream {
			if err != nil {
				log.Error("Gemini Stream Error:", err)
				w.WriteString("\n[Error generating response]")
				w.Flush()
				break
			}

			if chunk.UsageMetadata != nil {
				inputTokens = int(chunk.UsageMetadata.PromptTokenCount)
				outputTokens = int(chunk.UsageMetadata.CandidatesTokenCount)
			}

			if len(chunk.Candidates) > 0 && len(chunk.Candidates[0].Content.Parts) > 0 {
				part := chunk.Candidates[0].Content.Parts[0]
				text := part.Text
				if _, err := w.WriteString(text); err != nil {
					log.Error("Stream Write Error:", err)
					break
				}
				w.Flush()
			}
		}

		// Calculate cost
		// Input cost: $0.60 per 1M = 0.00006 cents per token
		// Output cost: $5.00 per 1M = 0.0005 cents per token
		inputCost := float64(inputTokens) * 0.00006
		outputCost := float64(outputTokens) * 0.0005
		totalCostCents := inputCost + outputCost

		if totalCostCents > 0 {
			description := fmt.Sprintf("%d input tokens, %d output tokens, $%.3f total.", inputTokens, outputTokens, totalCostCents/100.0)
			err = db.RecordAiUsage(context.Background(), user, req.NoteId, inputTokens, outputTokens, totalCostCents, description)
			if err != nil {
				log.Error("Failed to record AI usage:", err)
			} else {
				// Invalidate user cache to ensure latest credits are fetched
				utils.DeleteCache("user:" + user.Id)
			}
		}
	})
	return nil
}

func GetAiUsageLogs(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	logs, err := db.GetAiUsageLogs(c.Context(), user.Id, limit)
	if err != nil {
		log.Error("Failed to get AI usage logs:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Failed to get AI usage logs",
		})
	}

	return c.JSON(logs)
}
