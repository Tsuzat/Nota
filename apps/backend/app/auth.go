package app

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"errors"
	"fmt"
	"regexp"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"

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
var base64UrlRegex = regexp.MustCompile(`^[a-zA-Z0-9\-\_]{43,128}$`)

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
			Error:  "Invalid request body",
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
	newUser := &models.User{
		Name:     req.Name,
		Email:    req.Email,
		Password: req.Password,
		Provider: "email",
	}
	if err := db.InsertUser(newUser); err != nil {
		log.Error("User creation error:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Failed to create your account. Please try again.",
		})
	}
	OnUserCreate(c.Context(), newUser)

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
			Error:  "Invalid request body",
		})
	}
	// Check if the user exists
	user, err := db.GetUserByEmail(req.Email)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		log.Error("User retrieval error:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Something went wrong when retrieving user. Please try again.",
		})
	} else if user == nil || bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)) != nil {
		log.Error("Invalid authentication attempt for email:", req.Email)
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status: fiber.StatusUnauthorized,
			Error:  "Invalid email or password",
		})
	} else if !user.IsVerified {
		log.Error("User not verified with email:", req.Email)
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status: fiber.StatusUnauthorized,
			Error:  "User not verified with email. Please verify your email or register again.",
		})
	}

	isDesktop := c.Locals("isDesktop").(bool)
	sessionId, err := db.CreateSession(user.Id, c, isDesktop)
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
	if isDesktop {
		return c.JSON(models.APIResponse{
			Status:  fiber.StatusOK,
			Message: "Signed In Successfully",
			Data: fiber.Map{
				"access_token":  accessToken,
				"refresh_token": refreshToken,
			},
		})
	}
	// Setup Cookies
	c.Cookie(config.GetCookieOptions("access_token", accessToken, time.Now().Add(config.AccessTokenDuration)))
	c.Cookie(config.GetCookieOptions("refresh_token", refreshToken, time.Now().Add(config.RefreshTokenDuration)))
	return c.Status(fiber.StatusOK).JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "User signed in successfully.",
		Data:    fmt.Sprintf("User login successful with id: %s", user.Id),
	})
}

func SignInOAuth(c fiber.Ctx) error {
	provider := c.Req().Params("provider")
	codeChallenge := c.Req().Query("code_challenge")
	isDesktop := c.Locals("isDesktop").(bool) || c.Req().Query("isdesktop") == "true"
	isProd := config.IsProduction()

	if codeChallenge != "" {
		if !base64UrlRegex.MatchString(codeChallenge) {
			return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
				Status: fiber.StatusBadRequest,
				Error:  "Invalid code_challenge format",
			})
		}
		c.Cookie(&fiber.Cookie{
			Name:     "code_challenge",
			Value:    codeChallenge,
			MaxAge:   60 * 5,
			HTTPOnly: true,
			Secure:   isProd,
			SameSite: "Lax",
		})
	}

	if isDesktop {
		c.Cookie(&fiber.Cookie{
			Name:     "auth_platform",
			Value:    "desktop",
			MaxAge:   60 * 5,
			HTTPOnly: true,
			Secure:   isProd,
			SameSite: "Lax",
		})
	} else {
		// Clear any stale desktop cookies from a previous login
		c.Cookie(&fiber.Cookie{Name: "auth_platform", Value: "", MaxAge: -1, HTTPOnly: true, Secure: isProd, SameSite: "Lax"})
		c.Cookie(&fiber.Cookie{Name: "code_challenge", Value: "", MaxAge: -1, HTTPOnly: true, Secure: isProd, SameSite: "Lax"})
	}

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
	return c.Status(fiber.StatusTemporaryRedirect).Redirect().To(fmt.Sprintf("%s/api/v1/auth/oauth/%s", config.BACKEND_URL, provider))
}

func SignInWithGoogle(c fiber.Ctx) error {
	state := uuid.New().String()
	utils.SetCache("oauth_state:"+state, true, time.Minute*5)
	url := getGoogleAuthConfig().AuthCodeURL(state)
	return c.Status(fiber.StatusPermanentRedirect).Redirect().To(url)
}

func completeOAuthLogin(c fiber.Ctx, user *models.User) error {
	existingUser, _ := db.GetUserByEmail(user.Email)
	isNewUser := existingUser == nil

	// UPSERT user into DB
	_, err := config.DB.NewInsert().
		Model(user).
		On("CONFLICT (email) DO UPDATE").
		Set("name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url, provider = EXCLUDED.provider, provider_id = EXCLUDED.provider_id").
		Returning("id").
		Exec(c.Context())
	if err != nil {
		log.Error("Error while updating user: ", err)
		return c.Status(fiber.ErrInternalServerError.Code).JSON(models.APIError{
			Status: fiber.ErrInternalServerError.Code,
			Error:  "Something went wrong when updating user",
		})
	}

	if isNewUser {
		OnUserCreate(c.Context(), user)
	}

	platform := string(c.Request().Header.Cookie("auth_platform"))
	codeChallenge := string(c.Request().Header.Cookie("code_challenge"))
	isDesktop := platform == "desktop"

	// Clear one-time-use cookies immediately after reading
	secureCookie := config.IsProduction()
	c.Cookie(&fiber.Cookie{Name: "auth_platform", Value: "", MaxAge: -1, HTTPOnly: true, Secure: secureCookie, SameSite: "Lax"})
	c.Cookie(&fiber.Cookie{Name: "code_challenge", Value: "", MaxAge: -1, HTTPOnly: true, Secure: secureCookie, SameSite: "Lax"})

	if isDesktop {
		sessionId, err := db.GetPKCESessionToken(user.Id, codeChallenge, c, true)
		if err != nil {
			log.Error("Unable to create desktop session: ", err)
			return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
				Status: fiber.StatusInternalServerError,
				Error:  "Unable to create session",
			})
		}
		return c.Redirect().Status(fiber.StatusPermanentRedirect).To(fmt.Sprintf("nota://auth/callback?code=%s", sessionId))
	}

	sessionId, err := db.CreateSession(user.Id, c, false)
	if err != nil {
		log.Error("Error while creating session: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Unable to create session",
		})
	}
	accessToken, err := user.GenerateAccessToken(sessionId)
	if err != nil {
		log.Error("Error while generating access token: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Unable to generate access token",
		})
	}
	refreshToken, err := user.GenerateRefreshToken(sessionId)
	if err != nil {
		log.Error("Error while generating refresh token: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Unable to generate refresh token",
		})
	}
	c.Cookie(config.GetCookieOptions("access_token", accessToken, time.Now().Add(config.AccessTokenDuration)))
	c.Cookie(config.GetCookieOptions("refresh_token", refreshToken, time.Now().Add(config.RefreshTokenDuration)))
	return c.Status(fiber.StatusPermanentRedirect).Redirect().To(config.FRONTEND_URL)
}

func SingInWithGoogleCallBack(c fiber.Ctx) error {
	state := c.FormValue("state")
	var valid bool
	if err := utils.GetCache("oauth_state:"+state, &valid); err != nil || !valid {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status: fiber.StatusUnauthorized,
			Error:  "Invalid or expired OAuth state",
		})
	}
	defer utils.DeleteCache("oauth_state:" + state)

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
			Error:  "Failed to get google user info",
		})
	}

	user := &models.User{
		Name:            gUser.Name,
		Email:           gUser.Email,
		Provider:        "google",
		AvatarUrl:       gUser.Picture,
		ProviderId:      gUser.ID,
		IsVerified:      true,
		EmailVerified:   true,
		EmailVerifiedAt: time.Now(),
	}
	return completeOAuthLogin(c, user)
}

func SignOut(c fiber.Ctx) error {
	var accessToken string

	accessToken = c.Cookies("access_token")
	if accessToken == "" {
		authHeader := strings.Split(string(c.Request().Header.Peek("Authorization")), "Bearer ")
		if len(authHeader) == 2 {
			accessToken = authHeader[1]
		}
	}

	var sessionId *string
	if accessToken != "" {
		token, err := jwt.Parse(accessToken, func(token *jwt.Token) (any, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(config.ACCESS_TOKEN_SECRET), nil
		})
		// Extract claims even if the token has expired
		if err == nil || errors.Is(err, jwt.ErrTokenExpired) {
			if token != nil {
				if claims, ok := token.Claims.(jwt.MapClaims); ok {
					if sid, ok := claims["session_id"].(string); ok && sid != "" {
						sessionId = &sid
					}
				}
			}
		}
	}

	c.Cookie(config.GetCookieOptions("access_token", "", time.Now().Add(-time.Hour)))
	c.Cookie(config.GetCookieOptions("refresh_token", "", time.Now().Add(-time.Hour)))

	if sessionId != nil {
		utils.DeleteCache("session:" + *sessionId)
		go func(sid string) {
			if _, err := config.DB.NewDelete().
				Model(&models.Session{}).
				Where("id = ?", sid).
				Exec(context.Background()); err != nil {
				log.Error("Failed to delete session in SignOut:", err)
			}
		}(*sessionId)
	}

	return c.Status(fiber.StatusOK).JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "Logged out successfully",
		Data:    nil,
	})
}

func SignInWithGithub(c fiber.Ctx) error {
	state := uuid.New().String()
	utils.SetCache("oauth_state:"+state, true, time.Minute*5)
	url := getGithubAuthConfig().AuthCodeURL(state)
	return c.Status(fiber.StatusPermanentRedirect).Redirect().To(url)
}

func SignInWithGithubCallBack(c fiber.Ctx) error {
	state := c.FormValue("state")
	var valid bool
	if err := utils.GetCache("oauth_state:"+state, &valid); err != nil || !valid {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status: fiber.StatusUnauthorized,
			Error:  "Invalid or expired OAuth state",
		})
	}
	defer utils.DeleteCache("oauth_state:" + state)

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
			Error:  "Failed to get github user info",
		})
	}
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

	user := &models.User{
		Name:            gitUser.Name,
		Email:           gitUser.Email,
		Provider:        "github",
		AvatarUrl:       gitUser.AvatarUrl,
		ProviderId:      strconv.Itoa(gitUser.ID),
		IsVerified:      true,
		EmailVerified:   true,
		EmailVerifiedAt: time.Now(),
	}
	return completeOAuthLogin(c, user)
}

func RefreshAccessToken(c fiber.Ctx) error {
	var refresh_token string
	refresh_token = c.Cookies("refresh_token")
	if refresh_token == "" {
		authHeader := strings.Split(string(c.Request().Header.Peek("Authorization")), "Bearer ")
		if len(authHeader) == 2 {
			refresh_token = authHeader[1]
		}
	}
	if refresh_token == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status: fiber.StatusUnauthorized,
			Error:  "No Refresh Token Provided in Request",
		})
	}
	token, err := jwt.Parse(refresh_token, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(config.REFRESH_TOKEN_SECRET), nil
	})
	if err != nil && !errors.Is(err, jwt.ErrTokenExpired) {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status: fiber.StatusUnauthorized,
			Error:  "Error while parsing the access token. Please relogin or refresh your access token",
		})
	}
	if errors.Is(err, jwt.ErrTokenExpired) {
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

	id, ok1 := claims["id"].(string)
	sessionId, ok2 := claims["session_id"].(string)
	if !ok1 || !ok2 {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status: fiber.StatusUnauthorized,
			Error:  "Invalid token claims",
		})
	}

	if !db.IsValidSession(sessionId) {
		c.Cookie(config.GetCookieOptions("access_token", "", time.Now().Add(-time.Hour)))
		c.Cookie(config.GetCookieOptions("refresh_token", "", time.Now().Add(-time.Hour)))
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
		})
	}
	isDesktop := c.Locals("isDesktop").(bool)
	if !isDesktop {
		c.Cookie(config.GetCookieOptions("access_token", access_token, time.Now().Add(config.AccessTokenDuration)))
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

func ExchangeCodeForTokens(c fiber.Ctx) error {
	type ExchangeRequest struct {
		Code         string `json:"code" validator:"required"`
		CodeVerifier string `json:"code_verifier" validator:"required"`
	}

	req := new(ExchangeRequest)
	if err := c.Bind().Body(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status: fiber.StatusBadRequest,
			Error:  "Invalid request body",
		})
	}

	if req.Code == "" || req.CodeVerifier == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status: fiber.StatusBadRequest,
			Error:  "Code and Code Verifier are required",
		})
	}

	// Find session by ID (which is the code)
	session, err := db.GetSession(req.Code)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status: fiber.StatusBadRequest,
			Error:  "Invalid or expired code",
		})
	}

	if session.ExpiresAt.Before(time.Now()) {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status: fiber.StatusBadRequest,
			Error:  "Invalid or expired code",
		})
	}

	// Verify code challenge
	sha256Hash := sha256.Sum256([]byte(req.CodeVerifier))
	challenge := base64.RawURLEncoding.EncodeToString(sha256Hash[:])

	if session.PkceChallenge == "" || session.PkceChallenge != challenge {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status: fiber.StatusBadRequest,
			Error:  "Invalid code verifier",
		})
	}

	// Invalidate PKCE challenge immediately after verification to prevent code reuse
	_, _ = config.DB.NewUpdate().
		Model((*models.Session)(nil)).
		Set("pkce_challenge = NULL").
		Where("id = ?", session.Id).
		Exec(c.Context())

	user, err := db.GetUserById(session.UserId)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status: fiber.StatusUnauthorized,
			Error:  "User not found",
		})
	}

	accessToken, err := user.GenerateAccessToken(session.Id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Failed to generate access token",
		})
	}

	refreshToken, err := user.GenerateRefreshToken(session.Id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Failed to generate refresh token",
		})
	}

	return c.JSON(fiber.Map{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
	})
}
