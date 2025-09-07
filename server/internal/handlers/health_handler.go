package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// HealthHandler handles health check endpoints
type HealthHandler struct{}

// NewHealthHandler creates a new HealthHandler
func NewHealthHandler() *HealthHandler {
	return &HealthHandler{}
}

// Health returns the overall health status
func (h *HealthHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "kidsviewer-server",
		"version": "1.0.0",
	})
}

// Ready returns the readiness status (for Kubernetes readiness probe)
func (h *HealthHandler) Ready(c *gin.Context) {
	// In a real implementation, you would check if all dependencies are ready
	// For example: database connection, cache connection, external services, etc.
	c.JSON(http.StatusOK, gin.H{
		"status": "ready",
	})
}

// Live returns the liveness status (for Kubernetes liveness probe)
func (h *HealthHandler) Live(c *gin.Context) {
	// In a real implementation, you would check if the service is alive
	// This should be a lightweight check that doesn't depend on external services
	c.JSON(http.StatusOK, gin.H{
		"status": "alive",
	})
}
