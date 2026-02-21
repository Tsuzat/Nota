package middleware

import (
	"strings"
	"time"

	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/db"
	"github.com/Tsuzat/Nota/models"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"
	"github.com/golang-jwt/jwt/v5"
)

func AuthenticatedUser(c fiber.Ctx) (*models.User, error) {

	var access_token string
	// Find the token in cookies
	access_token = c.Cookies("access_token")
	// if Cookies is not found, find the token in headers
	if access_token == "" {
		authHeader := strings.Split(string(c.Request().Header.Peek("Authorization")), "Bearer ")
		if len(authHeader) == 2 {
			access_token = authHeader[1]
		}
	}
	// if token is not found, return 403
	if access_token == "" {
		return nil, fiber.ErrUnauthorized
	}
	// decode the token
	token, err := jwt.Parse(access_token, func(token *jwt.Token) (any, error) {
		return []byte(config.ACCESS_TOKEN_SECRET), nil
	})
	// If there is an error, return 401
	if err != nil {
		log.Error("Error on parsing JWT: ", err)
		if strings.Contains(err.Error(), jwt.ErrTokenExpired.Error()) {
			return nil, fiber.ErrForbidden
		}
		return nil, fiber.ErrUnauthorized
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, fiber.ErrUnauthorized
	}
	// Get the user from the database and attach it to the context so that we can use it in the route
	id, sessionId := claims["id"].(string), claims["session_id"].(string)
	if !db.IsValidSession(sessionId) {
		c.Cookie(config.GetCookieOptions("access_token", "", time.Now().Add(-time.Hour)))
		c.Cookie(config.GetCookieOptions("refresh_token", "", time.Now().Add(-time.Hour)))
		return nil, fiber.ErrUnauthorized
	}
	user, err := db.GetUserById(id)
	if err != nil {
		return nil, err
	} else if !user.IsVerified {
		return nil, fiber.ErrUnauthorized
	}
	return user, nil
}

func Authenticate(c fiber.Ctx) error {
	user, err := AuthenticatedUser(c)
	if err != nil {
		log.Error("JWT Error: ", err)
		statusCode := fiber.StatusUnauthorized
		errorMessage := "User is not authenticated"
		if err == fiber.ErrForbidden {
			statusCode = fiber.StatusForbidden
			errorMessage = "Token is expired"
		}
		return c.Status(statusCode).JSON(models.APIError{
			Status: statusCode,
			Error:  errorMessage,
			Data:   err.Error(),
		})
	}
	// Attach the user to the context
	c.Locals("user", user)
	return c.Next()
}
