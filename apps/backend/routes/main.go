package routes

import (
	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/models"
	"github.com/gofiber/fiber/v3"
)

func checkHealth(c fiber.Ctx) error {
	return c.Status(200).JSON(models.APIResponse{
		Status:  200,
		Message: "Status Ok",
		Data:    "Ok",
	})
}

func RoutesInit() {
	config.APP.Get("/api/v1/healthcheck", checkHealth)

	InitAuthRouter()
	UserRouteInit()

}
