package services

import (
	"context"
	"fmt"
	"kidsviewer-server/internal/cache"
	"kidsviewer-server/internal/database"
	"kidsviewer-server/internal/models"
	"strconv"
	"time"

	"gorm.io/gorm"
)

// QuestionService handles question-related business logic
type QuestionService struct {
	db    *database.Database
	cache cache.Cache
}

// NewQuestionService creates a new question service
func NewQuestionService(db *database.Database, cache cache.Cache) *QuestionService {
	return &QuestionService{
		db:    db,
		cache: cache,
	}
}

// GetQuestions retrieves questions with filters
func (s *QuestionService) GetQuestions(ctx context.Context, subject, difficulty, ageGroup string, limit int) ([]models.QuestionTemplate, error) {
	query := s.db.DB.Where("enabled = ?", true)

	if subject != "" {
		query = query.Where("subject = ?", subject)
	}
	if difficulty != "" {
		query = query.Where("difficulty = ?", difficulty)
	}
	if ageGroup != "" {
		query = query.Where("JSON_CONTAINS(age_groups, ?)", fmt.Sprintf(`"%s"`, ageGroup))
	}

	if limit > 0 {
		query = query.Limit(limit)
	}

	var questions []models.QuestionTemplate
	if err := query.Find(&questions).Error; err != nil {
		return nil, fmt.Errorf("failed to get questions: %w", err)
	}

	return questions, nil
}

// GetQuestion retrieves a question by ID
func (s *QuestionService) GetQuestion(ctx context.Context, id uint) (*models.QuestionTemplate, error) {
	// Try cache first
	cacheKey := cache.CacheKey(cache.QuestionPrefix, strconv.FormatUint(uint64(id), 10))
	var cachedQuestion models.QuestionTemplate
	if err := s.cache.Get(ctx, cacheKey, &cachedQuestion); err == nil {
		return &cachedQuestion, nil
	}

	// Load from database
	var question models.QuestionTemplate
	if err := s.db.DB.First(&question, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("question not found")
		}
		return nil, fmt.Errorf("failed to get question: %w", err)
	}

	// Cache for future requests
	if err := s.cache.Set(ctx, cacheKey, &question, 30*time.Minute); err != nil {
		fmt.Printf("Warning: failed to cache question: %v\n", err)
	}

	return &question, nil
}

// CreateQuestion creates a new question
func (s *QuestionService) CreateQuestion(ctx context.Context, question *models.QuestionTemplate) (*models.QuestionTemplate, error) {
	if err := s.db.DB.Create(question).Error; err != nil {
		return nil, fmt.Errorf("failed to create question: %w", err)
	}

	return question, nil
}

// UpdateQuestion updates an existing question
func (s *QuestionService) UpdateQuestion(ctx context.Context, id uint, updates *models.QuestionTemplate) (*models.QuestionTemplate, error) {
	var question models.QuestionTemplate
	if err := s.db.DB.First(&question, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("question not found")
		}
		return nil, fmt.Errorf("failed to find question: %w", err)
	}

	if err := s.db.DB.Model(&question).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("failed to update question: %w", err)
	}

	// Invalidate cache
	cacheKey := cache.CacheKey(cache.QuestionPrefix, strconv.FormatUint(uint64(id), 10))
	if err := s.cache.Delete(ctx, cacheKey); err != nil {
		fmt.Printf("Warning: failed to invalidate question cache: %v\n", err)
	}

	return &question, nil
}

// DeleteQuestion deletes a question
func (s *QuestionService) DeleteQuestion(ctx context.Context, id uint) error {
	if err := s.db.DB.Delete(&models.QuestionTemplate{}, id).Error; err != nil {
		return fmt.Errorf("failed to delete question: %w", err)
	}

	// Invalidate cache
	cacheKey := cache.CacheKey(cache.QuestionPrefix, strconv.FormatUint(uint64(id), 10))
	if err := s.cache.Delete(ctx, cacheKey); err != nil {
		fmt.Printf("Warning: failed to invalidate question cache: %v\n", err)
	}

	return nil
}

// GetRandomQuestion gets a random question based on criteria
func (s *QuestionService) GetRandomQuestion(ctx context.Context, subject, difficulty, ageGroup string) (*models.QuestionTemplate, error) {
	query := s.db.DB.Where("enabled = ?", true)

	if subject != "" {
		query = query.Where("subject = ?", subject)
	}
	if difficulty != "" {
		query = query.Where("difficulty = ?", difficulty)
	}
	if ageGroup != "" {
		query = query.Where("JSON_CONTAINS(age_groups, ?)", fmt.Sprintf(`"%s"`, ageGroup))
	}

	var question models.QuestionTemplate
	if err := query.Order("RAND()").First(&question).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("no questions found matching criteria")
		}
		return nil, fmt.Errorf("failed to get random question: %w", err)
	}

	return &question, nil
}
