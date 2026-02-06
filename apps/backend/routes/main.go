package routes

import (
	"github.com/Tsuzat/Nota/app"
	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/middleware"
	"github.com/Tsuzat/Nota/models"
	"github.com/gofiber/fiber/v3"
)

func checkHealth(c fiber.Ctx) error {
	isDesktop := c.Locals("isDesktop").(bool)
	data := "Ok"
	if isDesktop {
		data = "Send With Desktop Identifier"
	}
	return c.Status(200).JSON(models.APIResponse{
		Status:  200,
		Message: "Status Ok",
		Data:    data,
	})
}

func RoutesInit() {
	config.APP.Use(func(c fiber.Ctx) error {
		// check if this call is from DESKTOP
		desktopIdentifier := string(c.Request().Header.Peek("X-Nota-Desktop-Identifier"))
		isDesktop := desktopIdentifier == config.DESKTOP_APP_IDENTIFIER
		c.Locals("isDesktop", isDesktop)
		return c.Next()
	})

	config.APP.Get("/api/v1/healthcheck", checkHealth)

	InitAuthRouter()
	InitSessionRouter()
	InitStorageRouter()
	InitPaymentRouter()
	InitAIRouter()
	UserRouteInit()

	config.APP.Get("/api/v1/redeem/ai-credits", middleware.Authenticate, app.RedeemAICredits)

}
