package handlers

import (
	"context"
	"kidsviewer-server/internal/models"
	"kidsviewer-server/internal/services"
	"kidsviewer-server/internal/utils"
	"strconv"

	"github.com/gin-gonic/gin"
)

// AuthHandler handles authentication-related HTTP requests
type AuthHandler struct {
	AuthService *services.AuthService
}

// NewAuthHandler creates a new AuthHandler
func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{
		AuthService: authService,
	}
}

// Register handles user registration
// @Summary Register a new user
// @Description Register a new user with email and password
// @Tags authentication
// @Accept json
// @Produce json
// @Param request body models.RegisterRequest true "Registration request"
// @Success 200 {object} map[string]interface{} "Registration successful"
// @Failure 400 {object} map[string]interface{} "Invalid request data"
// @Failure 500 {object} map[string]interface{} "Registration failed"
// @Router /api/v1/auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, "Invalid request data: "+err.Error())
		return
	}

	// Convert to services.RegisterRequest
	registerReq := &services.RegisterRequest{
		Email:    req.Email,
		Password: req.Password,
		Name:     req.Username,
	}

	user, err := h.AuthService.Register(context.Background(), registerReq)
	if err != nil {
		utils.BusinessErrorResponse(c, "4001", "Registration failed: "+err.Error())
		return
	}

	utils.SuccessResponse(c, user)
}

// Login handles user login
// @Summary Login user
// @Description Login user with email and password
// @Tags authentication
// @Accept json
// @Produce json
// @Param request body models.LoginRequest true "Login request"
// @Success 200 {object} map[string]interface{} "Login successful"
// @Failure 400 {object} map[string]interface{} "Invalid request data"
// @Failure 401 {object} map[string]interface{} "Login failed"
// @Router /api/v1/auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, "Invalid request data: "+err.Error())
		return
	}

	// Convert to services.LoginRequest
	loginReq := &services.LoginRequest{
		Email:    req.Username, // Assuming username is email
		Password: req.Password,
	}

	loginResponse, err := h.AuthService.Login(context.Background(), loginReq)
	if err != nil {
		utils.UnauthorizedResponse(c, "Login failed: "+err.Error())
		return
	}

	utils.SuccessResponse(c, loginResponse)
}

// Logout handles user logout
// @Summary Logout user
// @Description Logout the current authenticated user
// @Tags authentication
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{} "Logout successful"
// @Failure 401 {object} map[string]interface{} "User not authenticated"
// @Failure 400 {object} map[string]interface{} "Invalid user ID"
// @Failure 500 {object} map[string]interface{} "Logout failed"
// @Router /api/v1/auth/logout [post]
func (h *AuthHandler) Logout(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	if userIDStr == "" {
		utils.UnauthorizedResponse(c, "User not authenticated")
		return
	}

	// Convert string to int64
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid user ID")
		return
	}

	err = h.AuthService.Logout(context.Background(), userID)
	if err != nil {
		utils.InternalServerErrorResponse(c, "Logout failed: "+err.Error())
		return
	}

	utils.SuccessResponse(c, nil)
}

// GetCurrentUser returns the current authenticated user
// @Summary Get current user
// @Description Get the current authenticated user information
// @Tags authentication
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{} "User information retrieved successfully"
// @Failure 401 {object} map[string]interface{} "User not authenticated"
// @Failure 400 {object} map[string]interface{} "Invalid user ID"
// @Failure 500 {object} map[string]interface{} "Failed to get current user"
// @Router /api/v1/auth/me [get]
func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	if userIDStr == "" {
		utils.UnauthorizedResponse(c, "User not authenticated")
		return
	}

	// Convert string to uint
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid user ID")
		return
	}

	user, err := h.AuthService.GetCurrentUser(context.Background(), userID)
	if err != nil {
		utils.InternalServerErrorResponse(c, "Failed to get current user: "+err.Error())
		return
	}

	utils.SuccessResponse(c, user)
}

// VerifyParentalPassword verifies the parental password
// @Summary Verify parental password
// @Description Verify the parental password for accessing restricted features
// @Tags authentication
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.VerifyPasswordRequest true "Password verification request"
// @Success 200 {object} map[string]interface{} "Password verification successful"
// @Failure 400 {object} map[string]interface{} "Invalid request data"
// @Failure 401 {object} map[string]interface{} "User not authenticated or invalid password"
// @Failure 500 {object} map[string]interface{} "Failed to verify password"
// @Router /api/v1/auth/verify-parental-password [post]
func (h *AuthHandler) VerifyParentalPassword(c *gin.Context) {
	var req models.VerifyPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, "Invalid request data: "+err.Error())
		return
	}

	userIDStr := c.GetString("user_id")
	if userIDStr == "" {
		utils.UnauthorizedResponse(c, "User not authenticated")
		return
	}

	// Convert string to uint
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid user ID")
		return
	}

	isValid, err := h.AuthService.VerifyParentalPassword(context.Background(), userID, req.Password)
	if err != nil {
		utils.InternalServerErrorResponse(c, "Failed to verify password: "+err.Error())
		return
	}

	if !isValid {
		utils.UnauthorizedResponse(c, "Invalid parental password")
		return
	}

	utils.SuccessResponse(c, true)
}
