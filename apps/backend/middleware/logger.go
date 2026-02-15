package middleware

import (
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"
)

func RequestLogger(c fiber.Ctx) error {
	start := time.Now()

	ua := c.Get("User-Agent")
	if ua == "" {
		ua = "Unknown"
	}

	browser := "Unknown Browser"
	osName := "Unknown OS"

	lowerUA := strings.ToLower(ua)

	switch {
	case strings.Contains(lowerUA, "edg"):
		browser = "Edge"
	case strings.Contains(lowerUA, "chrome") || strings.Contains(lowerUA, "crios"):
		browser = "Chrome"
	case strings.Contains(lowerUA, "firefox") || strings.Contains(lowerUA, "fxios"):
		browser = "Firefox"
	case strings.Contains(lowerUA, "safari"):
		browser = "Safari"
	}

	switch {
	case strings.Contains(lowerUA, "windows"):
		osName = "Windows"
	case strings.Contains(lowerUA, "macintosh") || strings.Contains(lowerUA, "mac os x"):
		osName = "macOS"
	case strings.Contains(lowerUA, "android"):
		osName = "Android"
	case strings.Contains(lowerUA, "iphone") || strings.Contains(lowerUA, "ipad") || strings.Contains(lowerUA, "ipod"):
		osName = "iOS"
	}

	location := c.Get("CF-IPCountry")
	if location == "" {
		location = c.Get("X-Vercel-IP-Country")
	}
	if location == "" {
		location = "Unknown"
	}

	err := c.Next()

	duration := time.Since(start).Milliseconds()
	status := c.Response().StatusCode()

	message := "[" + c.Method() + "] " + c.Path() + " - " + strconv.Itoa(status) + " - " + strconv.FormatInt(duration, 10) + "ms"

	log.Infow(message,
		"method", c.Method(),
		"path", c.Path(),
		"status", status,
		"duration_ms", duration,
		"ip", c.IP(),
		"location", location,
		"os", osName,
		"browser", browser,
		"user_agent", ua,
	)

	return err
}
