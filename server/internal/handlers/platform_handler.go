package handlers

import (
	"context"
	"kidsviewer-server/internal/models"
	"kidsviewer-server/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// PlatformHandler handles platform-related HTTP requests
type PlatformHandler struct {
	PlatformService *services.PlatformService
}

// NewPlatformHandler creates a new platform handler
func NewPlatformHandler(platformService *services.PlatformService) *PlatformHandler {
	return &PlatformHandler{
		PlatformService: platformService,
	}
}

// GetPlatforms handles GET /platforms
func (h *PlatformHandler) GetPlatforms(c *gin.Context) {
	if h.PlatformService == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Platform service not initialized",
		})
		return
	}

	platforms, err := h.PlatformService.GetPlatforms(context.Background())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to get platforms",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    platforms,
	})
}

// GetPlatform handles GET /platforms/:id
func (h *PlatformHandler) GetPlatform(c *gin.Context) {
	if h.PlatformService == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Platform service not initialized",
		})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid platform ID",
		})
		return
	}

	platform, err := h.PlatformService.GetPlatform(context.Background(), uint(id))
	if err != nil {
		if err.Error() == "platform not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Platform not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to get platform",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    platform,
	})
}

// CreatePlatform handles POST /platforms
func (h *PlatformHandler) CreatePlatform(c *gin.Context) {
	if h.PlatformService == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Platform service not initialized",
		})
		return
	}

	var platform models.Platform
	if err := c.ShouldBindJSON(&platform); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request data",
			"error":   err.Error(),
		})
		return
	}

	createdPlatform, err := h.PlatformService.CreatePlatform(context.Background(), &platform)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to create platform",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Platform created successfully",
		"data":    createdPlatform,
	})
}

// UpdatePlatform handles PUT /platforms/:id
func (h *PlatformHandler) UpdatePlatform(c *gin.Context) {
	if h.PlatformService == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Platform service not initialized",
		})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid platform ID",
		})
		return
	}

	var updates models.Platform
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request data",
			"error":   err.Error(),
		})
		return
	}

	updatedPlatform, err := h.PlatformService.UpdatePlatform(context.Background(), uint(id), &updates)
	if err != nil {
		if err.Error() == "platform not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Platform not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to update platform",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Platform updated successfully",
		"data":    updatedPlatform,
	})
}

// DeletePlatform handles DELETE /platforms/:id
func (h *PlatformHandler) DeletePlatform(c *gin.Context) {
	if h.PlatformService == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Platform service not initialized",
		})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid platform ID",
		})
		return
	}

	err = h.PlatformService.DeletePlatform(context.Background(), uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to delete platform",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Platform deleted successfully",
	})
}
