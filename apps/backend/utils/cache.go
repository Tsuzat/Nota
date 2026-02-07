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
	if err != nil || len(cacheData) == 0 {
		log.Info("Cache miss: ", key)
		return err
	}
	if err := json.Unmarshal(cacheData, dest); err != nil {
		log.Error("Error when unmarshalling cache: ", err)
		return err
	}
	log.Info("Cache hit: ", key)
	return nil
}

func DeleteCache(key string) {
	if err := config.VALKEY.Delete(key); err != nil {
		log.Error("Error when deleting cache: ", err)
	} else {
		log.Info("Cache deleted successfully: ", key)
	}
}
