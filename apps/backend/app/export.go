package app

import (
	"bufio"
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"time"

	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/models"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"
)

var gotenbergClient = &http.Client{
	Timeout: 60 * time.Second,
}

type PDFExportRequest struct {
	HTML string `json:"html"`
}

func ExportNoteToPDF(c fiber.Ctx) error {
	req := new(PDFExportRequest)
	if err := c.Bind().Body(req); err != nil || req.HTML == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status: fiber.StatusBadRequest,
			Error:  "Invalid request: html content is required",
		})
	}

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Add files index.html
	part, err := writer.CreateFormFile("files", "index.html")
	if err != nil {
		log.Error("Error creating form file for Gotenberg: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Failed to prepare PDF conversion request",
		})
	}
	if _, err := part.Write([]byte(req.HTML)); err != nil {
		log.Error("Error writing html payload to form file: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Failed to write PDF conversion data",
		})
	}

	// Add Gotenberg parameters
	_ = writer.WriteField("paperWidth", "8.5in")
	_ = writer.WriteField("paperHeight", "11in")
	_ = writer.WriteField("marginTop", "0.6in")
	_ = writer.WriteField("marginBottom", "0.6in")
	_ = writer.WriteField("marginLeft", "0.6in")
	_ = writer.WriteField("marginRight", "0.6in")
	_ = writer.WriteField("printBackground", "true")
	_ = writer.WriteField("waitDelay", "2s")
	_ = writer.WriteField("waitForExpression", "document.getElementById('ready-for-print') !== null")
	_ = writer.Close()

	httpReq, err := http.NewRequestWithContext(c.Context(), "POST", config.GOTENBERG_URL, body)
	if err != nil {
		log.Error("Error creating Gotenberg HTTP request: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Failed to create request to PDF service",
		})
	}
	httpReq.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := gotenbergClient.Do(httpReq)
	if err != nil {
		log.Error("Error sending request to Gotenberg service: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Failed to connect to PDF service: " + err.Error(),
		})
	}

	if resp.StatusCode != http.StatusOK {
		defer resp.Body.Close()
		errBytes, _ := io.ReadAll(resp.Body)
		log.Error("Gotenberg returned error status: ", resp.StatusCode, " body: ", string(errBytes))
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  fmt.Sprintf("PDF service failed with status %d: %s", resp.StatusCode, string(errBytes)),
		})
	}

	c.Set("Content-Type", "application/pdf")
	c.Set("Content-Disposition", `attachment; filename="export.pdf"`)

	return c.SendStreamWriter(func(w *bufio.Writer) {
		defer resp.Body.Close()
		if _, err := io.Copy(w, resp.Body); err != nil {
			log.Error("Error streaming PDF from Gotenberg to client: ", err)
		}
	})
}
