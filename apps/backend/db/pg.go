package db

import (
	"errors"
	"time"

	"github.com/Tsuzat/Nota/config"
	"github.com/go-pg/pg/v10"
)

func ConnectDB() error {
	if config.DB_URL == "" {
		return errors.New("DB_URL is not set")
	}
	opts, err := pg.ParseURL(config.DB_URL)
	// Set connection pooling options
	opts.PoolSize = 100                 // Set maximum number of connections in the pool
	opts.MinIdleConns = 10              // Maintain a minimum number of idle connections
	opts.MaxConnAge = 5 * time.Minute   // Close connections older than this duration
	opts.IdleTimeout = 15 * time.Second // Timeout for idle connections
	if err != nil {
		return err
	}
	config.DB = pg.Connect(opts)
	if config.DB == nil {
		return errors.New("Could not connect to the database")
	}
	return nil
}
