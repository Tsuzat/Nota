package middleware

import (
	"strings"
	"time"

	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/db"
	"github.com/Tsuzat/Nota/models"
	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
)

func AuthenticatedUser(c fiber.Ctx) (*models.User, error) {

	var access_token string
	// Find the token in cookies
	access_token = c.Cookies("access_token")
	// if Cookies is not found, find the token in headers
	if access_token == "" {
		access_token = strings.Split(string(c.Request().Header.Peek("Authorization")), "Bearer ")[1]
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
	if err != nil && err != jwt.ErrTokenExpired {
		return nil, fiber.ErrUnauthorized
	}
	if err == jwt.ErrTokenExpired {
		return nil, fiber.ErrUnauthorized
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, fiber.ErrUnauthorized
	}
	// Get the user from the database and attach it to the context so that we can use it in the route
	id, sessionId := claims["id"].(string), claims["session_id"].(string)
	if !db.IsValidSession(sessionId) {
		c.Cookie(&fiber.Cookie{
			Name:     "access_token",
			Value:    "",
			Expires:  time.Now().Add(-time.Hour),
			HTTPOnly: true,
			Secure:   true,
		})
		c.Cookie(&fiber.Cookie{
			Name:     "refresh_token",
			Value:    "",
			Expires:  time.Now().Add(-time.Hour),
			HTTPOnly: true,
			Secure:   true,
		})
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
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status: fiber.StatusUnauthorized,
			Error:  "User is not authenticated",
			Data:   err.Error(),
		})
	}
	// Attach the user to the context
	c.Locals("user", user)
	return c.Next()
}
