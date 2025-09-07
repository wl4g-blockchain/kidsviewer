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
	BaseModel
	ParentalID uint   `json:"parental_id" gorm:"not null;index"`
	UserType   string `json:"user_type" gorm:"default:'PERSON'"`
	Email      string `json:"email" gorm:"uniqueIndex;not null"`
	Name       string `json:"name" gorm:"not null"`
	Alias      string `json:"alias" gorm:"not null"`
	AgeGroup   string `json:"age_group" gorm:"not null;check:age_group IN ('preschool', 'young', 'older', 'teen')"`

	// Settings stored as JSON
	Settings   PersonSettings   `json:"settings" gorm:"type:json"`
	Statistics PersonStatistics `json:"statistics" gorm:"type:json"`

	// Relationships
	Parental         Parental          `json:"parental,omitempty" gorm:"foreignKey:ParentalID"`
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
	PersonID         uint      `json:"person_id" gorm:"not null;index"`
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
