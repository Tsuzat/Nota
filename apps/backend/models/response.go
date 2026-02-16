package models

type APIResponse struct {
	Status  int    `json:"status"`
	Message string `json:"message"`
	Data    any    `json:"data"`
}

type APIError struct {
	Status int    `json:"status"`
	Error  string `json:"error"`
	Data   any    `json:"data"`
}
