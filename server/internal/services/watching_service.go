package services

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"kidsviewer-server/internal/cache"
	"kidsviewer-server/internal/config"
	"kidsviewer-server/internal/database"
	"kidsviewer-server/internal/models"
	"time"

	"gorm.io/gorm"
)

// WatchingService handles watching session business logic
type WatchingService struct {
	db     *database.Database
	cache  cache.Cache
	config *config.KidsViewerConfig
}

// NewWatchingService creates a new watching service
func NewWatchingService(db *database.Database, cache cache.Cache, cfg *config.KidsViewerConfig) *WatchingService {
	return &WatchingService{
		db:     db,
		cache:  cache,
		config: cfg,
	}
}

// StartWatchingRequest represents the request to start watching
type StartWatchingRequest struct {
	PersonID    string `json:"person_id" binding:"required"`
	PlatformURL string `json:"platform_url" binding:"required,url"`
}

// StartWatchingResponse represents the response for starting watching
type StartWatchingResponse struct {
	WatchingToken string                  `json:"watching_token"`
	ExpiresAt     time.Time               `json:"expires_at"`
	Session       *models.WatchingSession `json:"session"`
}

// StartWatching starts a new watching session
func (s *WatchingService) StartWatching(ctx context.Context, req *StartWatchingRequest) (*StartWatchingResponse, error) {
	// Get person
	var person models.Person
	if err := s.db.DB.Where("id = ?", req.PersonID).First(&person).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("person not found")
		}
		return nil, fmt.Errorf("failed to get person: %w", err)
	}

	// Check for existing active session
	var existingSession models.WatchingSession
	err := s.db.DB.Where("person_id = ? AND status = ?", person.ID, "active").First(&existingSession).Error
	if err == nil {
		// Update existing session
		existingSession.PlatformURL = req.PlatformURL
		existingSession.ExpiresAt = time.Now().Add(time.Duration(s.config.SessionTimeoutMinutes) * time.Minute)

		if err := s.db.DB.Save(&existingSession).Error; err != nil {
			return nil, fmt.Errorf("failed to update existing session: %w", err)
		}

		return &StartWatchingResponse{
			WatchingToken: existingSession.WatchingToken,
			ExpiresAt:     existingSession.ExpiresAt,
			Session:       &existingSession,
		}, nil
	} else if err != gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("failed to check existing session: %w", err)
	}

	// Generate watching token
	token, err := s.generateWatchingToken()
	if err != nil {
		return nil, fmt.Errorf("failed to generate watching token: %w", err)
	}

	// Calculate daily watched time
	dailyWatchedTime, err := s.getDailyWatchedTime(ctx, req.PersonID)
	if err != nil {
		fmt.Printf("Warning: failed to get daily watched time: %v\n", err)
		dailyWatchedTime = 0
	}

	// Create new session
	session := &models.WatchingSession{
		PersonID:         person.ID,
		PlatformURL:      req.PlatformURL,
		WatchingToken:    token,
		StartTime:        time.Now(),
		ExpiresAt:        time.Now().Add(time.Duration(s.config.SessionTimeoutMinutes) * time.Minute),
		DailyWatchedTime: dailyWatchedTime,
		QuestionsAsked:   0,
		Status:           "active",
	}

	if err := s.db.DB.Create(session).Error; err != nil {
		return nil, fmt.Errorf("failed to create watching session: %w", err)
	}

	// Cache session for quick access
	cacheKey := cache.CacheKey(cache.SessionPrefix, token)
	if err := s.cache.Set(ctx, cacheKey, session, time.Duration(s.config.SessionTimeoutMinutes)*time.Minute); err != nil {
		fmt.Printf("Warning: failed to cache watching session: %v\n", err)
	}

	return &StartWatchingResponse{
		WatchingToken: token,
		ExpiresAt:     session.ExpiresAt,
		Session:       session,
	}, nil
}

// CheckWatchingRequest represents the request to check watching status
type CheckWatchingRequest struct {
	WatchingToken string `json:"watching_token" binding:"required"`
}

// CheckWatchingResponse represents the response for checking watching status
type CheckWatchingResponse struct {
	Valid             bool                     `json:"valid"`
	Session           *models.WatchingSession  `json:"session,omitempty"`
	Question          *models.QuestionTemplate `json:"question,omitempty"`
	RemainingTime     int                      `json:"remaining_time,omitempty"` // Minutes
	QuestionsAnswered int                      `json:"questions_answered"`
}

// CheckWatching checks the watching session status and may return a question
func (s *WatchingService) CheckWatching(ctx context.Context, req *CheckWatchingRequest) (*CheckWatchingResponse, error) {
	// Get session from cache first
	cacheKey := cache.CacheKey(cache.SessionPrefix, req.WatchingToken)
	var session models.WatchingSession
	err := s.cache.Get(ctx, cacheKey, &session)
	if err != nil {
		// Try database
		if err := s.db.DB.Where("watching_token = ?", req.WatchingToken).First(&session).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return &CheckWatchingResponse{Valid: false}, nil
			}
			return nil, fmt.Errorf("failed to get watching session: %w", err)
		}
	}

	// Check if session is still valid
	if session.Status != "active" || time.Now().After(session.ExpiresAt) {
		// Mark as expired
		session.Status = "expired"
		s.db.DB.Save(&session)
		s.cache.Delete(ctx, cacheKey)
		return &CheckWatchingResponse{Valid: false}, nil
	}

	response := &CheckWatchingResponse{
		Valid:             true,
		Session:           &session,
		RemainingTime:     int(time.Until(session.ExpiresAt).Minutes()),
		QuestionsAnswered: session.QuestionsAsked,
	}

	// Check if ForceSkip is set - if so, don't ask questions
	if session.ForceSkip {
		fmt.Printf("ForceSkip is enabled for session %s, skipping questions\n", req.WatchingToken)
		return response, nil
	}

	// Check if it's time for a question
	if s.shouldAskQuestion(ctx, &session) {
		question, err := s.getQuestionForPerson(ctx, session.PersonID)
		if err != nil {
			fmt.Printf("Warning: failed to get question: %v\n", err)
		} else {
			response.Question = question
		}
	}

	return response, nil
}

// VerifyQuestionRequest represents the request to verify a question answer
type VerifyQuestionRequest struct {
	WatchingToken string `json:"watching_token" binding:"required"`
	QuestionID    uint   `json:"question_id" binding:"required"`
	Answer        string `json:"answer" binding:"required"`
}

// VerifyQuestionResponse represents the response for question verification
type VerifyQuestionResponse struct {
	Correct     bool   `json:"correct"`
	Explanation string `json:"explanation,omitempty"`
}

// VerifyQuestion verifies a question answer
func (s *WatchingService) VerifyQuestion(ctx context.Context, req *VerifyQuestionRequest) (*VerifyQuestionResponse, error) {
	// Get session
	var session models.WatchingSession
	if err := s.db.DB.Where("watching_token = ?", req.WatchingToken).First(&session).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("watching session not found")
		}
		return nil, fmt.Errorf("failed to get watching session: %w", err)
	}

	// Get question
	var question models.QuestionTemplate
	if err := s.db.DB.First(&question, req.QuestionID).Error; err != nil {
		return nil, fmt.Errorf("failed to get question: %w", err)
	}

	// Verify answer
	correct := question.CorrectAnswer == req.Answer

	// Update session
	session.QuestionsAsked++
	if err := s.db.DB.Save(&session).Error; err != nil {
		fmt.Printf("Warning: failed to update session: %v\n", err)
	}

	// Update cache
	cacheKey := cache.CacheKey(cache.SessionPrefix, req.WatchingToken)
	if err := s.cache.Set(ctx, cacheKey, &session, time.Until(session.ExpiresAt)); err != nil {
		fmt.Printf("Warning: failed to update cached session: %v\n", err)
	}

	response := &VerifyQuestionResponse{
		Correct: correct,
	}

	if !correct {
		response.Explanation = question.ExplanationEN
		if question.ExplanationCN != "" {
			response.Explanation = question.ExplanationCN
		}
	}

	return response, nil
}

// SkipQuestionsRequest represents the request to skip questions with parental password
type SkipQuestionsRequest struct {
	WatchingToken string `json:"watching_token" binding:"required"`
	Password      string `json:"password" binding:"required"`
}

// SkipQuestionsResponse represents the response for skipping questions
type SkipQuestionsResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

// SkipQuestions skips questions for a watching session with parental password verification
func (s *WatchingService) SkipQuestions(ctx context.Context, req *SkipQuestionsRequest) (*SkipQuestionsResponse, error) {
	// Get session
	var session models.WatchingSession
	if err := s.db.DB.Where("watching_token = ?", req.WatchingToken).First(&session).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return &SkipQuestionsResponse{
				Success: false,
				Message: "Watching session not found",
			}, nil
		}
		return nil, fmt.Errorf("failed to get watching session: %w", err)
	}

	// Get person to verify parental password
	var person models.Person
	if err := s.db.DB.Where("id = ?", session.PersonID).First(&person).Error; err != nil {
		return nil, fmt.Errorf("failed to get person: %w", err)
	}

	// Get user to verify parental password
	var user models.User
	if err := s.db.DB.Where("id = ?", person.UserID).First(&user).Error; err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Verify parental password
	var parental models.Parental
	if err := s.db.DB.Where("user_id = ?", user.ID).First(&parental).Error; err != nil {
		return &SkipQuestionsResponse{
			Success: false,
			Message: "Parental control not found",
		}, nil
	}

	// Check password
	if parental.ControlPassword != req.Password {
		return &SkipQuestionsResponse{
			Success: false,
			Message: "Invalid parental password",
		}, nil
	}

	// Set ForceSkip to true
	session.ForceSkip = true
	if err := s.db.DB.Save(&session).Error; err != nil {
		return nil, fmt.Errorf("failed to update session: %w", err)
	}

	// Update cache
	cacheKey := cache.CacheKey(cache.SessionPrefix, req.WatchingToken)
	if err := s.cache.Set(ctx, cacheKey, &session, time.Until(session.ExpiresAt)); err != nil {
		fmt.Printf("Warning: failed to update cached session: %v\n", err)
	}

	return &SkipQuestionsResponse{
		Success: true,
		Message: "Questions skipped successfully",
	}, nil
}

// GetWatchingHistory gets watching history for a person
func (s *WatchingService) GetWatchingHistory(ctx context.Context, personID string, limit int) ([]models.WatchingSession, error) {
	query := s.db.DB.Where("person_id = ?", personID).Order("created_at DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	var sessions []models.WatchingSession
	if err := query.Find(&sessions).Error; err != nil {
		return nil, fmt.Errorf("failed to get watching history: %w", err)
	}

	return sessions, nil
}

// generateWatchingToken generates a secure random token
func (s *WatchingService) generateWatchingToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// shouldAskQuestion determines if a question should be asked
func (s *WatchingService) shouldAskQuestion(ctx context.Context, session *models.WatchingSession) bool {
	// Simple logic: ask a question every 10 minutes or after certain number of checks
	watchingDuration := time.Since(session.StartTime)
	questionInterval := time.Duration(s.config.QuestionIntervalMinutes) * time.Minute

	return watchingDuration >= questionInterval && session.QuestionsAsked < s.config.MaxQuestionsPerSession
}

// getQuestionForPerson gets an appropriate question for the person
func (s *WatchingService) getQuestionForPerson(ctx context.Context, personID string) (*models.QuestionTemplate, error) {
	// Get person to determine age group and difficulty
	var person models.Person
	if err := s.db.DB.Where("id = ?", personID).First(&person).Error; err != nil {
		return nil, fmt.Errorf("failed to get person: %w", err)
	}

	// Get random question based on person's profile
	query := s.db.DB.Where("enabled = ?", true)

	if person.AgeGroup != "" {
		query = query.Where("JSON_CONTAINS(age_groups, ?)", fmt.Sprintf(`"%s"`, person.AgeGroup))
	}

	if person.Difficulty != "" {
		query = query.Where("difficulty = ?", person.Difficulty)
	}

	var question models.QuestionTemplate
	if err := query.Order("RAND()").First(&question).Error; err != nil {
		// Fallback to any question
		if err := s.db.DB.Where("enabled = ?", true).Order("RAND()").First(&question).Error; err != nil {
			return nil, fmt.Errorf("no questions available: %w", err)
		}
	}

	return &question, nil
}

// getDailyWatchedTime calculates total watched time for today
func (s *WatchingService) getDailyWatchedTime(ctx context.Context, personID string) (int, error) {
	today := time.Now().Format("2006-01-02")

	var totalMinutes int64
	err := s.db.DB.Model(&models.WatchingSession{}).
		Select("COALESCE(SUM(TIMESTAMPDIFF(MINUTE, start_time, COALESCE(updated_at, NOW()))), 0)").
		Where("person_id = ? AND DATE(start_time) = ? AND status IN (?, ?)", personID, today, "completed", "expired").
		Scan(&totalMinutes).Error

	if err != nil {
		return 0, err
	}

	return int(totalMinutes), nil
}
