package app

import (
	"fmt"
	"slices"
	"strings"
	"time"

	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/db"
	"github.com/Tsuzat/Nota/models"
	"github.com/Tsuzat/Nota/utils"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
	"golang.org/x/oauth2/google"
)

var AvailableOAuthProviders = []string{"google", "github"}

func getGoogleAuthConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     config.GOOGLE_CLIENT_ID,
		ClientSecret: config.GOOGLE_CLIENT_SECRET,
		RedirectURL:  fmt.Sprintf("%s/api/v1/auth/callback/google", config.BACKEND_URL),
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		Endpoint: google.Endpoint,
	}
}

func getGithubAuthConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     config.GITHUB_CLIENT_ID,
		ClientSecret: config.GITHUB_CLIENT_SECRET,
		RedirectURL:  fmt.Sprintf("%s/api/v1/auth/callback/github", config.BACKEND_URL),
		Scopes:       []string{"user:email"},
		Endpoint:     github.Endpoint,
	}
}

func SignUpWithEmailAndPassword(c fiber.Ctx) error {
	req := new(models.SignUpWithEmailAndPasswordRequest)
	if err := c.Bind().Body(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status: fiber.StatusBadRequest,
			Error:  err.Error(),
		})
	}
	if _, err := db.GetUserByEmail(req.Email); err == nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status: fiber.StatusBadRequest,
			Error:  "Email already exists. Please try with a different email.",
		})
	}
	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Error("Password hashing error:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Failed to hash your password. Please try again.",
		})
	}
	req.Password = string(hashedPassword)
	// insert the user in DB
	if err := db.InsertUser(&models.User{
		Name:     req.Name,
		Email:    req.Email,
		Password: req.Password,
		Provider: "email",
	}); err != nil {
		log.Error("User creation error:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Failed to create your account. Please try again.",
		})
	}
	return c.Status(fiber.StatusCreated).JSON(models.APIResponse{
		Status:  fiber.StatusCreated,
		Message: "User created successfully.",
	})
}

func SignInWithEmailAndPassword(c fiber.Ctx) error {
	req := new(models.SignInWithEmailAndPasswordRequest)
	if err := c.Bind().Body(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status: fiber.StatusBadRequest,
			Error:  err.Error(),
		})
	}
	// Check if the user exists
	user, err := db.GetUserByEmail(req.Email)
	if err != nil && err.Error() != "sql: no rows in result set" {
		log.Error("User retrieval error:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Something went wrong when retrieving user. Please try again.",
			Data:   err,
		})
	} else if user == nil {
		log.Error("User not found with email:", req.Email)
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status: fiber.StatusNotFound,
			Error:  "User not found with email",
		})
	} else if user.IsVerified == false {
		log.Error("User not verified with email:", req.Email)
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status: fiber.StatusUnauthorized,
			Error:  "User not verified with email. Please verify your email or register again.",
		})
	} else if bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)) != nil {
		log.Error("Password comparison error for user:", req.Email)
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status: fiber.StatusUnauthorized,
			Error:  "Password is incorrect",
		})
	}
	sessionId, err := db.CreateSession(user.Id, c)
	if err != nil {
		log.Error("Error while creating session for user: ", user.Id)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Failed to create session. Please try again.",
		})
	}
	log.Info(fmt.Sprintf("Created new session for user: %s", user.Id), sessionId)

	// get the access_token and refresh_token
	accessToken, err := user.GenerateAccessToken(sessionId)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Failed to generate access token. Please try again.",
		})
	}
	refreshToken, err := user.GenerateRefreshToken(sessionId)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Failed to generate refresh token. Please try again.",
		})
	}
	// Setup Cookies
	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		Expires:  time.Now().Add(time.Minute * time.Duration(config.ACCESS_TOKEN_EXPIRY)),
		HTTPOnly: true,
		Secure:   true,
	})
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Expires:  time.Now().Add(time.Hour * 24 * time.Duration(config.REFRESH_TOKEN_EXPIRY)),
		HTTPOnly: true,
		Secure:   true,
	})
	return c.Status(fiber.StatusOK).JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "User signed in successfully.",
		Data:    fmt.Sprintf("User login successful with id: %s", user.Id),
	})
}

func SignInOAuth(c fiber.Ctx) error {
	provider := c.Req().Params("provider")
	if provider == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status: fiber.StatusBadRequest,
			Error:  "Provider is required",
		})
	}
	isAvailable := slices.Contains(AvailableOAuthProviders, provider)
	if !isAvailable {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status: fiber.StatusBadRequest,
			Error:  fmt.Sprintf("Provider %s is not available", provider),
		})
	}
	// redirect to oauth login page
	return c.Status(fiber.StatusTemporaryRedirect).Redirect().To(fmt.Sprintf("/api/v1/auth/%s", provider))
}

func SignInWithGoogle(c fiber.Ctx) error {
	url := getGoogleAuthConfig().AuthCodeURL("state")
	log.Info("Url: ", url)
	return c.Status(fiber.StatusPermanentRedirect).Redirect().To(url)
}

func SingInWithGoogleCallBack(c fiber.Ctx) error {
	token, err := getGoogleAuthConfig().Exchange(c.RequestCtx(), c.FormValue("code"))
	if err != nil {
		log.Error("OAuth Exchange error:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Failed to exchange token with Google",
		})
	}
	gUser, err := utils.GetGoogleUserInfo(token.AccessToken)
	if err != nil || gUser == nil {
		log.Error("Error while fetch google user: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  fmt.Sprintf("Failed to get google user info: %s", err.Error()),
		})
	}
	// check if the user if present in DB
	user, err := db.GetUserByEmail(gUser.Email)
	if err == nil {
		user.Provider = "google"
		user.ProviderId = gUser.ID
		user.AvatarUrl = gUser.Picture
		user.Name = gUser.Name
		if db.UpdateUser(user) != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
				Status: fiber.StatusInternalServerError,
				Error:  "User is found in DB but unable to update the User with new OAuth information",
			})
		}
	}
	// if the user is not found
	if user == nil {
		user = &models.User{
			Name:       gUser.Name,
			ProviderId: gUser.ID,
			Email:      gUser.Email,
			AvatarUrl:  gUser.Picture,
			IsVerified: gUser.Verified,
		}
		if db.InsertUser(user) != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
				Status: fiber.StatusInternalServerError,
				Error:  "Unable to insert the User with new OAuth information",
			})
		}
	}
	sessionId, err := db.CreateSession(user.Id, c)
	if err != nil {
		c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Unable to create session",
		})
	}
	access_token, err := user.GenerateAccessToken(sessionId)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Unable to generate access token",
		})
	}
	refresh_token, err := user.GenerateRefreshToken(sessionId)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Unable to generate refresh token",
		})
	}
	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    access_token,
		Expires:  time.Now().Add(time.Minute * time.Duration(config.ACCESS_TOKEN_EXPIRY)),
		HTTPOnly: true,
		Secure:   true,
	})
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    refresh_token,
		Expires:  time.Now().Add(time.Hour * 24 * time.Duration(config.REFRESH_TOKEN_EXPIRY)),
		HTTPOnly: true,
		Secure:   true,
	})
	return c.Status(fiber.StatusOK).JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "Logged in successfully",
		// Data:    map[string]string{"access_token": access_token, "refresh_token": refresh_token},
	})
}

func SignOut(c fiber.Ctx) error {
	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    "",
		Expires:  time.Now().Add(-time.Hour),
		HTTPOnly: true,
		Secure:   true,
	})
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Expires:  time.Now().Add(-time.Hour),
		HTTPOnly: true,
		Secure:   true,
	})
	return c.Status(fiber.StatusOK).JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "Logged out successfully",
		Data:    nil,
	})
}

func SignInWithGithub(c fiber.Ctx) error {
	url := getGithubAuthConfig().AuthCodeURL("state")
	log.Info("Url: ", url)
	return c.Status(fiber.StatusPermanentRedirect).Redirect().To(url)
}

func SignInWithGithubCallBack(c fiber.Ctx) error {
	token, err := getGithubAuthConfig().Exchange(c.RequestCtx(), c.FormValue("code"))
	if err != nil {
		log.Error("OAuth Exchange error:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Failed to exchange token with Github",
		})
	}
	gitUser, err := utils.GetGithubUserInfo(token.AccessToken)
	if err != nil || gitUser == nil {
		log.Error("Error while fetch github user: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  fmt.Sprintf("Failed to get github user info: %s", err.Error()),
		})
	}

	// If email is empty, fetch it separately
	if gitUser.Email == "" {
		email, err := utils.GetGithubUserEmail(token.AccessToken)
		if err != nil {
			log.Error("Error while fetch github user email: ", err)
			return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
				Status: fiber.StatusInternalServerError,
				Error:  "Failed to get github user email",
			})
		}
		gitUser.Email = email
	}

	// check if the user if present in DB
	user, err := db.GetUserByEmail(gitUser.Email)
	if err == nil {
		user.Provider = "github"
		user.ProviderId = fmt.Sprintf("%d", gitUser.ID)
		user.AvatarUrl = gitUser.AvatarUrl
		user.Name = gitUser.Name
		if db.UpdateUser(user) != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
				Status: fiber.StatusInternalServerError,
				Error:  "User is found in DB but unable to update the User with new OAuth information",
			})
		}
	}
	// if the user is not found
	if user == nil {
		user = &models.User{
			Name:       gitUser.Name,
			ProviderId: fmt.Sprintf("%d", gitUser.ID),
			Email:      gitUser.Email,
			AvatarUrl:  gitUser.AvatarUrl,
			IsVerified: true, // Github verified email
			Provider:   "github",
		}
		if db.InsertUser(user) != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
				Status: fiber.StatusInternalServerError,
				Error:  "Unable to insert the User with new OAuth information",
			})
		}
	}
	sessionId, err := db.CreateSession(user.Id, c)
	if err != nil {
		c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Unable to create session",
		})
	}
	access_token, err := user.GenerateAccessToken(sessionId)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Unable to generate access token",
		})
	}
	refresh_token, err := user.GenerateRefreshToken(sessionId)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Unable to generate refresh token",
		})
	}
	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    access_token,
		Expires:  time.Now().Add(time.Minute * time.Duration(config.ACCESS_TOKEN_EXPIRY)),
		HTTPOnly: true,
		Secure:   true,
	})
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    refresh_token,
		Expires:  time.Now().Add(time.Hour * 24 * time.Duration(config.REFRESH_TOKEN_EXPIRY)),
		HTTPOnly: true,
		Secure:   true,
	})
	return c.Status(fiber.StatusOK).JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "Logged in successfully",
	})
}

func RefreshAccessToken(c fiber.Ctx) error {
	var refresh_token string
	// Find the token in cookies
	refresh_token = c.Cookies("refresh_token")
	// if Cookies is not found, find the token in headers
	if refresh_token == "" {
		refresh_token = strings.Split(string(c.Request().Header.Peek("Authorization")), "Bearer ")[0]
	}
	// if token is not found, return 403
	if refresh_token == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status: fiber.StatusUnauthorized,
			Error:  "No Access Token Provided in Request",
		})
	}
	// decode the token
	token, err := jwt.Parse(refresh_token, func(token *jwt.Token) (any, error) {
		return []byte(config.REFRESH_TOKEN_SECRET), nil
	})
	// If there is an error, return 401
	if err != nil && err != jwt.ErrTokenExpired {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status: fiber.StatusUnauthorized,
			Error:  "Error while parsing the access token. Please relogin or refresh your access token",
			Data:   err,
		})
	}
	if err == jwt.ErrTokenExpired {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status: fiber.StatusUnauthorized,
			Error:  "Access token has expired. Please refresh your access token",
		})
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status: fiber.StatusUnauthorized,
			Error:  "Error while parsing the access token",
		})
	}
	// Get the user from the database and attach it to the context so that we can use it in the route
	id, sessionId := claims["id"].(string), claims["session_id"].(string)
	if !db.IsValidSession(sessionId) {
		c.Cookie(&fiber.Cookie{
			Name:     "access_token",
			Value:    "",
			Expires:  time.Now().Add(-time.Hour),
			HTTPOnly: true,
			Secure:   true,
		})
		c.Cookie(&fiber.Cookie{
			Name:     "refresh_token",
			Value:    "",
			Expires:  time.Now().Add(-time.Hour),
			HTTPOnly: true,
			Secure:   true,
		})
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status: fiber.StatusUnauthorized,
			Error:  "Invalid token, Session revoked",
		})
	}
	user, err := db.GetUserById(id)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status: fiber.StatusUnauthorized,
			Error:  "Invalid token, User not found",
			Data:   err,
		})
	} else if !user.IsVerified {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status: fiber.StatusUnauthorized,
			Error:  "Unauthorized access, User not verified",
		})
	}
	access_token, err := user.GenerateAccessToken(sessionId)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status: fiber.StatusUnauthorized,
			Error:  "Error while generating access token",
			Data:   err,
		})
	}
	isDesktop := c.Query("isDesktop") == "true"
	if !isDesktop {
		c.Cookie(&fiber.Cookie{
			Name:     "access_token",
			Value:    access_token,
			Expires:  time.Now().Add(time.Minute * time.Duration(config.ACCESS_TOKEN_EXPIRY)),
			HTTPOnly: true,
			Secure:   true,
		})
	}
	var data any
	if isDesktop {
		data = access_token
	}
	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "AccessToken Generated Successfully",
		Data:    data,
	})
}
