package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// APIResponse represents the standard API response format
type APIResponse struct {
	ErrCode string      `json:"errcode"`
	ErrMsg  string      `json:"errmsg"`
	Data    interface{} `json:"data,omitempty"`
}

// SuccessResponse creates a success response
func SuccessResponse(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, APIResponse{
		ErrCode: "200",
		ErrMsg:  "ok",
		Data:    data,
	})
}

// ErrorResponse creates an error response
func ErrorResponse(c *gin.Context, statusCode int, errCode, errMsg string) {
	c.JSON(statusCode, APIResponse{
		ErrCode: errCode,
		ErrMsg:  errMsg,
	})
}

// BadRequestResponse creates a bad request response
func BadRequestResponse(c *gin.Context, errMsg string) {
	ErrorResponse(c, http.StatusBadRequest, "4000", errMsg)
}

// UnauthorizedResponse creates an unauthorized response
func UnauthorizedResponse(c *gin.Context, errMsg string) {
	ErrorResponse(c, http.StatusUnauthorized, "4001", errMsg)
}

// NotFoundResponse creates a not found response
func NotFoundResponse(c *gin.Context, errMsg string) {
	ErrorResponse(c, http.StatusNotFound, "4004", errMsg)
}

// InternalServerErrorResponse creates an internal server error response
func InternalServerErrorResponse(c *gin.Context, errMsg string) {
	ErrorResponse(c, http.StatusInternalServerError, "5000", errMsg)
}

// ValidationErrorResponse creates a validation error response
func ValidationErrorResponse(c *gin.Context, errMsg string) {
	ErrorResponse(c, http.StatusBadRequest, "4002", errMsg)
}

// BusinessErrorResponse creates a business logic error response
func BusinessErrorResponse(c *gin.Context, errCode, errMsg string) {
	ErrorResponse(c, http.StatusBadRequest, errCode, errMsg)
}
