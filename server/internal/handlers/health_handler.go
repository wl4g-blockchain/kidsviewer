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
// @Summary Get health status
// @Description Get the overall health status of the service
// @Tags health
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{} "Health status"
// @Router /health [get]
func (h *HealthHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "kidsviewer-server",
		"version": "1.0.0",
	})
}

// Ready returns the readiness status (for Kubernetes readiness probe)
// @Summary Get readiness status
// @Description Get the readiness status of the service for Kubernetes readiness probe
// @Tags health
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{} "Readiness status"
// @Router /health/ready [get]
func (h *HealthHandler) Ready(c *gin.Context) {
	// In a real implementation, you would check if all dependencies are ready
	// For example: database connection, cache connection, external services, etc.
	c.JSON(http.StatusOK, gin.H{
		"status": "ready",
	})
}

// Live returns the liveness status (for Kubernetes liveness probe)
// @Summary Get liveness status
// @Description Get the liveness status of the service for Kubernetes liveness probe
// @Tags health
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{} "Liveness status"
// @Router /health/live [get]
func (h *HealthHandler) Live(c *gin.Context) {
	// In a real implementation, you would check if the service is alive
	// This should be a lightweight check that doesn't depend on external services
	c.JSON(http.StatusOK, gin.H{
		"status": "alive",
	})
}
