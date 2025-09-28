package handlers

import (
	_ "kidsviewer-server/docs"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// SwaggerHandler handles Swagger UI endpoints
type SwaggerHandler struct{}

// NewSwaggerHandler creates a new SwaggerHandler
func NewSwaggerHandler() *SwaggerHandler {
	return &SwaggerHandler{}
}

// SwaggerUI returns the Swagger UI handler
func (h *SwaggerHandler) SwaggerUI() gin.HandlerFunc {
	return ginSwagger.WrapHandler(swaggerFiles.Handler)
}
