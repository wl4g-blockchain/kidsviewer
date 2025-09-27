package test

import (
	"bytes"
	"encoding/json"
	"kidsviewer-server/internal/handlers"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestWatchingHandler_StartWatching_InvalidData(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a mock watching service (nil for this test)
	handler := handlers.NewWatchingHandler(nil)

	router := gin.New()
	router.POST("/watching/start", handler.StartWatching)

	// Test with invalid data (empty request)
	invalidData := map[string]interface{}{}

	jsonBody, _ := json.Marshal(invalidData)
	req, _ := http.NewRequest("POST", "/watching/start", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return 500 Internal Server Error due to nil service
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
	assert.NotEmpty(t, response["message"])
}

func TestWatchingHandler_CheckWatching_InvalidData(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a mock watching service (nil for this test)
	handler := handlers.NewWatchingHandler(nil)

	router := gin.New()
	router.POST("/watching/check", handler.CheckWatching)

	// Test with invalid data (empty request)
	invalidData := map[string]interface{}{}

	jsonBody, _ := json.Marshal(invalidData)
	req, _ := http.NewRequest("POST", "/watching/check", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return 500 Internal Server Error due to nil service
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
	assert.NotEmpty(t, response["message"])
}

func TestWatchingHandler_VerifyQuestion_InvalidData(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a mock watching service (nil for this test)
	handler := handlers.NewWatchingHandler(nil)

	router := gin.New()
	router.POST("/watching/verify", handler.VerifyQuestion)

	// Test with invalid data (empty request)
	invalidData := map[string]interface{}{}

	jsonBody, _ := json.Marshal(invalidData)
	req, _ := http.NewRequest("POST", "/watching/verify", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return 500 Internal Server Error due to nil service
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
	assert.NotEmpty(t, response["message"])
}

func TestWatchingHandler_GetWatchingHistory_NoPersonID(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a mock watching service (nil for this test)
	handler := handlers.NewWatchingHandler(nil)

	router := gin.New()
	router.GET("/watching/history/:person_id", handler.GetWatchingHistory)

	req, _ := http.NewRequest("GET", "/watching/history/", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return 404 Not Found due to missing person_id parameter
	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestWatchingHandler_SkipQuestions_InvalidData(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a mock watching service (nil for this test)
	handler := handlers.NewWatchingHandler(nil)

	router := gin.New()
	router.POST("/watching/skip", handler.SkipQuestions)

	// Test with invalid data (empty request)
	invalidData := map[string]interface{}{}

	jsonBody, _ := json.Marshal(invalidData)
	req, _ := http.NewRequest("POST", "/watching/skip", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return 500 Internal Server Error due to nil service
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
	assert.NotEmpty(t, response["message"])
}
