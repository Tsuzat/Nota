package utils

import (
	"fmt"
	"io"
	"net/http"
	"net/url"

	"github.com/Tsuzat/Nota/models"
	"github.com/goccy/go-json"
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
	var data *models.GoogleResponse
	err = json.Unmarshal(body, data)
	if err != nil {
		return nil, err
	}
	return data, nil
}
