package routes

import (
	"github.com/Tsuzat/Nota/app"
	"github.com/Tsuzat/Nota/config"
)

func InitAuthRouter() {
	group := config.APP.Group("/api/v1/auth")

	group.Post("/signup-email", app.SignUpWithEmailAndPassword)
	group.Post("/signin-email", app.SignInWithEmailAndPassword)
	group.Get("/signout", app.SignOut)
	group.Get("/oauth/:provider", app.SignInOAuth)
	group.Get("/oauth/google", app.SignInWithGoogle)

}
