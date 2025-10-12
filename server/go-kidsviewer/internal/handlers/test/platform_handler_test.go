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

func TestPlatformHandler_GetPlatforms_NoService(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a mock platform service (nil for this test)
	handler := handlers.NewPlatformHandler(nil)

	router := gin.New()
	router.GET("/platforms", handler.GetPlatforms)

	req, _ := http.NewRequest("GET", "/platforms", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return 500 Internal Server Error due to nil service
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
	assert.NotEmpty(t, response["message"])
}

func TestPlatformHandler_GetPlatform_InvalidID(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a mock platform service (nil for this test)
	handler := handlers.NewPlatformHandler(nil)

	router := gin.New()
	router.GET("/platforms/:id", handler.GetPlatform)

	req, _ := http.NewRequest("GET", "/platforms/invalid", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return 500 Internal Server Error due to nil service
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
	assert.NotEmpty(t, response["message"])
}

func TestPlatformHandler_CreatePlatform_InvalidData(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a mock platform service (nil for this test)
	handler := handlers.NewPlatformHandler(nil)

	router := gin.New()
	router.POST("/platforms", handler.CreatePlatform)

	// Test with invalid data (missing required fields)
	invalidData := models.Platform{
		NameEN: "",
		URL:    "",
	}

	jsonBody, _ := json.Marshal(invalidData)
	req, _ := http.NewRequest("POST", "/platforms", bytes.NewBuffer(jsonBody))
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

func TestPlatformHandler_UpdatePlatform_InvalidID(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a mock platform service (nil for this test)
	handler := handlers.NewPlatformHandler(nil)

	router := gin.New()
	router.PUT("/platforms/:id", handler.UpdatePlatform)

	updateData := models.Platform{
		NameEN: "Updated Platform",
	}

	jsonBody, _ := json.Marshal(updateData)
	req, _ := http.NewRequest("PUT", "/platforms/invalid", bytes.NewBuffer(jsonBody))
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

func TestPlatformHandler_DeletePlatform_InvalidID(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a mock platform service (nil for this test)
	handler := handlers.NewPlatformHandler(nil)

	router := gin.New()
	router.DELETE("/platforms/:id", handler.DeletePlatform)

	req, _ := http.NewRequest("DELETE", "/platforms/invalid", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return 500 Internal Server Error due to nil service
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
	assert.NotEmpty(t, response["message"])
}
