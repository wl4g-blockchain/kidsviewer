package handlers

import (
	"context"
	"kidsviewer-server/internal/models"
	"kidsviewer-server/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// SettingsHandler handles settings-related HTTP requests
type SettingsHandler struct {
	SettingsService *services.SettingsService
}

// NewSettingsHandler creates a new settings handler
func NewSettingsHandler(settingsService *services.SettingsService) *SettingsHandler {
	return &SettingsHandler{
		SettingsService: settingsService,
	}
}

// GetAppSettings handles GET /settings
func (h *SettingsHandler) GetAppSettings(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not authenticated",
		})
		return
	}

	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid user ID",
		})
		return
	}

	settings, err := h.SettingsService.GetAppSettings(context.Background(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to get app settings",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    settings,
	})
}

// UpdateAppSettings handles PUT /settings
func (h *SettingsHandler) UpdateAppSettings(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not authenticated",
		})
		return
	}

	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid user ID",
		})
		return
	}

	var updates models.AppSettings
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request data",
			"error":   err.Error(),
		})
		return
	}

	updatedSettings, err := h.SettingsService.UpdateAppSettings(context.Background(), userID, &updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to update app settings",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Settings updated successfully",
		"data":    updatedSettings,
	})
}

// GetAppInfo handles GET /settings/app-info
func (h *SettingsHandler) GetAppInfo(c *gin.Context) {
	appInfo, err := h.SettingsService.GetAppInfo(context.Background())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to get app info",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    appInfo,
	})
}
