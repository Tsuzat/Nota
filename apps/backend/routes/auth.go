package routes

import (
	"time"
	"github.com/Tsuzat/Nota/app"
	"github.com/Tsuzat/Nota/config"
	"github.com/gofiber/fiber/v3/middleware/limiter"
)

func InitAuthRouter() {
	group := config.APP.Group("/api/v1/auth", limiter.New(limiter.Config{
		Max:        20,
		Expiration: 1 * time.Minute,
	}))

	group.Post("/signup-email", app.SignUpWithEmailAndPassword)
	group.Post("/signin-email", app.SignInWithEmailAndPassword)
	group.Get("/signout", app.SignOut)
	group.Get("/signin/:provider", app.SignInOAuth)
	group.Get("/oauth/google", app.SignInWithGoogle)
	group.Get("/callback/google", app.SingInWithGoogleCallBack)
	group.Get("/oauth/github", app.SignInWithGithub)
	group.Get("/callback/github", app.SignInWithGithubCallBack)
	group.Post("/refreshtoken", app.RefreshAccessToken)
	group.Post("/exchange", app.ExchangeCodeForTokens)
}
