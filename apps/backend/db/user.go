package db

import (
	"context"

	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/models"
	"github.com/gofiber/fiber/v3/log"
)

func GetUserByEmail(email string) (*models.User, error) {
	ctx := context.Background()
	user := new(models.User)
	if err := config.DB.NewSelect().Model(user).Where("email = ?", email).Scan(ctx); err != nil {
		return nil, err
	}
	return user, nil
}

func InsertOrUpdateUser(user *models.User) error {
	ctx := context.Background()
	if _, err := config.DB.NewInsert().Model(user).On("CONFLICT (email) DO UPDATE").Set("name = ?, avatar_url = ?, provider = ?, provider_id = ?", user.Name, user.AvatarUrl, user.Provider, user.ProviderId).Exec(ctx); err != nil {
		return err
	}
	return nil
}

func GetUserById(id string) (*models.User, error) {
	ctx := context.Background()
	user := new(models.User)
	if err := config.DB.NewSelect().Model(user).Where("id = ?", id).Scan(ctx); err != nil {
		return nil, err
	}
	return user, nil
}

func InsertUser(user *models.User) error {
	ctx := context.Background()
	if _, err := config.DB.NewInsert().Model(user).Exec(ctx); err != nil {
		return err
	}
	return nil
}

func UpdateUser(user *models.User) error {
	ctx := context.Background()
	_, err := config.DB.NewUpdate().Model(user).WherePK().Exec(ctx)
	if err != nil {
		log.Error("Error while updating the user", user, err)
		return err
	}
	log.Info("Updated User with id: ", user.Id)
	return nil
}
