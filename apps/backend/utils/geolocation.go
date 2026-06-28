package utils

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gofiber/fiber/v3/log"
)

type ipApiResponse struct {
	Status  string `json:"status"`
	City    string `json:"city"`
	Country string `json:"country"`
	Message string `json:"message"`
}

// GetLocationFromIP queries ip-api.com to fetch the location of an IP address.
// It caches the result in the Valkey/Redis cache for 24 hours.
func GetLocationFromIP(ip string) string {
	if ip == "" || ip == "127.0.0.1" || ip == "::1" {
		return ""
	}

	cacheKey := "ip_location:" + ip
	var cachedLocation string
	if err := GetCache(cacheKey, &cachedLocation); err == nil {
		return cachedLocation
	}

	url := fmt.Sprintf("http://ip-api.com/json/%s", ip)
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		log.Error("Failed to request geolocation API: ", err)
		return ""
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Errorf("Geolocation API returned status %d", resp.StatusCode)
		return ""
	}

	var data ipApiResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		log.Error("Failed to decode geolocation response: ", err)
		return ""
	}

	if data.Status != "success" {
		log.Infof("Geolocation query failed for IP %s: %s", ip, data.Message)
		return ""
	}

	location := ""
	if data.City != "" && data.Country != "" {
		location = fmt.Sprintf("%s, %s", data.City, data.Country)
	} else if data.Country != "" {
		location = data.Country
	} else if data.City != "" {
		location = data.City
	}

	if location != "" {
		// Cache for 1 hours
		SetCache(cacheKey, location, 1*time.Hour)
	}

	return location
}
