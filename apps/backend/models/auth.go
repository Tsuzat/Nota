package models

type SignUpWithEmailAndPasswordRequest struct {
	Name     string `json:"name" validate:"required,min=1,max=255"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,max=255"`
}

type SignInWithEmailAndPasswordRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,max=255"`
}
