package handlers

import (
	"context"
	"kidsviewer-server/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// WatchingHandler handles watching session HTTP requests
type WatchingHandler struct {
	WatchingService *services.WatchingService
}

// NewWatchingHandler creates a new watching handler
func NewWatchingHandler(watchingService *services.WatchingService) *WatchingHandler {
	return &WatchingHandler{
		WatchingService: watchingService,
	}
}

// StartWatching handles POST /watching/start
// @Summary Start watching session
// @Description Start a new watching session for a person
// @Tags watching
// @Accept json
// @Produce json
// @Param request body services.StartWatchingRequest true "Start watching request"
// @Success 200 {object} map[string]interface{} "Watching session started successfully"
// @Failure 400 {object} map[string]interface{} "Invalid request data"
// @Failure 404 {object} map[string]interface{} "Person not found"
// @Failure 500 {object} map[string]interface{} "Failed to start watching session"
// @Router /api/v1/watching/start [post]
func (h *WatchingHandler) StartWatching(c *gin.Context) {
	if h.WatchingService == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Watching service not initialized",
		})
		return
	}

	var req services.StartWatchingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request data",
			"error":   err.Error(),
		})
		return
	}

	response, err := h.WatchingService.StartWatching(context.Background(), &req)
	if err != nil {
		if err.Error() == "person not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Person not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to start watching session",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Watching session started successfully",
		"data":    response,
	})
}

// CheckWatching handles POST /watching/check
// @Summary Check watching session
// @Description Check the status of a watching session
// @Tags watching
// @Accept json
// @Produce json
// @Param request body services.CheckWatchingRequest true "Check watching request"
// @Success 200 {object} map[string]interface{} "Watching session status retrieved successfully"
// @Failure 400 {object} map[string]interface{} "Invalid request data"
// @Failure 500 {object} map[string]interface{} "Failed to check watching session"
// @Router /api/v1/watching/check [post]
func (h *WatchingHandler) CheckWatching(c *gin.Context) {
	if h.WatchingService == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Watching service not initialized",
		})
		return
	}

	var req services.CheckWatchingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request data",
			"error":   err.Error(),
		})
		return
	}

	response, err := h.WatchingService.CheckWatching(context.Background(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to check watching session",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    response,
	})
}

// VerifyQuestion handles POST /watching/verify
// @Summary Verify question answer
// @Description Verify the answer to a question in a watching session
// @Tags watching
// @Accept json
// @Produce json
// @Param request body services.VerifyQuestionRequest true "Question verification request"
// @Success 200 {object} map[string]interface{} "Question verification completed successfully"
// @Failure 400 {object} map[string]interface{} "Invalid request data"
// @Failure 404 {object} map[string]interface{} "Watching session not found"
// @Failure 500 {object} map[string]interface{} "Failed to verify question"
// @Router /api/v1/watching/verify [post]
func (h *WatchingHandler) VerifyQuestion(c *gin.Context) {
	if h.WatchingService == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Watching service not initialized",
		})
		return
	}

	var req services.VerifyQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request data",
			"error":   err.Error(),
		})
		return
	}

	response, err := h.WatchingService.VerifyQuestion(context.Background(), &req)
	if err != nil {
		if err.Error() == "watching session not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Watching session not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to verify question",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    response,
	})
}

// GetWatchingHistory handles GET /watching/history/:person_id
// @Summary Get watching history
// @Description Get watching history for a specific person
// @Tags watching
// @Accept json
// @Produce json
// @Param person_id path string true "Person ID"
// @Param limit query int false "Limit number of sessions (default: 50)"
// @Success 200 {object} map[string]interface{} "Watching history retrieved successfully"
// @Failure 400 {object} map[string]interface{} "Person ID is required"
// @Failure 500 {object} map[string]interface{} "Failed to get watching history"
// @Router /api/v1/watching/history/{person_id} [get]
func (h *WatchingHandler) GetWatchingHistory(c *gin.Context) {
	if h.WatchingService == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Watching service not initialized",
		})
		return
	}

	personID := c.Param("person_id")
	if personID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Person ID is required",
		})
		return
	}

	limitStr := c.DefaultQuery("limit", "50")
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 50
	}

	sessions, err := h.WatchingService.GetWatchingHistory(context.Background(), personID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to get watching history",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    sessions,
	})
}

// SkipQuestions handles POST /watching/skip
// @Summary Skip questions
// @Description Skip questions in a watching session (requires parental password)
// @Tags watching
// @Accept json
// @Produce json
// @Param request body services.SkipQuestionsRequest true "Skip questions request"
// @Success 200 {object} map[string]interface{} "Questions skipped successfully"
// @Failure 400 {object} map[string]interface{} "Invalid request data"
// @Failure 401 {object} map[string]interface{} "Unauthorized - parental password required"
// @Failure 500 {object} map[string]interface{} "Failed to skip questions"
// @Router /api/v1/watching/skip [post]
func (h *WatchingHandler) SkipQuestions(c *gin.Context) {
	if h.WatchingService == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Watching service not initialized",
		})
		return
	}

	var req services.SkipQuestionsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request data",
			"error":   err.Error(),
		})
		return
	}

	response, err := h.WatchingService.SkipQuestions(context.Background(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to skip questions",
			"error":   err.Error(),
		})
		return
	}

	if !response.Success {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": response.Message,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": response.Message,
	})
}
