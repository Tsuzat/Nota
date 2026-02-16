package db

import (
	"errors"

	"github.com/Tsuzat/Nota/config"
	"github.com/gofiber/storage/valkey"
)

func ConnectValkey() error {
	if config.VALKEY_URL == "" {
		return errors.New("VALKEY_URL is not set")
	}
	config.VALKEY = valkey.New(valkey.Config{
		URL: config.VALKEY_URL,
	})
	return nil
}
