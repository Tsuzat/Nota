package middleware

import (
	"strings"

	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/db"
	"github.com/Tsuzat/Nota/models"
	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
)

func Authenticate(c fiber.Ctx) error {
	var access_token string
	// Find the token in cookies
	access_token = c.Cookies("access_token")
	// if Cookies is not found, find the token in headers
	if access_token == "" {
		access_token = strings.Split(string(c.Request().Header.Peek("Authorization")), "Bearer ")[0]
	}
	// if token is not found, return 403
	if access_token == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status: fiber.StatusUnauthorized,
			Error:  "No Access Token Provided in Request",
		})
	}
	// decode the token
	token, err := jwt.Parse(access_token, func(token *jwt.Token) (any, error) {
		return []byte(config.ACCESS_TOKEN_SECRET), nil
	})
	// If there is an error, return 401
	if err != nil && err != jwt.ErrTokenExpired {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status: fiber.StatusUnauthorized,
			Error:  "Error while parsing the access token. Please relogin or refresh your access token",
		})
	}
	if err == jwt.ErrTokenExpired {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status: fiber.StatusUnauthorized,
			Error:  "Access token has expired. Please refresh your access token",
		})
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status: fiber.StatusUnauthorized,
			Error:  "Error while parsing the access token",
		})
	}
	// Get the user from the database and attach it to the context so that we can use it in the route
	id, sessionId := claims["id"].(string), claims["session_id"].(string)
	if db.VerifySession(sessionId) {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status: fiber.StatusUnauthorized,
			Error:  "Invalid token, Session revoked",
		})
	}
	user, err := db.GetUserById(id)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status: fiber.StatusUnauthorized,
			Error:  "Invalid token, User not found",
		})
	} else if !user.IsVerified {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status: fiber.StatusUnauthorized,
			Error:  "Unauthorized access, User not verified",
		})
	}
	// Attach the user to the context
	c.Locals("user", user)
	return c.Next()
}
