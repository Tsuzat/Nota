package routes

import (
	"github.com/Tsuzat/Nota/app"
	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/middleware"
)

func InitPaymentRouter() {
	group := config.APP.Group("/api/v1/payments")

	// Protected routes
	group.Get("/checkout", middleware.Authenticate, app.Checkout)
	group.Get("/portal", middleware.Authenticate, app.Portal)

	// Webhook route (not protected)
	group.Post("/hooks", app.PolarWebhook)
}
