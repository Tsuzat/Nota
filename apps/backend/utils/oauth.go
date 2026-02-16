package utils

import (
	"fmt"
	"io"
	"net/http"
	"net/url"

	"github.com/Tsuzat/Nota/models"
	"github.com/goccy/go-json"
	"github.com/gofiber/fiber/v3/log"
)

// GetGoogleUserInfo of user
func GetGoogleUserInfo(token string) (*models.GoogleResponse, error) {
	reqURL, err := url.Parse("https://www.googleapis.com/oauth2/v1/userinfo")
	if err != nil {
		return nil, err
	}
	ptoken := fmt.Sprintf("Bearer %s", token)
	res := &http.Request{
		Method: "GET",
		URL:    reqURL,
		Header: map[string][]string{
			"Authorization": {ptoken},
		},
	}
	req, err := http.DefaultClient.Do(res)
	if err != nil {
		return nil, err
	}
	defer req.Body.Close()
	body, err := io.ReadAll(req.Body)
	if err != nil {
		return nil, err
	}
	log.Info("Google Res: ", string(body))
	var data models.GoogleResponse
	err = json.Unmarshal(body, &data)
	if err != nil {
		return nil, err
	}
	return &data, nil
}

// GetGithubUserInfo of user
func GetGithubUserInfo(token string) (*models.GithubResponse, error) {
	reqURL, err := url.Parse("https://api.github.com/user")
	if err != nil {
		return nil, err
	}
	ptoken := fmt.Sprintf("Bearer %s", token)
	res := &http.Request{
		Method: "GET",
		URL:    reqURL,
		Header: map[string][]string{
			"Authorization": {ptoken},
			"Accept":        {"application/vnd.github.v3+json"},
		},
	}
	req, err := http.DefaultClient.Do(res)
	if err != nil {
		return nil, err
	}
	defer req.Body.Close()
	body, err := io.ReadAll(req.Body)
	if err != nil {
		return nil, err
	}
	log.Info("Google Res: ", string(body))
	data := models.GithubResponse{}
	err = json.Unmarshal(body, &data)
	if err != nil {
		return nil, err
	}
	return &data, nil
}

// GetGithubUserEmail of user
func GetGithubUserEmail(token string) (string, error) {
	reqURL, err := url.Parse("https://api.github.com/user/emails")
	if err != nil {
		return "", err
	}
	ptoken := fmt.Sprintf("Bearer %s", token)
	res := &http.Request{
		Method: "GET",
		URL:    reqURL,
		Header: map[string][]string{
			"Authorization": {ptoken},
			"Accept":        {"application/vnd.github.v3+json"},
		},
	}
	req, err := http.DefaultClient.Do(res)
	if err != nil {
		return "", err
	}
	defer req.Body.Close()
	body, err := io.ReadAll(req.Body)
	if err != nil {
		return "", err
	}
	log.Info("Github Res: ", string(body))
	var emails []models.GithubEmail
	err = json.Unmarshal(body, &emails)
	if err != nil {
		return "", err
	}
	for _, email := range emails {
		if email.Primary && email.Verified {
			return email.Email, nil
		}
	}
	return "", fmt.Errorf("no verified primary email found")
}
