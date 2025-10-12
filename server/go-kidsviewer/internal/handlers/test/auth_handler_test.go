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

func TestAuthHandler_Register_InvalidData(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a mock auth service (nil for this test)
	handler := handlers.NewAuthHandler(nil)

	router := gin.New()
	router.POST("/register", handler.Register)

	// Test with invalid data
	invalidData := models.RegisterRequest{
		Username: "",
		Email:    "invalid-email",
		Password: "123",
	}

	jsonBody, _ := json.Marshal(invalidData)
	req, _ := http.NewRequest("POST", "/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return 400 Bad Request due to validation errors
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "4002", response["errcode"])
	assert.NotEmpty(t, response["errmsg"])
}

func TestAuthHandler_Login_InvalidData(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a mock auth service (nil for this test)
	handler := handlers.NewAuthHandler(nil)

	router := gin.New()
	router.POST("/login", handler.Login)

	// Test with invalid data
	invalidData := models.LoginRequest{
		Username: "",
		Password: "",
	}

	jsonBody, _ := json.Marshal(invalidData)
	req, _ := http.NewRequest("POST", "/login", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return 400 Bad Request due to validation errors
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "4002", response["errcode"])
	assert.NotEmpty(t, response["errmsg"])
}

func TestAuthHandler_Logout_NoUserID(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a mock auth service (nil for this test)
	handler := handlers.NewAuthHandler(nil)

	router := gin.New()
	router.POST("/logout", handler.Logout)

	req, _ := http.NewRequest("POST", "/logout", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return 401 Unauthorized due to missing user ID
	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "4001", response["errcode"])
	assert.NotEmpty(t, response["errmsg"])
}

func TestAuthHandler_GetCurrentUser_NoUserID(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a mock auth service (nil for this test)
	handler := handlers.NewAuthHandler(nil)

	router := gin.New()
	router.GET("/current-user", handler.GetCurrentUser)

	req, _ := http.NewRequest("GET", "/current-user", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return 401 Unauthorized due to missing user ID
	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "4001", response["errcode"])
	assert.NotEmpty(t, response["errmsg"])
}

func TestAuthHandler_VerifyParentalPassword_NoUserID(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a mock auth service (nil for this test)
	handler := handlers.NewAuthHandler(nil)

	router := gin.New()
	router.POST("/verify-password", handler.VerifyParentalPassword)

	reqData := models.VerifyPasswordRequest{
		Password: "test-password",
	}

	jsonBody, _ := json.Marshal(reqData)
	req, _ := http.NewRequest("POST", "/verify-password", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return 401 Unauthorized due to missing user ID
	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "4001", response["errcode"])
	assert.NotEmpty(t, response["errmsg"])
}
