package app

import (
	"context"
	"net/http"

	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/models"
	"github.com/goccy/go-json"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"
	polar "github.com/polarsource/polar-go"
	"github.com/polarsource/polar-go/models/components"
	"github.com/polarsource/polar-go/models/operations"
	svix "github.com/svix/svix-webhooks/go"
)

func getCreditsToAdd(productId string) int {
	switch productId {
	case config.POLAR_MONTLY_SUB:
		return 2_000_000
	case config.POLAR_YEARLY_SUB:
		return 25_000_000
	case config.POLAR_AI_CREDITS:
		return 5_000_000
	default:
		return 0
	}
}

func getStorageToAdd(productId string) int64 {
	switch productId {
	case config.POLAR_MONTLY_SUB:
		return 1_000_000_000
	case config.POLAR_YEARLY_SUB:
		return 1_500_000_000
	default:
		return 0
	}
}

func getSubscriptionTier(productId string) string {
	if productId == config.POLAR_MONTLY_SUB || productId == config.POLAR_YEARLY_SUB {
		return "pro"
	}
	return "free"
}

func getSubscriptionTime(productId string) string {
	if productId == config.POLAR_YEARLY_SUB {
		return "yearly"
	}
	return "monthly"
}

func getPolarClient() *polar.Polar {
	opts := []polar.SDKOption{
		polar.WithSecurity(config.POLAR_API_KEY),
	}
	if config.POLAR_SERVER == "sandbox" {
		opts = append(opts, polar.WithServerURL("https://sandbox-api.polar.sh"))
	}
	return polar.New(opts...)
}

// Checkout generates a Polar checkout URL and redirects the user
func Checkout(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	productId := c.Query("productId")
	if productId == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status: fiber.StatusBadRequest,
			Error:  "productId is required",
		})
	}

	client := getPolarClient()

	checkoutSession, err := client.Checkouts.Create(c.Context(), components.CheckoutCreate{
		Products:      []string{productId},
		SuccessURL:    polar.String(config.POLAR_SUCCESS_URL),
		CustomerEmail: polar.String(user.Email),
	})

	if err != nil {
		log.Error("Polar Checkout Error:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Failed to create checkout session",
		})
	}

	if checkoutSession.Checkout != nil {
		return c.Redirect().To(checkoutSession.Checkout.URL)
	}

	return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
		Status: fiber.StatusInternalServerError,
		Error:  "Checkout URL not available",
	})
}

// Portal generates a Polar customer portal URL and redirects the user
func Portal(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	client := getPolarClient()

	var polarCustomerId string

	// 1. If we have the external ID, use it
	if user.ExternalCustomerId != "" {
		polarCustomerId = user.ExternalCustomerId
	} else {
		// 2. Try to find customer by email if ID is missing
		customers, err := client.Customers.List(c.Context(), operations.CustomersListRequest{
			Email: polar.String(user.Email),
		})
		if err != nil {
			log.Error("Polar Customer Lookup Error:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
				Status: fiber.StatusInternalServerError,
				Error:  "Failed to lookup customer information",
			})
		}

		if customers.ListResourceCustomer == nil || len(customers.ListResourceCustomer.Items) == 0 {
			return c.Status(fiber.StatusNotFound).JSON(models.APIError{
				Status: fiber.StatusNotFound,
				Error:  "No subscription or customer found. Please subscribe first.",
			})
		}
		polarCustomerId = customers.ListResourceCustomer.Items[0].ID
	}

	// 3. Create a Customer Session (Portal Session)
	session, err := client.CustomerSessions.Create(c.Context(), operations.CreateCustomerSessionsCreateCustomerSessionCreateCustomerSessionCustomerIDCreate(
		components.CustomerSessionCustomerIDCreate{
			CustomerID: polarCustomerId,
		},
	))

	if err != nil {
		log.Error("Polar Portal Session Error:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Failed to create portal session",
		})
	}

	if session.CustomerSession != nil {
		return c.Redirect().To(session.CustomerSession.CustomerPortalURL)
	}

	return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
		Status: fiber.StatusInternalServerError,
		Error:  "Customer portal URL not available",
	})
}

// PolarWebhook handles incoming webhooks from Polar
func PolarWebhook(c fiber.Ctx) error {
	payload := c.Body()
	headers := http.Header{}
	headers.Set("webhook-id", c.Get("webhook-id"))
	headers.Set("webhook-timestamp", c.Get("webhook-timestamp"))
	headers.Set("webhook-signature", c.Get("webhook-signature"))

	wh, err := svix.NewWebhook(config.POLAR_WEBHOOK_SECRET)
	if err != nil {
		log.Error("Svix Setup Error:", err)
		return c.Status(fiber.StatusInternalServerError).SendString("Webhook setup failed")
	}

	err = wh.Verify(payload, headers)
	if err != nil {
		log.Warn("Webhook verification failed:", err)
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status: fiber.StatusUnauthorized,
			Error:  "Invalid webhook signature",
		})
	}

	var event map[string]interface{}
	if err := json.Unmarshal(payload, &event); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status: fiber.StatusBadRequest,
			Error:  "Invalid JSON payload",
		})
	}

	eventType, _ := event["type"].(string)
	data, _ := event["data"].(map[string]interface{})

	log.Info("Polar Webhook Event:", eventType)

	switch eventType {
	case "subscription.created", "subscription.updated", "subscription.active":
		handleSubscriptionChange(c.Context(), data)
	case "subscription.canceled", "subscription.revoked":
		handleSubscriptionCanceled(c.Context(), data)
	}

	return c.Status(fiber.StatusOK).SendString("OK")
}

func handleSubscriptionChange(ctx context.Context, data map[string]interface{}) {
	customer, _ := data["customer"].(map[string]interface{})
	email, _ := customer["email"].(string)
	productId, _ := data["product_id"].(string)
	customerId, _ := data["customer_id"].(string)

	creditsToAdd := getCreditsToAdd(productId)
	storageToAdd := getStorageToAdd(productId)

	_, err := config.DB.NewUpdate().
		Model((*models.User)(nil)).
		Set("ai_credits = ai_credits + ?", creditsToAdd).
		Set("assigned_storage = ?", storageToAdd).
		Set("subscription_plan = ?", getSubscriptionTier(productId)).
		Set("subscription_type = ?", getSubscriptionTime(productId)).
		Set("external_customer_id = ?", customerId).
		Where("email = ?", email).
		Exec(ctx)

	if err != nil {
		log.Error("Webhook Update User Error:", err)
	}
}

func handleSubscriptionCanceled(ctx context.Context, data map[string]interface{}) {
	customer, _ := data["customer"].(map[string]interface{})
	email, _ := customer["email"].(string)

	_, err := config.DB.NewUpdate().
		Model((*models.User)(nil)).
		Set("assigned_storage = 0").
		Set("subscription_plan = 'free'").
		Set("subscription_type = NULL").
		Where("email = ?", email).
		Exec(ctx)

	if err != nil {
		log.Error("Webhook Canceled User Error:", err)
	}
}
