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
	group.Get("/signin/:provider", app.SignInOAuth)
	group.Get("/oauth/google", app.SignInWithGoogle)
	group.Get("/callback/google", app.SingInWithGoogleCallBack)
	group.Get("/oauth/github", app.SignInWithGithub)
	group.Get("/callback/github", app.SignInWithGithubCallBack)
	group.Post("/refreshtoken", app.RefreshAccessToken)
}
