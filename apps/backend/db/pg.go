package db

import (
	"database/sql"
	"errors"
	"time"

	"github.com/Tsuzat/Nota/config"
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
	"github.com/uptrace/bun/driver/pgdriver"
)

func ConnectDB() error {
	if config.DB_URL == "" {
		return errors.New("DB_URL is not set")
	}

	// Using pgdriver (recommended)
	sqldb := sql.OpenDB(pgdriver.NewConnector(
		pgdriver.WithDSN(config.DB_URL),
	))
	// Configure connection pool
	sqldb.SetMaxOpenConns(100)
	sqldb.SetMaxIdleConns(10)
	sqldb.SetConnMaxLifetime(5 * time.Minute)
	sqldb.SetConnMaxIdleTime(5 * time.Minute)
	config.DB = bun.NewDB(sqldb, pgdialect.New())
	if config.DB == nil {
		return errors.New("Could not connect to the database")
	}
	return nil
}
