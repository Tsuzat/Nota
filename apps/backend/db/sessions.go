package db

import (
	"time"

	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/models"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"
)

// CreateSession creates a new session in the database
func CreateSession(userId string, c fiber.Ctx) (*models.Session, error) {
	session := &models.Session{
		UserId:    userId,
		Ip:        c.IP(),
		UserAgent: c.UserAgent(),
		ExpiresAt: time.Now().Add(time.Hour * 24 * time.Duration(config.REFRESH_TOKEN_EXPIRY)),
	}
	_, err := config.DB.Model(session).Insert()
	if err != nil {
		log.Error("Error while inserting the session info", err)
		return nil, err
	}
	return session, nil
}

// GetSession retrieves a session from the database by its ID
func GetSession(id string) (*models.Session, error) {
	session := &models.Session{}
	err := config.DB.Model(session).Where("id = ?", id).First()
	if err != nil {
		return nil, err
	}
	return session, nil
}

// DeleteSession deletes a session from the database by its ID
func DeleteSession(id string) error {
	_, err := config.DB.Model(&models.Session{}).Where("id = ?", id).Delete()
	if err != nil {
		return err
	}
	return nil
}

// RevokeSession revokes a session by setting its revoke flag to true
func RevokeSession(id string) error {
	_, err := config.DB.Model(&models.Session{}).Where("id = ?", id).Update("revoke", true)
	if err != nil {
		return err
	}
	return nil
}

// RevokeAllUserSessions revokes all sessions of a user by setting their revoke flag to true
func RevokeAllUserSessions(userID string) error {
	_, err := config.DB.Model(&models.Session{}).Where("user_id = ?", userID).Update("revoke", true)
	if err != nil {
		return err
	}
	return nil
}

func VerifySession(sessionId string) bool {
	session, err := GetSession(sessionId)
	if err != nil {
		log.Error("Unable to find the session", err)
		return false
	}
	return session.ExpiresAt.After(time.Now()) && session.Revoked
}
