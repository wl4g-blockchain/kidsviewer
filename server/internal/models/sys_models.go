package models

import (
	"time"

	"gorm.io/gorm"
)

// Base model with common fields
type BaseModel struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// User represents the base user entity
type User struct {
	BaseModel
	Email    string `json:"email" gorm:"uniqueIndex;not null"`
	Phone    string `json:"phone,omitempty"`
	Name     string `json:"name" gorm:"not null"`
	UserType string `json:"userType" gorm:"not null;check:user_type IN ('PARENTAL', 'PERSON')"`
}

// AppSettings represents application-wide settings
type AppSettings struct {
	BaseModel
	UserID   uint                   `json:"userId" gorm:"uniqueIndex;not null"`
	Language string                 `json:"language" gorm:"default:'en'"`
	Theme    string                 `json:"theme" gorm:"default:'light'"`
	Settings map[string]interface{} `json:"settings" gorm:"type:json"`
}

// AppInfo represents application information
type AppInfo struct {
	Version    string `json:"version"`
	BuildType  string `json:"buildType"`
	Platform   string `json:"platform"`
	BuildDate  string `json:"buildDate"`
	CommitHash string `json:"commitHash,omitempty"`
}

// TableName methods for custom table names
func (AppSettings) TableName() string {
	return "app_settings"
}

// Request/Response models for Auth operations

// RegisterRequest represents the request to register a new user
type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=2,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	IsParent bool   `json:"isParent"`
}

// LoginRequest represents the request to login
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// VerifyPasswordRequest represents the request to verify parental password
type VerifyPasswordRequest struct {
	Password string `json:"password" binding:"required"`
}
