package routes

import (
	"github.com/Tsuzat/Nota/app"
	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/middleware"
)

func UserRouteInit() {
	group := config.APP.Group("/api/v1/user", middleware.Authenticate)
	group.Get("/me", app.Me)
}
