package app

import (
	"context"
	"encoding/base64"
	"fmt"
	"net/http"
	"sync"

	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/models"
	"github.com/Tsuzat/Nota/utils"
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
		return 500_000
	case config.POLAR_YEARLY_SUB:
		return 6_000_000
	case config.POLAR_AI_CREDITS:
		return 1_000_000
	default:
		return 0
	}
}

func getStorageToAdd(productId string) int64 {
	switch productId {
	case config.POLAR_MONTLY_SUB, config.POLAR_YEARLY_SUB:
		return 5_000_000_000
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

var (
	polarClient *polar.Polar
	polarOnce   sync.Once
)

func getPolarClient() *polar.Polar {
	polarOnce.Do(func() {
		opts := []polar.SDKOption{
			polar.WithSecurity(config.POLAR_API_KEY),
		}
		if config.POLAR_SERVER == "sandbox" {
			opts = append(opts, polar.WithServerURL("https://sandbox-api.polar.sh"))
		}
		polarClient = polar.New(opts...)
	})
	return polarClient
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

	successURL := fmt.Sprintf("%s/payment-success?checkout_id={CHECKOUT_ID}", config.FRONTEND_URL)

	checkoutSession, err := client.Checkouts.Create(c.Context(), components.CheckoutCreate{
		Products:      []string{productId},
		SuccessURL:    polar.String(successURL),
		CustomerEmail: polar.String(user.Email),
		CustomerName:  polar.String(user.Name),
		CustomerID:    polar.String(user.Id),
	})

	if err != nil {
		log.Error("Polar Checkout Error:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Failed to create checkout session",
		})
	}

	if checkoutSession.Checkout != nil {
		return c.Redirect().Status(fiber.StatusPermanentRedirect).To(checkoutSession.Checkout.URL)
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

// SubscriptionDetails fetches active subscription data from Polar API
func SubscriptionDetails(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	client := getPolarClient()

	var polarCustomerId string

	// 1. Get Customer ID
	if user.ExternalCustomerId != "" {
		polarCustomerId = user.ExternalCustomerId
	} else {
		customers, err := client.Customers.List(c.Context(), operations.CustomersListRequest{
			Email: polar.String(user.Email),
		})
		if err != nil || customers.ListResourceCustomer == nil || len(customers.ListResourceCustomer.Items) == 0 {
			return c.Status(fiber.StatusOK).JSON(fiber.Map{
				"subscription_plan": "free",
			})
		}
		polarCustomerId = customers.ListResourceCustomer.Items[0].ID
	}

	// 2. Query Subscriptions
	customerIdFilter := operations.CreateCustomerIDFilterStr(polarCustomerId)
	subs, err := client.Subscriptions.List(c.Context(), operations.SubscriptionsListRequest{
		CustomerID: &customerIdFilter,
		Active:     polar.Bool(true),
	})

	if err != nil || subs.ListResourceSubscription == nil || len(subs.ListResourceSubscription.Items) == 0 {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"subscription_plan": "free",
		})
	}

	sub := subs.ListResourceSubscription.Items[0]

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"subscription_plan":    getSubscriptionTier(sub.ProductID),
		"subscription_type":    getSubscriptionTime(sub.ProductID),
		"status":               sub.Status,
		"current_period_start": sub.CurrentPeriodStart,
		"current_period_end":   sub.CurrentPeriodEnd,
		"cancel_at_period_end": sub.CancelAtPeriodEnd,
		"canceled_at":          sub.CanceledAt,
		"amount":               sub.Amount,
		"currency":             sub.Currency,
	})
}

// GetCheckoutDetails fetches details for a given checkout session ID
func GetCheckoutDetails(c fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status: fiber.StatusBadRequest,
			Error:  "Checkout ID is required",
		})
	}

	client := getPolarClient()
	res, err := client.Checkouts.Get(c.Context(), id)
	if err != nil || res == nil || res.Checkout == nil {
		return c.Status(fiber.StatusNotFound).JSON(models.APIError{
			Status: fiber.StatusNotFound,
			Error:  "Checkout session not found",
		})
	}

	checkout := res.Checkout

	paymentMethod := "Card / Digital Wallet"
	if checkout.PaymentProcessor != "" {
		paymentMethod = string(checkout.PaymentProcessor)
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"id":             checkout.ID,
		"status":         checkout.Status,
		"amount":         checkout.Amount,
		"total_amount":   checkout.TotalAmount,
		"currency":       checkout.Currency,
		"created_at":     checkout.CreatedAt,
		"payment_method": paymentMethod,
	})
}

// PolarWebhook handles incoming webhooks from Polar
func PolarWebhook(c fiber.Ctx) error {
	payload := c.Body()
	headers := http.Header{}
	headers.Set("webhook-id", c.Get("webhook-id"))
	headers.Set("webhook-timestamp", c.Get("webhook-timestamp"))
	headers.Set("webhook-signature", c.Get("webhook-signature"))
	base64Secret := base64.StdEncoding.EncodeToString([]byte(config.POLAR_WEBHOOK_SECRET))

	wh, err := svix.NewWebhook(base64Secret)
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

	var event map[string]any
	if err := json.Unmarshal(payload, &event); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status: fiber.StatusBadRequest,
			Error:  "Invalid JSON payload",
		})
	}

	eventType, _ := event["type"].(string)
	data, _ := event["data"].(map[string]any)

	log.Info("Polar Webhook Event:", eventType)

	switch eventType {
	case "subscription.active", "subscription.updated":
		handleSubscriptionChange(c.Context(), data)
	case "subscription.canceled", "subscription.revoked":
		handleSubscriptionCanceled(c.Context(), data)
	case "order.paid":
		handleOrderPaid(c.Context(), data)
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

	var userId string
	err := config.DB.NewUpdate().
		Model((*models.User)(nil)).
		Set("ai_credits = ai_credits + ?", creditsToAdd).
		Set("assigned_storage = ?", storageToAdd).
		Set("subscription_plan = ?", getSubscriptionTier(productId)).
		Set("subscription_type = ?", getSubscriptionTime(productId)).
		Set("external_customer_id = ?", customerId).
		Where("email = ?", email).
		Returning("id").
		Scan(ctx, &userId)

	if err != nil {
		log.Error("Webhook Update User Error:", err)
	} else {
		utils.DeleteCache("user:" + userId)
		log.Infof("Successfully updated subscription for user email: %s, id: %s", email, userId)
	}
}

func handleOrderPaid(ctx context.Context, data map[string]interface{}) {
	productId, _ := data["product_id"].(string)
	if productId != config.POLAR_AI_CREDITS {
		return
	}

	customer, _ := data["customer"].(map[string]interface{})
	email, _ := customer["email"].(string)
	if email == "" {
		return
	}

	creditsToAdd := getCreditsToAdd(productId)
	if creditsToAdd <= 0 {
		return
	}

	customerId, _ := data["customer_id"].(string)

	var userId string
	err := config.DB.NewUpdate().
		Model((*models.User)(nil)).
		Set("ai_credits = ai_credits + ?", creditsToAdd).
		Set("external_customer_id = ?", customerId).
		Where("email = ?", email).
		Returning("id").
		Scan(ctx, &userId)

	if err != nil {
		log.Error("Webhook Order Paid Update User Error:", err)
	} else {
		utils.DeleteCache("user:" + userId)
		log.Infof("Successfully processed order paid for user email: %s, id: %s", email, userId)
	}
}

func handleSubscriptionCanceled(ctx context.Context, data map[string]interface{}) {
	customer, _ := data["customer"].(map[string]interface{})
	email, _ := customer["email"].(string)

	var userId string
	err := config.DB.NewUpdate().
		Model((*models.User)(nil)).
		Set("assigned_storage = 0").
		Set("subscription_plan = 'free'").
		Set("subscription_type = NULL").
		Where("email = ?", email).
		Returning("id").
		Scan(ctx, &userId)

	if err != nil {
		log.Error("Webhook Canceled User Error:", err)
	} else {
		utils.DeleteCache("user:" + userId)
		log.Infof("Successfully canceled subscription for user email: %s, id: %s", email, userId)
	}
}
