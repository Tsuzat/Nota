package main

import (
	"github.com/goccy/go-json"

	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/db"
	"github.com/Tsuzat/Nota/routes"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"
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
	if err := godotenv.Load(); err != nil {
		log.Error("Error loading .env file")
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

	config.APP = fiber.New(fiber.Config{
		JSONEncoder:     json.Marshal,
		JSONDecoder:     json.Unmarshal,
		StructValidator: &structValidator{validate: validator.New()},
	})
	if config.APP == nil {
		log.Error("Error creating the app")
		return
	}
	routes.RoutesInit()

	config.APP.Listen("localhost:3000", fiber.ListenConfig{EnablePrefork: true})
}
