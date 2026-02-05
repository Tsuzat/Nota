package main

import (
	"fmt"
	"os"
	"time"

	"github.com/goccy/go-json"

	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/db"
	"github.com/Tsuzat/Nota/routes"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/limiter"
	"github.com/gofiber/fiber/v3/middleware/logger"
	"github.com/gofiber/storage/s3/v2"
	"github.com/joho/godotenv"
)

type structValidator struct {
	validate *validator.Validate
}

func (v *structValidator) Validate(out any) error {
	return v.validate.Struct(out)
}

func main() {
	// Load the .env file
	env := os.Getenv("ENV")
	if env != "production" {
		if err := godotenv.Load(); err != nil {
			log.Error("Error loading .env file")
		}
	}

	config.ConstsInit()

	// initialize the DB
	if err := db.ConnectDB(); err != nil {
		log.Error("Error connecting to the database")
		return
	}
	defer config.DB.Close()

	// initialise the Valkey
	if err := db.ConnectValkey(); err != nil {
		log.Error("Error connecting to the valkey")
		return
	}
	defer config.VALKEY.Close()

	// initialise the R2 storage
	config.STORAGE = s3.New(s3.Config{
		Region:   "auto",
		Bucket:   config.BUCKET_NAME,
		Endpoint: fmt.Sprintf("https://%s.r2.cloudflarestorage.com", config.R2_ACCOUNT_ID),
		Credentials: s3.Credentials{
			AccessKey:       config.R2_ACCESS_ID,
			SecretAccessKey: config.R2_SECRETE_ACCESS_KEY,
		},
	})
	if config.STORAGE == nil {
		log.Error("Error initializing the R2 storage")
		return
	}
	defer config.STORAGE.Close()

	config.APP = fiber.New(fiber.Config{
		ReadBufferSize:  32768,
		JSONEncoder:     json.Marshal,
		JSONDecoder:     json.Unmarshal,
		StructValidator: &structValidator{validate: validator.New()},
	})
	// logger middleware
	config.APP.Use(logger.New(logger.Config{
		Format: "[${ip}]:${port} ${status} - ${method} ${path}\n",
	}))

	// check the origin
	config.APP.Use(cors.New(cors.Config{
		AllowOrigins: []string{"https://www.nota.ink", "https://nota.ink"},
	}))
	// use rate limiting
	config.APP.Use(limiter.New(limiter.Config{
		Max:               100,
		Expiration:        60 * time.Second,
		Storage:           config.VALKEY,
		LimiterMiddleware: limiter.SlidingWindow{},
	}))
	if config.APP == nil {
		log.Error("Error creating the app")
		return
	}
	routes.RoutesInit()

	config.APP.Listen(":3000", fiber.ListenConfig{EnablePrefork: true})
}
