package middleware

import (
	"strconv"
	"time"

	"github.com/Tsuzat/Nota/utils"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"
)

func RequestLogger(c fiber.Ctx) error {
	start := time.Now()

	clientInfo := utils.GetClientInfo(c, false)

	err := c.Next()

	duration := time.Since(start).Milliseconds()
	status := c.Response().StatusCode()

	message := "[" + c.Method() + "] " + c.Path() + " - " + strconv.Itoa(status) + " - " + strconv.FormatInt(duration, 10) + "ms"

	log.Infow(message,
		"method", c.Method(),
		"path", c.Path(),
		"status", status,
		"duration_ms", duration,
		"ip", clientInfo.IP,
		"location", clientInfo.Location,
		"os", clientInfo.OS,
		"browser", clientInfo.Browser,
		"user_agent", clientInfo.UserAgent,
	)

	return err
}
