package models

import (
	"time"
)

// Parental represents a parent/guardian user
type Parental struct {
	BaseModel
	Email           string   `json:"email" gorm:"uniqueIndex;not null"`
	Phone           string   `json:"phone,omitempty"`
	Name            string   `json:"name" gorm:"not null"`
	UserType        string   `json:"userType" gorm:"default:'PARENTAL'"`
	ControlPassword string   `json:"-" gorm:"not null"` // Hashed password
	Persons         []Person `json:"persons,omitempty" gorm:"foreignKey:ParentalID"`
}

// Person represents a child/person user
type Person struct {
	ID               int64     `json:"id" gorm:"primaryKey"`
	UserID           int64     `json:"userId" gorm:"not null;index"`     // Reference to parent user
	ParentalID       int64     `json:"parentalId" gorm:"not null;index"` // Reference to parent user
	Alias            string    `json:"alias" gorm:"not null"`            // Display name for the person
	Name             string    `json:"name" gorm:"not null"`
	AgeGroup         string    `json:"ageGroup" gorm:"not null;check:age_group IN ('preschool', 'young', 'older', 'teen')"`
	Avatar           string    `json:"avatar,omitempty"`
	Difficulty       string    `json:"difficulty,omitempty"`
	MaxDailyTime     int       `json:"maxDailyTime,omitempty"`
	ParentalPassword string    `json:"parentalPassword,omitempty"`
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`

	// Settings and statistics stored as JSON
	Settings   PersonSettings   `json:"settings" gorm:"type:json"`
	Statistics PersonStatistics `json:"statistics" gorm:"type:json"`

	// Relationships
	WatchingSessions []WatchingSession `json:"watchingSessions,omitempty" gorm:"foreignKey:PersonID"`
}

// PersonSettings contains person-specific settings
type PersonSettings struct {
	PerTimeLimitMinutes   int       `json:"perTimeLimitMinutes"`   // Per watching session (e.g., 15, 30, 45)
	DailyTimeLimitMinutes int       `json:"dailyTimeLimitMinutes"` // Total allowed per day (e.g., 120, 180)
	QuestionCount         int       `json:"questionCount"`         // Number of questions to unlock per session
	QuestionsPerDay       int       `json:"questionsPerDay"`       // Maximum questions per day
	PlatformIDs           []int64   `json:"platformIds"`           // IDs of allowed platforms
	Subjects              []Subject `json:"subjects"`              // Subject preferences
}

// Subject represents a learning subject configuration
type Subject struct {
	ID         int64  `json:"id" gorm:"primaryKey"`
	Name       string `json:"name"`
	Enabled    bool   `json:"enabled"`
	Difficulty string `json:"difficulty"` // beginner, easy, medium, hard, expert
}

// PersonStatistics contains person usage statistics
type PersonStatistics struct {
	DailyUsage       []DailyUsage     `json:"dailyUsage"`
	QuestionStats    QuestionStats    `json:"questionStats"`
	LearningProgress LearningProgress `json:"learningProgress"`
}

// DailyUsage represents daily usage statistics
type DailyUsage struct {
	Date      string    `json:"date"`      // YYYY-MM-DD format
	TotalTime int       `json:"totalTime"` // Minutes
	Sessions  []Session `json:"sessions"`
}

// Session represents a viewing session
type Session struct {
	ID                int64  `json:"id" gorm:"primaryKey"`
	StartTime         string `json:"startTime"`
	EndTime           string `json:"endTime"`
	Duration          int    `json:"duration"` // Minutes
	QuestionsAnswered int    `json:"questionsAnswered"`
	QuestionsCorrect  int    `json:"questionsCorrect"`
}

// QuestionStats represents question answering statistics
type QuestionStats struct {
	TotalAnswered     int                `json:"totalAnswered"`
	TotalCorrect      int                `json:"totalCorrect"`
	AccuracyRate      float64            `json:"accuracyRate"`
	SubjectPreference map[string]int     `json:"subjectPreference"`
	RepeatedQuestions []RepeatedQuestion `json:"repeatedQuestions"`
}

// RepeatedQuestion represents a question that was asked multiple times
type RepeatedQuestion struct {
	QuestionID      int64     `json:"questionId"`
	Attempts        int       `json:"attempts"`
	CorrectAttempts int       `json:"correctAttempts"`
	LastAttempted   time.Time `json:"lastAttempted"`
	ForgettingCurve float64   `json:"forgettingCurve"` // 0-1, higher means better retention
}

// LearningProgress represents learning progress across subjects
type LearningProgress struct {
	Subjects     map[string]SubjectProgress `json:"subjects"`
	OverallScore int                        `json:"overallScore"`
	Level        string                     `json:"level"` // beginner, intermediate, advanced
}

// SubjectProgress represents progress in a specific subject
type SubjectProgress struct {
	Subject           string  `json:"subject"`
	QuestionsAnswered int     `json:"questionsAnswered"`
	AccuracyRate      float64 `json:"accuracyRate"`
	CurrentLevel      int     `json:"currentLevel"`
	MaxLevel          int     `json:"maxLevel"`
}

// Platform represents a content platform
type Platform struct {
	BaseModel
	NameEN      string   `json:"nameEN" gorm:"not null"`
	NameCN      string   `json:"nameCN" gorm:"not null"`
	URL         string   `json:"url" gorm:"not null"`
	Description string   `json:"description,omitempty"`
	AgeGroups   []string `json:"ageGroups" gorm:"type:json"` // JSON array of age groups
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
	CorrectAnswer string   `json:"correctAnswer" gorm:"not null"`
	ExplanationEN string   `json:"explanationEN,omitempty"`
	ExplanationCN string   `json:"explanationCN,omitempty"`
	Language      string   `json:"language" gorm:"default:'en'"`
	AgeGroups     []string `json:"ageGroups" gorm:"type:json"`
	Tags          []string `json:"tags" gorm:"type:json"`
	Enabled       bool     `json:"enabled" gorm:"default:true"`
}

// WatchingSession represents an active watching session
type WatchingSession struct {
	BaseModel
	PersonID         int64     `json:"personId" gorm:"not null;index"`
	PlatformURL      string    `json:"platformUrl" gorm:"not null"`
	WatchingToken    string    `json:"watchingToken" gorm:"uniqueIndex;not null"`
	StartTime        time.Time `json:"startTime" gorm:"not null"`
	ExpiresAt        time.Time `json:"expiresAt" gorm:"not null"`
	DailyWatchedTime int       `json:"dailyWatchedTime"`               // Minutes watched today before this session
	QuestionsAsked   int       `json:"questionsAsked"`                 // Questions asked in this session
	ForceSkip        bool      `json:"forceSkip" gorm:"default:false"` // Force skip questions (set by parental password)
	Status           string    `json:"status" gorm:"default:'active';check:status IN ('active', 'expired', 'completed')"`

	// Relationships
	Person Person `json:"person,omitempty" gorm:"foreignKey:PersonID"`
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

// Request/Response models for Person operations

// CreatePersonRequest represents the request to create a new person
type CreatePersonRequest struct {
	Name             string `json:"name" binding:"required,min=1,max=100"`
	AgeGroup         string `json:"ageGroup" binding:"required,oneof=preschool young older teen"`
	Avatar           string `json:"avatar,omitempty"`
	Difficulty       string `json:"difficulty,omitempty"`
	MaxDailyTime     int    `json:"maxDailyTime,omitempty"`
	ParentalPassword string `json:"parentalPassword,omitempty"`
}

// UpdatePersonRequest represents the request to update a person
type UpdatePersonRequest struct {
	Name             *string `json:"name,omitempty"`
	AgeGroup         *string `json:"ageGroup,omitempty"`
	Avatar           *string `json:"avatar,omitempty"`
	Difficulty       *string `json:"difficulty,omitempty"`
	MaxDailyTime     *int    `json:"maxDailyTime,omitempty"`
	ParentalPassword *string `json:"parentalPassword,omitempty"`
}

// UpdatePersonSettingsRequest represents the request to update person settings
type UpdatePersonSettingsRequest struct {
	Difficulty       *string `json:"difficulty,omitempty"`
	MaxDailyTime     *int    `json:"maxDailyTime,omitempty"`
	ParentalPassword *string `json:"parentalPassword,omitempty"`
}
