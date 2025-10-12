package handlers

import (
	"context"
	"kidsviewer-server/internal/models"
	"kidsviewer-server/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// QuestionHandler handles question-related HTTP requests
type QuestionHandler struct {
	QuestionService *services.QuestionService
}

// NewQuestionHandler creates a new question handler
func NewQuestionHandler(questionService *services.QuestionService) *QuestionHandler {
	return &QuestionHandler{
		QuestionService: questionService,
	}
}

// GetQuestions handles GET /questions
// @Summary Get questions
// @Description Get questions with optional filtering by subject, difficulty, age group, and limit
// @Tags questions
// @Accept json
// @Produce json
// @Param subject query string false "Subject filter"
// @Param difficulty query string false "Difficulty filter"
// @Param age_group query string false "Age group filter"
// @Param limit query int false "Limit number of questions (default: 0 for all)"
// @Success 200 {object} map[string]interface{} "Questions retrieved successfully"
// @Failure 500 {object} map[string]interface{} "Failed to get questions"
// @Router /api/v1/questions [get]
func (h *QuestionHandler) GetQuestions(c *gin.Context) {
	if h.QuestionService == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Question service not initialized",
		})
		return
	}

	subject := c.Query("subject")
	difficulty := c.Query("difficulty")
	ageGroup := c.Query("age_group")

	limitStr := c.DefaultQuery("limit", "0")
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 0
	}

	questions, err := h.QuestionService.GetQuestions(context.Background(), subject, difficulty, ageGroup, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to get questions",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    questions,
	})
}

// GetQuestion handles GET /questions/:id
// @Summary Get question by ID
// @Description Get a specific question by ID
// @Tags questions
// @Accept json
// @Produce json
// @Param id path int true "Question ID"
// @Success 200 {object} map[string]interface{} "Question retrieved successfully"
// @Failure 400 {object} map[string]interface{} "Invalid question ID"
// @Failure 404 {object} map[string]interface{} "Question not found"
// @Failure 500 {object} map[string]interface{} "Failed to get question"
// @Router /api/v1/questions/{id} [get]
func (h *QuestionHandler) GetQuestion(c *gin.Context) {
	if h.QuestionService == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Question service not initialized",
		})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid question ID",
		})
		return
	}

	question, err := h.QuestionService.GetQuestion(context.Background(), uint(id))
	if err != nil {
		if err.Error() == "question not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Question not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to get question",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    question,
	})
}

// CreateQuestion handles POST /questions
// @Summary Create question
// @Description Create a new question template
// @Tags questions
// @Accept json
// @Produce json
// @Param request body models.QuestionTemplate true "Question creation request"
// @Success 201 {object} map[string]interface{} "Question created successfully"
// @Failure 400 {object} map[string]interface{} "Invalid request data"
// @Failure 500 {object} map[string]interface{} "Failed to create question"
// @Router /api/v1/questions [post]
func (h *QuestionHandler) CreateQuestion(c *gin.Context) {
	if h.QuestionService == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Question service not initialized",
		})
		return
	}

	var question models.QuestionTemplate
	if err := c.ShouldBindJSON(&question); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request data",
			"error":   err.Error(),
		})
		return
	}

	createdQuestion, err := h.QuestionService.CreateQuestion(context.Background(), &question)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to create question",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Question created successfully",
		"data":    createdQuestion,
	})
}

// UpdateQuestion handles PUT /questions/:id
// @Summary Update question
// @Description Update an existing question template
// @Tags questions
// @Accept json
// @Produce json
// @Param id path int true "Question ID"
// @Param request body models.QuestionTemplate true "Question update request"
// @Success 200 {object} map[string]interface{} "Question updated successfully"
// @Failure 400 {object} map[string]interface{} "Invalid request data or question ID"
// @Failure 404 {object} map[string]interface{} "Question not found"
// @Failure 500 {object} map[string]interface{} "Failed to update question"
// @Router /api/v1/questions/{id} [put]
func (h *QuestionHandler) UpdateQuestion(c *gin.Context) {
	if h.QuestionService == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Question service not initialized",
		})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid question ID",
		})
		return
	}

	var updates models.QuestionTemplate
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request data",
			"error":   err.Error(),
		})
		return
	}

	updatedQuestion, err := h.QuestionService.UpdateQuestion(context.Background(), uint(id), &updates)
	if err != nil {
		if err.Error() == "question not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Question not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to update question",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Question updated successfully",
		"data":    updatedQuestion,
	})
}

// DeleteQuestion handles DELETE /questions/:id
// @Summary Delete question
// @Description Delete an existing question template
// @Tags questions
// @Accept json
// @Produce json
// @Param id path int true "Question ID"
// @Success 200 {object} map[string]interface{} "Question deleted successfully"
// @Failure 400 {object} map[string]interface{} "Invalid question ID"
// @Failure 500 {object} map[string]interface{} "Failed to delete question"
// @Router /api/v1/questions/{id} [delete]
func (h *QuestionHandler) DeleteQuestion(c *gin.Context) {
	if h.QuestionService == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Question service not initialized",
		})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid question ID",
		})
		return
	}

	err = h.QuestionService.DeleteQuestion(context.Background(), uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to delete question",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Question deleted successfully",
	})
}

// GetQuestionTemplates handles GET /questions/templates
func (h *QuestionHandler) GetQuestionTemplates(c *gin.Context) {
	// This is an alias for GetQuestions for backward compatibility
	h.GetQuestions(c)
}

// CreateQuestionTemplate handles POST /questions/templates
func (h *QuestionHandler) CreateQuestionTemplate(c *gin.Context) {
	// This is an alias for CreateQuestion for backward compatibility
	h.CreateQuestion(c)
}

// UpdateQuestionTemplate handles PUT /questions/templates/:id
func (h *QuestionHandler) UpdateQuestionTemplate(c *gin.Context) {
	// This is an alias for UpdateQuestion for backward compatibility
	h.UpdateQuestion(c)
}

// DeleteQuestionTemplate handles DELETE /questions/templates/:id
func (h *QuestionHandler) DeleteQuestionTemplate(c *gin.Context) {
	// This is an alias for DeleteQuestion for backward compatibility
	h.DeleteQuestion(c)
}
