package utils

import (
	"fmt"
	"strings"

	"github.com/gofiber/fiber/v3"
)

type ClientInfo struct {
	IP        string
	UserAgent string
	Browser   string
	OS        string
	Location  string
	Device    string
}

func GetClientInfo(c fiber.Ctx, isDesktop bool) ClientInfo {
	ua := c.Get("User-Agent")
	if ua == "" {
		ua = "Unknown"
	}

	lowerUA := strings.ToLower(ua)
	secChUa := strings.ToLower(c.Get("Sec-Ch-Ua"))

	browser := "Unknown Browser"
	switch {
	case strings.Contains(secChUa, "zen") || strings.Contains(lowerUA, "zen"):
		browser = "Zen"
	case strings.Contains(secChUa, "brave") || strings.Contains(lowerUA, "brave"):
		browser = "Brave"
	case strings.Contains(secChUa, "edg") || strings.Contains(lowerUA, "edg"):
		browser = "Edge"
	case strings.Contains(secChUa, "chrome") || strings.Contains(lowerUA, "chrome") || strings.Contains(lowerUA, "crios"):
		browser = "Chrome"
	case strings.Contains(secChUa, "firefox") || strings.Contains(lowerUA, "firefox") || strings.Contains(lowerUA, "fxios"):
		browser = "Firefox"
	case strings.Contains(secChUa, "safari") || strings.Contains(lowerUA, "safari"):
		browser = "Safari"
	}

	osName := "Unknown OS"
	device := "web"

	cfDevice := c.Get("CF-Device-Type")
	switch cfDevice {
	case "desktop":
		device = "desktop"
	case "mobile", "tablet":
		device = "mobile"
	}

	if isDesktop {
		device = "desktop"
	}

	switch {
	case strings.Contains(lowerUA, "windows") || strings.Contains(lowerUA, "win"):
		osName = "Windows"
	case strings.Contains(lowerUA, "macintosh") || strings.Contains(lowerUA, "mac os x") || strings.Contains(lowerUA, "mac"):
		osName = "macOS"
	case strings.Contains(lowerUA, "android"):
		osName = "Android"
		if !isDesktop {
			device = "mobile"
		}
	case strings.Contains(lowerUA, "iphone") || strings.Contains(lowerUA, "ipad") || strings.Contains(lowerUA, "ipod"):
		osName = "iOS"
		if !isDesktop {
			device = "mobile"
		}
	case strings.Contains(lowerUA, "linux"):
		osName = "Linux"
	}

	// For legacy TAURI / Nota desktop UA
	if strings.Contains(lowerUA, "tauri") || strings.Contains(lowerUA, "nota-desktop") {
		device = "desktop"
	}

	// Cloudflare Headers
	ip := c.Get("CF-Connecting-IP")
	if ip == "" {
		ip = c.IP()
	}

	country := c.Get("CF-IPCountry")
	city := c.Get("CF-IPCity")

	location := ""
	if city != "" && country != "" {
		location = fmt.Sprintf("%s, %s", city, country)
	} else if country != "" {
		location = country
	} else if city != "" {
		location = city
	} else {
		// Fallback to Vercel if needed
		location = c.Get("X-Vercel-IP-Country")
	}

	return ClientInfo{
		IP:        ip,
		UserAgent: ua,
		Browser:   browser,
		OS:        osName,
		Location:  location,
		Device:    device,
	}
}
