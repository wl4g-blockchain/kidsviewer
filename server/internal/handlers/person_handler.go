package handlers

import (
	"kidsviewer-server/internal/models"
	"kidsviewer-server/internal/services"
	"net/http"

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
func (h *PersonHandler) GetPersons(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not authenticated",
		})
		return
	}

	persons, err := h.personService.GetPersons(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to get persons",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    persons,
	})
}

// GetPerson returns a specific person
func (h *PersonHandler) GetPerson(c *gin.Context) {
	userID := c.GetString("user_id")
	personID := c.Param("id")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not authenticated",
		})
		return
	}

	person, err := h.personService.GetPerson(userID, personID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Person not found",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    person,
	})
}

// CreatePerson creates a new person
func (h *PersonHandler) CreatePerson(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not authenticated",
		})
		return
	}

	var req models.CreatePersonRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request data",
			"error":   err.Error(),
		})
		return
	}

	person, err := h.personService.CreatePerson(userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to create person",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Person created successfully",
		"data":    person,
	})
}

// UpdatePerson updates an existing person
func (h *PersonHandler) UpdatePerson(c *gin.Context) {
	userID := c.GetString("user_id")
	personID := c.Param("id")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not authenticated",
		})
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
func (h *PersonHandler) DeletePerson(c *gin.Context) {
	userID := c.GetString("user_id")
	personID := c.Param("id")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not authenticated",
		})
		return
	}

	err := h.personService.DeletePerson(userID, personID)
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
func (h *PersonHandler) UpdatePersonSettings(c *gin.Context) {
	userID := c.GetString("user_id")
	personID := c.Param("id")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not authenticated",
		})
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
func (h *PersonHandler) GetPersonPlatforms(c *gin.Context) {
	userID := c.GetString("user_id")
	personID := c.Param("id")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not authenticated",
		})
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
func (h *PersonHandler) GetPersonStatistics(c *gin.Context) {
	userID := c.GetString("user_id")
	personID := c.Param("id")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not authenticated",
		})
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
func (h *PersonHandler) GetLearningProgress(c *gin.Context) {
	userID := c.GetString("user_id")
	personID := c.Param("id")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not authenticated",
		})
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
