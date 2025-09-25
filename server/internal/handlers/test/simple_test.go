package test

import (
	"kidsviewer-server/internal/handlers"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestHealthHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)

	handler := handlers.NewHealthHandler()
	router := gin.New()
	router.GET("/health", handler.Health)

	req, _ := http.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestHealthHandlerReady(t *testing.T) {
	gin.SetMode(gin.TestMode)

	handler := handlers.NewHealthHandler()
	router := gin.New()
	router.GET("/ready", handler.Ready)

	req, _ := http.NewRequest("GET", "/ready", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestHealthHandlerLive(t *testing.T) {
	gin.SetMode(gin.TestMode)

	handler := handlers.NewHealthHandler()
	router := gin.New()
	router.GET("/live", handler.Live)

	req, _ := http.NewRequest("GET", "/live", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}
