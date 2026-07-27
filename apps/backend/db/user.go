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

func GetUserById(id string) (*models.User, error) {
	ctx := context.Background()
	user := &models.User{Id: id}
	if err := config.DB.NewSelect().Model(user).WherePK().Scan(ctx); err != nil {
		return nil, err
	}
	return user, nil
}

func InsertUser(user *models.User) error {
	ctx := context.Background()
	_, err := config.DB.NewInsert().Model(user).Exec(ctx)
	return err
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

func CreateDefaultWorkspace(userId string, name string) error {
	if userId == "" {
		return nil
	}
	ctx := context.Background()
	exists, err := config.DB.NewSelect().Model((*models.Workspace)(nil)).Where("owner = ?", userId).Exists(ctx)
	if err == nil && !exists {
		if name == "" {
			name = "Cloud Workspace"
		}
		workspace := &models.Workspace{
			Name:        name,
			Icon:        "emoji:📁",
			Description: "Your default workspace",
			Owner:       userId,
		}
		_, err = config.DB.NewInsert().Model(workspace).Exec(ctx)
		return err
	}
	return err
}
