package handlers

import (
	"kidsviewer-server/internal/models"
	"kidsviewer-server/internal/services"
	"kidsviewer-server/internal/utils"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// PersonHandler handles person-related HTTP requests
type PersonHandler struct {
	personService *services.PersonService
}

// NewPersonHandler creates a new PersonHandler
func NewPersonHandler(personService *services.PersonService) *PersonHandler {
	return &PersonHandler{
		personService: personService,
	}
}

// GetPersons returns all persons for the authenticated user
// @Summary Get all persons
// @Description Get all persons for the authenticated user
// @Tags persons
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{} "Persons retrieved successfully"
// @Failure 401 {object} map[string]interface{} "User not authenticated"
// @Failure 400 {object} map[string]interface{} "Invalid user ID"
// @Failure 500 {object} map[string]interface{} "Failed to get persons"
// @Router /api/v1/persons [get]
func (h *PersonHandler) GetPersons(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	if userIDStr == "" {
		utils.UnauthorizedResponse(c, "User not authenticated")
		return
	}

	// Convert string ID to int64
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid user ID")
		return
	}

	persons, err := h.personService.GetPersons(userID)
	if err != nil {
		utils.InternalServerErrorResponse(c, "Failed to get persons: "+err.Error())
		return
	}

	utils.SuccessResponse(c, persons)
}

// GetPerson returns a specific person
// @Summary Get person by ID
// @Description Get a specific person by ID for the authenticated user
// @Tags persons
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Person ID"
// @Success 200 {object} map[string]interface{} "Person retrieved successfully"
// @Failure 401 {object} map[string]interface{} "User not authenticated"
// @Failure 400 {object} map[string]interface{} "Invalid user ID or person ID"
// @Failure 404 {object} map[string]interface{} "Person not found"
// @Router /api/v1/persons/{id} [get]
func (h *PersonHandler) GetPerson(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	personIDStr := c.Param("id")

	if userIDStr == "" {
		utils.UnauthorizedResponse(c, "User not authenticated")
		return
	}

	// Convert string IDs to int64
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid user ID")
		return
	}

	personID, err := strconv.ParseInt(personIDStr, 10, 64)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid person ID")
		return
	}

	person, err := h.personService.GetPerson(userID, personID)
	if err != nil {
		utils.NotFoundResponse(c, "Person not found: "+err.Error())
		return
	}

	utils.SuccessResponse(c, person)
}

// CreatePerson creates a new person
// @Summary Create a new person
// @Description Create a new person for the authenticated user
// @Tags persons
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.CreatePersonRequest true "Person creation request"
// @Success 200 {object} map[string]interface{} "Person created successfully"
// @Failure 400 {object} map[string]interface{} "Invalid request data or user ID"
// @Failure 401 {object} map[string]interface{} "User not authenticated"
// @Failure 500 {object} map[string]interface{} "Failed to create person"
// @Router /api/v1/persons [post]
func (h *PersonHandler) CreatePerson(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	if userIDStr == "" {
		utils.UnauthorizedResponse(c, "User not authenticated")
		return
	}

	// Convert string ID to int64
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid user ID")
		return
	}

	var req models.CreatePersonRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, "Invalid request data: "+err.Error())
		return
	}

	person, err := h.personService.CreatePerson(userID, req)
	if err != nil {
		utils.InternalServerErrorResponse(c, "Failed to create person: "+err.Error())
		return
	}

	utils.SuccessResponse(c, person)
}

// UpdatePerson updates an existing person
// @Summary Update person
// @Description Update an existing person for the authenticated user
// @Tags persons
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Person ID"
// @Param request body models.UpdatePersonRequest true "Person update request"
// @Success 200 {object} map[string]interface{} "Person updated successfully"
// @Failure 400 {object} map[string]interface{} "Invalid request data or user ID"
// @Failure 401 {object} map[string]interface{} "User not authenticated"
// @Failure 500 {object} map[string]interface{} "Failed to update person"
// @Router /api/v1/persons/{id} [put]
func (h *PersonHandler) UpdatePerson(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	personIDStr := c.Param("id")

	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not authenticated",
		})
		return
	}

	// Convert string IDs to int64
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid user ID")
		return
	}

	personID, err := strconv.ParseInt(personIDStr, 10, 64)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid person ID")
		return
	}

	var req models.UpdatePersonRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request data",
			"error":   err.Error(),
		})
		return
	}

	person, err := h.personService.UpdatePerson(userID, personID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to update person",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Person updated successfully",
		"data":    person,
	})
}

// DeletePerson deletes a person
// @Summary Delete person
// @Description Delete a person for the authenticated user
// @Tags persons
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Person ID"
// @Success 200 {object} map[string]interface{} "Person deleted successfully"
// @Failure 400 {object} map[string]interface{} "Invalid user ID or person ID"
// @Failure 401 {object} map[string]interface{} "User not authenticated"
// @Failure 500 {object} map[string]interface{} "Failed to delete person"
// @Router /api/v1/persons/{id} [delete]
func (h *PersonHandler) DeletePerson(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	personIDStr := c.Param("id")

	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not authenticated",
		})
		return
	}

	// Convert string IDs to int64
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid user ID")
		return
	}

	personID, err := strconv.ParseInt(personIDStr, 10, 64)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid person ID")
		return
	}

	err = h.personService.DeletePerson(userID, personID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to delete person",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Person deleted successfully",
	})
}

// UpdatePersonSettings updates person settings
// @Summary Update person settings
// @Description Update settings for a specific person
// @Tags persons
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Person ID"
// @Param request body models.UpdatePersonSettingsRequest true "Person settings update request"
// @Success 200 {object} map[string]interface{} "Person settings updated successfully"
// @Failure 400 {object} map[string]interface{} "Invalid request data or user ID"
// @Failure 401 {object} map[string]interface{} "User not authenticated"
// @Failure 500 {object} map[string]interface{} "Failed to update person settings"
// @Router /api/v1/persons/{id}/settings [put]
func (h *PersonHandler) UpdatePersonSettings(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	personIDStr := c.Param("id")

	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not authenticated",
		})
		return
	}

	// Convert string IDs to int64
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid user ID")
		return
	}

	personID, err := strconv.ParseInt(personIDStr, 10, 64)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid person ID")
		return
	}

	var req models.UpdatePersonSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request data",
			"error":   err.Error(),
		})
		return
	}

	person, err := h.personService.UpdatePersonSettings(userID, personID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to update person settings",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Person settings updated successfully",
		"data":    person,
	})
}

// GetPersonPlatforms returns platforms available for a person
// @Summary Get person platforms
// @Description Get platforms available for a specific person
// @Tags persons
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Person ID"
// @Success 200 {object} map[string]interface{} "Person platforms retrieved successfully"
// @Failure 400 {object} map[string]interface{} "Invalid user ID or person ID"
// @Failure 401 {object} map[string]interface{} "User not authenticated"
// @Failure 500 {object} map[string]interface{} "Failed to get person platforms"
// @Router /api/v1/persons/{id}/platforms [get]
func (h *PersonHandler) GetPersonPlatforms(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	personIDStr := c.Param("id")

	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not authenticated",
		})
		return
	}

	// Convert string IDs to int64
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid user ID")
		return
	}

	personID, err := strconv.ParseInt(personIDStr, 10, 64)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid person ID")
		return
	}

	platforms, err := h.personService.GetPersonPlatforms(userID, personID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to get person platforms",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    platforms,
	})
}

// GetPersonStatistics returns statistics for a person
// @Summary Get person statistics
// @Description Get statistics for a specific person
// @Tags persons
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Person ID"
// @Success 200 {object} map[string]interface{} "Person statistics retrieved successfully"
// @Failure 400 {object} map[string]interface{} "Invalid user ID or person ID"
// @Failure 401 {object} map[string]interface{} "User not authenticated"
// @Failure 500 {object} map[string]interface{} "Failed to get person statistics"
// @Router /api/v1/persons/{id}/statistics [get]
func (h *PersonHandler) GetPersonStatistics(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	personIDStr := c.Param("id")

	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not authenticated",
		})
		return
	}

	// Convert string IDs to int64
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid user ID")
		return
	}

	personID, err := strconv.ParseInt(personIDStr, 10, 64)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid person ID")
		return
	}

	statistics, err := h.personService.GetPersonStatistics(userID, personID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to get person statistics",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    statistics,
	})
}

// GetLearningProgress returns learning progress for a person
// @Summary Get learning progress
// @Description Get learning progress for a specific person
// @Tags persons
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Person ID"
// @Success 200 {object} map[string]interface{} "Learning progress retrieved successfully"
// @Failure 400 {object} map[string]interface{} "Invalid user ID or person ID"
// @Failure 401 {object} map[string]interface{} "User not authenticated"
// @Failure 500 {object} map[string]interface{} "Failed to get learning progress"
// @Router /api/v1/persons/{id}/learning-progress [get]
func (h *PersonHandler) GetLearningProgress(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	personIDStr := c.Param("id")

	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not authenticated",
		})
		return
	}

	// Convert string IDs to int64
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid user ID")
		return
	}

	personID, err := strconv.ParseInt(personIDStr, 10, 64)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid person ID")
		return
	}

	progress, err := h.personService.GetLearningProgress(userID, personID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to get learning progress",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    progress,
	})
}
