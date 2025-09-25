package test

import (
	"bytes"
	"encoding/json"
	"kidsviewer-server/internal/handlers"
	"kidsviewer-server/internal/models"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestQuestionHandler_GetQuestions_NoService(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a mock question service (nil for this test)
	handler := handlers.NewQuestionHandler(nil)

	router := gin.New()
	router.GET("/questions", handler.GetQuestions)

	req, _ := http.NewRequest("GET", "/questions", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return 500 Internal Server Error due to nil service
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
}

func TestQuestionHandler_GetQuestion_InvalidID(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a mock question service (nil for this test)
	handler := handlers.NewQuestionHandler(nil)

	router := gin.New()
	router.GET("/questions/:id", handler.GetQuestion)

	req, _ := http.NewRequest("GET", "/questions/invalid", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return 500 Internal Server Error due to nil service
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
}

func TestQuestionHandler_CreateQuestion_InvalidData(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a mock question service (nil for this test)
	handler := handlers.NewQuestionHandler(nil)

	router := gin.New()
	router.POST("/questions", handler.CreateQuestion)

	// Test with invalid data (missing required fields)
	invalidData := models.QuestionTemplate{
		Type:    "",
		Subject: "",
		Content: "",
	}

	jsonBody, _ := json.Marshal(invalidData)
	req, _ := http.NewRequest("POST", "/questions", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return 500 Internal Server Error due to nil service
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
}

func TestQuestionHandler_UpdateQuestion_InvalidID(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a mock question service (nil for this test)
	handler := handlers.NewQuestionHandler(nil)

	router := gin.New()
	router.PUT("/questions/:id", handler.UpdateQuestion)

	updateData := models.QuestionTemplate{
		Type:    "multiple-choice",
		Subject: "math",
		Content: "What is 2+2?",
	}

	jsonBody, _ := json.Marshal(updateData)
	req, _ := http.NewRequest("PUT", "/questions/invalid", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return 500 Internal Server Error due to nil service
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
}

func TestQuestionHandler_DeleteQuestion_InvalidID(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a mock question service (nil for this test)
	handler := handlers.NewQuestionHandler(nil)

	router := gin.New()
	router.DELETE("/questions/:id", handler.DeleteQuestion)

	req, _ := http.NewRequest("DELETE", "/questions/invalid", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return 500 Internal Server Error due to nil service
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
}

func TestQuestionHandler_GetQuestionTemplates(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a mock question service (nil for this test)
	handler := handlers.NewQuestionHandler(nil)

	router := gin.New()
	router.GET("/questions/templates", handler.GetQuestionTemplates)

	req, _ := http.NewRequest("GET", "/questions/templates", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return 500 Internal Server Error due to nil service
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
}
