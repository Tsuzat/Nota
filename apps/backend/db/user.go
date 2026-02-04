package db

import (
	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/models"
	"github.com/gofiber/fiber/v3/log"
)

func GetUserByEmail(email string) (*models.User, error) {
	user := &models.User{}
	if err := config.DB.Model(user).Where("email = ?", email).First(); err != nil {
		return nil, err
	}
	return user, nil
}

func GetUserById(id string) (*models.User, error) {
	user := &models.User{}
	if err := config.DB.Model(user).Where("id = ?", id).First(); err != nil {
		return nil, err
	}
	return user, nil
}

func InsertUser(user *models.User) error {
	if _, err := config.DB.Model(user).Insert(user); err != nil {
		return err
	}
	return nil
}

func UpdateUser(user *models.User) error {
	_, err := config.DB.Model(user).Where("id = ?", user.Id).Update()
	if err != nil {
		log.Error("Error while updating the user", user, err)
		return err
	}
	log.Info("Updated User with id: ", user.Id)
	return nil
}
