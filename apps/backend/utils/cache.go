package utils

import (
	"errors"
	"time"

	"github.com/Tsuzat/Nota/config"
	"github.com/goccy/go-json"
	"github.com/gofiber/fiber/v3/log"
)

func SetCache(key string, data any, ttl time.Duration) {
	if config.VALKEY == nil {
		return
	}
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
	if config.VALKEY == nil {
		return errors.New("Valkey disabled")
	}
	cacheData, err := config.VALKEY.Get(key)
	if err != nil {
		log.Info("Cache miss: ", key)
		return err
	}
	if len(cacheData) == 0 {
		log.Info("Cache miss: ", key)
		return errors.New("Nothing found on Cache")
	}
	if err := json.Unmarshal(cacheData, dest); err != nil {
		log.Error("Error when unmarshalling cache: ", err)
		return err
	}
	log.Info("Cache hit: ", key)
	return nil
}

func DeleteCache(key string) {
	if config.VALKEY == nil {
		return
	}
	if err := config.VALKEY.Delete(key); err != nil {
		log.Error("Error when deleting cache: ", err)
	} else {
		log.Info("Cache deleted successfully: ", key)
	}
}
