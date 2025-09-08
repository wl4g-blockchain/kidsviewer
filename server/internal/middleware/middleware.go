package middleware

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"time"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel/attribute"
	otelmetric "go.opentelemetry.io/otel/metric"
)

// RequestID middleware adds a unique request ID to each request
func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check if request ID is already set (e.g., from load balancer)
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			// Generate a new request ID
			requestID = generateRequestID()
		}

		// Set request ID in context and response header
		c.Set("request_id", requestID)
		c.Header("X-Request-ID", requestID)

		c.Next()
	}
}

// Metrics middleware records HTTP metrics
func Metrics(requestCounter otelmetric.Int64Counter, requestDuration otelmetric.Float64Histogram) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		// Process request
		c.Next()

		// Record metrics
		duration := time.Since(start).Seconds()

		// Create attributes for metrics
		attrs := []attribute.KeyValue{
			attribute.String("method", c.Request.Method),
			attribute.String("route", c.FullPath()),
			attribute.Int("status_code", c.Writer.Status()),
		}

		// Record request counter
		requestCounter.Add(context.Background(), 1, otelmetric.WithAttributes(attrs...))

		// Record request duration
		requestDuration.Record(context.Background(), duration, otelmetric.WithAttributes(attrs...))
	}
}

// generateRequestID generates a unique request ID
func generateRequestID() string {
	bytes := make([]byte, 8)
	if _, err := rand.Read(bytes); err != nil {
		// Fallback to timestamp-based ID if random generation fails
		return hex.EncodeToString([]byte(time.Now().Format("20060102150405.000")))
	}
	return hex.EncodeToString(bytes)
}
