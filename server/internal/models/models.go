package models

import (
	"time"

	"gorm.io/gorm"
)

// Base model with common fields
type BaseModel struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// User represents the base user entity
type User struct {
	BaseModel
	Email    string `json:"email" gorm:"uniqueIndex;not null"`
	Phone    string `json:"phone,omitempty"`
	Name     string `json:"name" gorm:"not null"`
	UserType string `json:"user_type" gorm:"not null;check:user_type IN ('PARENTAL', 'PERSON')"`
}

// Parental represents a parent/guardian user
type Parental struct {
	BaseModel
	Email           string   `json:"email" gorm:"uniqueIndex;not null"`
	Phone           string   `json:"phone,omitempty"`
	Name            string   `json:"name" gorm:"not null"`
	UserType        string   `json:"user_type" gorm:"default:'PARENTAL'"`
	ControlPassword string   `json:"-" gorm:"not null"` // Hashed password
	Persons         []Person `json:"persons,omitempty" gorm:"foreignKey:ParentalID"`
}

// Person represents a child/person user
type Person struct {
	ID               string    `json:"id" gorm:"primaryKey"`
	UserID           string    `json:"user_id" gorm:"not null;index"` // Reference to parent user
	Name             string    `json:"name" gorm:"not null"`
	AgeGroup         string    `json:"age_group" gorm:"not null;check:age_group IN ('preschool', 'young', 'older', 'teen')"`
	Avatar           string    `json:"avatar,omitempty"`
	Difficulty       string    `json:"difficulty,omitempty"`
	MaxDailyTime     int       `json:"max_daily_time,omitempty"`
	ParentalPassword string    `json:"parental_password,omitempty"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`

	// Settings and statistics stored as JSON
	Statistics PersonStatistics `json:"statistics" gorm:"type:json"`

	// Relationships
	WatchingSessions []WatchingSession `json:"watching_sessions,omitempty" gorm:"foreignKey:PersonID"`
}

// PersonSettings contains person-specific settings
type PersonSettings struct {
	SessionTimeLimit    int       `json:"session_time_limit"`     // Minutes per session
	DailyTotalTimeLimit int       `json:"daily_total_time_limit"` // Total minutes per day
	QuestionCount       int       `json:"question_count"`         // Questions per session
	QuestionsPerDay     int       `json:"questions_per_day"`      // Max questions per day
	PlatformIDs         []string  `json:"platform_ids"`           // Allowed platform IDs
	Subjects            []Subject `json:"subjects"`               // Subject preferences
}

// Subject represents a learning subject configuration
type Subject struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Enabled    bool   `json:"enabled"`
	Difficulty string `json:"difficulty"` // beginner, easy, medium, hard, expert
}

// PersonStatistics contains person usage statistics
type PersonStatistics struct {
	DailyUsage       []DailyUsage     `json:"daily_usage"`
	QuestionStats    QuestionStats    `json:"question_stats"`
	LearningProgress LearningProgress `json:"learning_progress"`
}

// DailyUsage represents daily usage statistics
type DailyUsage struct {
	Date      string    `json:"date"`       // YYYY-MM-DD format
	TotalTime int       `json:"total_time"` // Minutes
	Sessions  []Session `json:"sessions"`
}

// Session represents a viewing session
type Session struct {
	ID                string `json:"id"`
	StartTime         string `json:"start_time"`
	EndTime           string `json:"end_time"`
	Duration          int    `json:"duration"` // Minutes
	QuestionsAnswered int    `json:"questions_answered"`
	QuestionsCorrect  int    `json:"questions_correct"`
}

// QuestionStats represents question answering statistics
type QuestionStats struct {
	TotalAnswered     int                `json:"total_answered"`
	TotalCorrect      int                `json:"total_correct"`
	AccuracyRate      float64            `json:"accuracy_rate"`
	SubjectPreference map[string]int     `json:"subject_preference"`
	RepeatedQuestions []RepeatedQuestion `json:"repeated_questions"`
}

// RepeatedQuestion represents a question that was asked multiple times
type RepeatedQuestion struct {
	QuestionID      string    `json:"question_id"`
	Attempts        int       `json:"attempts"`
	CorrectAttempts int       `json:"correct_attempts"`
	LastAttempted   time.Time `json:"last_attempted"`
	ForgettingCurve float64   `json:"forgetting_curve"` // 0-1, higher means better retention
}

// LearningProgress represents learning progress across subjects
type LearningProgress struct {
	Subjects     map[string]SubjectProgress `json:"subjects"`
	OverallScore int                        `json:"overall_score"`
	Level        string                     `json:"level"` // beginner, intermediate, advanced
}

// SubjectProgress represents progress in a specific subject
type SubjectProgress struct {
	Subject           string  `json:"subject"`
	QuestionsAnswered int     `json:"questions_answered"`
	AccuracyRate      float64 `json:"accuracy_rate"`
	CurrentLevel      int     `json:"current_level"`
	MaxLevel          int     `json:"max_level"`
}

// Platform represents a content platform
type Platform struct {
	BaseModel
	NameEN      string   `json:"name_en" gorm:"not null"`
	NameCN      string   `json:"name_cn" gorm:"not null"`
	URL         string   `json:"url" gorm:"not null"`
	Description string   `json:"description,omitempty"`
	AgeGroups   []string `json:"age_groups" gorm:"type:json"` // JSON array of age groups
	Enabled     bool     `json:"enabled" gorm:"default:true"`
}

// QuestionTemplate represents a question template
type QuestionTemplate struct {
	BaseModel
	Type          string   `json:"type" gorm:"not null;check:type IN ('multiple-choice', 'true-false', 'fill-blank', 'calculation')"`
	Subject       string   `json:"subject" gorm:"not null;index"`
	Difficulty    string   `json:"difficulty" gorm:"not null;check:difficulty IN ('beginner', 'easy', 'medium', 'hard', 'expert')"`
	Content       string   `json:"content" gorm:"not null"`
	Options       []string `json:"options,omitempty" gorm:"type:json"`
	CorrectAnswer string   `json:"correct_answer" gorm:"not null"`
	ExplanationEN string   `json:"explanation_en,omitempty"`
	ExplanationCN string   `json:"explanation_cn,omitempty"`
	Language      string   `json:"language" gorm:"default:'en'"`
	AgeGroups     []string `json:"age_groups" gorm:"type:json"`
	Tags          []string `json:"tags" gorm:"type:json"`
	Enabled       bool     `json:"enabled" gorm:"default:true"`
}

// WatchingSession represents an active watching session
type WatchingSession struct {
	BaseModel
	PersonID         string    `json:"person_id" gorm:"not null;index"`
	PlatformURL      string    `json:"platform_url" gorm:"not null"`
	WatchingToken    string    `json:"watching_token" gorm:"uniqueIndex;not null"`
	StartTime        time.Time `json:"start_time" gorm:"not null"`
	ExpiresAt        time.Time `json:"expires_at" gorm:"not null"`
	DailyWatchedTime int       `json:"daily_watched_time"` // Minutes watched today before this session
	QuestionsAsked   int       `json:"questions_asked"`    // Questions asked in this session
	Status           string    `json:"status" gorm:"default:'active';check:status IN ('active', 'expired', 'completed')"`

	// Relationships
	Person Person `json:"person,omitempty" gorm:"foreignKey:PersonID"`
}

// AppSettings represents application-wide settings
type AppSettings struct {
	BaseModel
	UserID   uint                   `json:"user_id" gorm:"uniqueIndex;not null"`
	Language string                 `json:"language" gorm:"default:'en'"`
	Theme    string                 `json:"theme" gorm:"default:'light'"`
	Settings map[string]interface{} `json:"settings" gorm:"type:json"`
}

// AppInfo represents application information
type AppInfo struct {
	Version    string `json:"version"`
	BuildType  string `json:"build_type"`
	Platform   string `json:"platform"`
	BuildDate  string `json:"build_date"`
	CommitHash string `json:"commit_hash,omitempty"`
}

// TableName methods for custom table names
func (Parental) TableName() string {
	return "parentals"
}

func (Person) TableName() string {
	return "persons"
}

func (Platform) TableName() string {
	return "platforms"
}

func (QuestionTemplate) TableName() string {
	return "question_templates"
}

func (WatchingSession) TableName() string {
	return "watching_sessions"
}

func (AppSettings) TableName() string {
	return "app_settings"
}

// Request/Response models for Person operations

// CreatePersonRequest represents the request to create a new person
type CreatePersonRequest struct {
	Name             string `json:"name" binding:"required,min=1,max=100"`
	AgeGroup         string `json:"age_group" binding:"required,oneof=preschool young older teen"`
	Avatar           string `json:"avatar,omitempty"`
	Difficulty       string `json:"difficulty,omitempty"`
	MaxDailyTime     int    `json:"max_daily_time,omitempty"`
	ParentalPassword string `json:"parental_password,omitempty"`
}

// UpdatePersonRequest represents the request to update a person
type UpdatePersonRequest struct {
	Name             *string `json:"name,omitempty"`
	AgeGroup         *string `json:"age_group,omitempty"`
	Avatar           *string `json:"avatar,omitempty"`
	Difficulty       *string `json:"difficulty,omitempty"`
	MaxDailyTime     *int    `json:"max_daily_time,omitempty"`
	ParentalPassword *string `json:"parental_password,omitempty"`
}

// UpdatePersonSettingsRequest represents the request to update person settings
type UpdatePersonSettingsRequest struct {
	Difficulty       *string `json:"difficulty,omitempty"`
	MaxDailyTime     *int    `json:"max_daily_time,omitempty"`
	ParentalPassword *string `json:"parental_password,omitempty"`
}

// Auth-related request models

// RegisterRequest represents the request to register a new user
type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=2,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	IsParent bool   `json:"is_parent"`
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
