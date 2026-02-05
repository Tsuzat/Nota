package db

import (
	"context"
	"time"

	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/models"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"
)

// CreateSession creates a new session in the database
func CreateSession(userId string, c fiber.Ctx) (string, error) {
	ctx := context.Background()
	session := &models.Session{
		UserId:    userId,
		Ip:        c.IP(),
		UserAgent: c.UserAgent(),
		ExpiresAt: time.Now().Add(time.Hour * 24 * time.Duration(config.REFRESH_TOKEN_EXPIRY)),
	}

	_, err := config.DB.NewInsert().Model(session).Exec(ctx)
	if err != nil {
		log.Error("Error while inserting the session info", err)
		return "", err
	}
	return session.Id, nil
}

// GetSession retrieves a session from the database by its ID
func GetSession(id string) (*models.Session, error) {
	ctx := context.Background()
	session := new(models.Session)
	err := config.DB.NewSelect().Model(session).Where("id = ?", id).Scan(ctx)
	if err != nil {
		return nil, err
	}
	return session, nil
}

// DeleteSession deletes a session from the database by its ID
func DeleteSession(id string) error {
	ctx := context.Background()
	session := &models.Session{Id: id}
	_, err := config.DB.NewDelete().Model(session).WherePK().Exec(ctx)
	if err != nil {
		return err
	}
	return nil
}

// DeleteAllUserSessions deletes all sessions of a user from the database
func DeleteAllUserSessions(userId string) error {
	ctx := context.Background()
	_, err := config.DB.NewDelete().Model((*models.Session)(nil)).Where("user_id = ?", userId).Exec(ctx)
	if err != nil {
		return err
	}
	return nil
}

// RevokeSession revokes a session by setting its revoke flag to true
func RevokeSession(id string) error {
	ctx := context.Background()
	session := &models.Session{Id: id}
	_, err := config.DB.NewUpdate().Model(session).WherePK().Set("revoke = true").Exec(ctx)
	if err != nil {
		return err
	}
	return nil
}

// RevokeAllUserSessions revokes all sessions of a user by setting their revoke flag to true
func RevokeAllUserSessions(userID string) error {
	ctx := context.Background()
	_, err := config.DB.NewUpdate().Model((*models.Session)(nil)).Where("user_id = ?", userID).Set("revoke = true").Exec(ctx)
	if err != nil {
		return err
	}
	return nil
}

// VerifySession verifies if a session is valid by checking its
// expiration time and revoke flag returns true if session is invalid
func VerifySession(sessionId string) bool {
	session, err := GetSession(sessionId)
	if err != nil {
		log.Error("Unable to find the session", err)
		return false
	}
	return session.ExpiresAt.After(time.Now()) || session.Revoked
}

func CheckSessionOwner(sessionId string, userId string) bool {
	session, err := GetSession(sessionId)
	if err != nil {
		log.Error("Unable to find the session", err)
		return false
	}
	return session.UserId == userId
}

// GetSessions retrieves all sessions of a user from the database
func GetSessions(userId string) ([]*models.Session, error) {
	ctx := context.Background()
	sessions := []*models.Session{}
	err := config.DB.NewSelect().Model(&sessions).Where("user_id = ?", userId).Scan(ctx)
	if err != nil {
		return nil, err
	}
	return sessions, nil
}
