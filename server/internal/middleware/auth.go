package middleware

import (
	"kidsviewer-server/internal/services"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

// AuthRequired middleware validates JWT tokens and adds user info to context
func AuthRequired(authService *services.AuthService) gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		// Get token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Authorization header is required",
			})
			c.Abort()
			return
		}

		// Check Bearer prefix
		tokenParts := strings.SplitN(authHeader, " ", 2)
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Invalid authorization header format",
			})
			c.Abort()
			return
		}

		tokenString := tokenParts[1]

		// Validate token
		claims, err := authService.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Invalid or expired token",
				"error":   err.Error(),
			})
			c.Abort()
			return
		}

		// Set user ID in context (convert uint to string)
		userIDStr := strconv.FormatUint(uint64(claims.UserID), 10)
		c.Set("user_id", userIDStr)
		c.Set("jwt_claims", claims)

		c.Next()
	})
}

// OptionalAuth middleware validates JWT tokens if present but doesn't require them
func OptionalAuth(authService *services.AuthService) gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		// Check Bearer prefix
		tokenParts := strings.SplitN(authHeader, " ", 2)
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			c.Next()
			return
		}

		tokenString := tokenParts[1]

		// Validate token
		claims, err := authService.ValidateToken(tokenString)
		if err != nil {
			c.Next()
			return
		}

		// Set user ID in context (convert uint to string)
		userIDStr := strconv.FormatUint(uint64(claims.UserID), 10)
		c.Set("user_id", userIDStr)
		c.Set("jwt_claims", claims)

		c.Next()
	})
}
