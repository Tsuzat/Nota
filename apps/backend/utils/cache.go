package utils

import (
	"time"

	"github.com/Tsuzat/Nota/config"
	"github.com/goccy/go-json"
	"github.com/gofiber/fiber/v3/log"
)

func SetCache(key string, data any, ttl time.Duration) {
	// convert data to []byte
	dataBytes, err := json.Marshal(data)
	if err != nil {
		log.Error("Error when marshalling data: ", err)
		return
	}
	if config.VALKEY.Set(key, dataBytes, ttl) != nil {
		log.Error("Error when setting cache: ", err)
	} else {
		log.Info("Cache set successfully: ", key)
	}
}

func GetCache(key string, dest any) error {
	cacheData, err := config.VALKEY.Get(key)
	if err != nil {
		log.Error("Error when trying to get the cache for key: ", key, "\n Error: ", err)
		return err
	}
	return json.Unmarshal(cacheData, dest)
}
