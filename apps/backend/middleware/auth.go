package middleware

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/db"
	"github.com/Tsuzat/Nota/models"
	"github.com/Tsuzat/Nota/utils"
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
	// if token is not found, return 401
	if access_token == "" {
		return nil, fiber.ErrUnauthorized
	}

	// decode the token
	token, err := jwt.Parse(access_token, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
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

	id, ok1 := claims["id"].(string)
	sessionId, ok2 := claims["session_id"].(string)
	if !ok1 || !ok2 || id == "" || sessionId == "" {
		return nil, fiber.ErrUnauthorized
	}

	var session models.Session
	var validSession bool
	if err := utils.GetCache("session:"+sessionId, &session); err == nil {
		validSession = !session.Revoked && session.ExpiresAt.After(time.Now())
	} else {
		dbSession, err := db.GetSession(sessionId)
		if err == nil && dbSession != nil {
			validSession = !dbSession.Revoked && dbSession.ExpiresAt.After(time.Now())
			if validSession {
				session = *dbSession
				go utils.SetCache("session:"+sessionId, dbSession, 5*time.Minute)
			}
		}
	}

	if !validSession {
		// Clear cookies
		c.Cookie(config.GetCookieOptions("access_token", "", time.Now().Add(-time.Hour)))
		c.Cookie(config.GetCookieOptions("refresh_token", "", time.Now().Add(-time.Hour)))

		// Clean up invalid/expired session from cache & DB
		utils.DeleteCache("session:" + sessionId)
		go func(sid string) {
			if _, err := config.DB.NewDelete().
				Model((*models.Session)(nil)).
				Where("id = ?", sid).
				Exec(context.Background()); err != nil {
				log.Error("Failed to delete invalid session in middleware:", err)
			}
		}(sessionId)

		return nil, fiber.ErrUnauthorized
	}

	user := new(models.User)
	if err := utils.GetCache("user:"+id, user); err != nil {
		user, err = db.GetUserById(id)
		if err != nil {
			return nil, err
		}
		go utils.SetCache("user:"+id, user, 5*time.Minute)
	}

	if !user.IsVerified {
		return nil, fiber.ErrUnauthorized
	}
	c.Locals("session", &session)
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
		})
	}
	// Attach the user to the context
	c.Locals("user", user)
	return c.Next()
}
