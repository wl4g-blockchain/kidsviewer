package services

import (
	"context"
	"encoding/json"
	"fmt"
	"kidsviewer-server/internal/cache"
	"kidsviewer-server/internal/database"
	"kidsviewer-server/internal/models"
	"time"

	"github.com/google/uuid"
)

// PersonService handles person-related business logic
type PersonService struct {
	db    *database.Database
	cache cache.Cache
}

// NewPersonService creates a new PersonService
func NewPersonService(db *database.Database, cache cache.Cache) *PersonService {
	return &PersonService{
		db:    db,
		cache: cache,
	}
}

// GetPersons returns all persons for a user
func (s *PersonService) GetPersons(userID string) ([]models.Person, error) {
	cacheKey := fmt.Sprintf("user:%s:persons", userID)

	// Try to get from cache first
	var cached string
	err := s.cache.Get(context.Background(), cacheKey, &cached)
	if err == nil && cached != "" {
		var persons []models.Person
		if json.Unmarshal([]byte(cached), &persons) == nil {
			return persons, nil
		}
	}

	// Get from database
	persons, err := s.db.GetPersonsByUserID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get persons: %w", err)
	}

	// Cache the result
	if data, err := json.Marshal(persons); err == nil {
		s.cache.Set(context.Background(), cacheKey, string(data), 5*time.Minute)
	}

	return persons, nil
}

// GetPerson returns a specific person
func (s *PersonService) GetPerson(userID, personID string) (*models.Person, error) {
	cacheKey := fmt.Sprintf("person:%s", personID)

	// Try to get from cache first
	var cached string
	err := s.cache.Get(context.Background(), cacheKey, &cached)
	if err == nil && cached != "" {
		var person models.Person
		if json.Unmarshal([]byte(cached), &person) == nil {
			// Verify ownership
			if person.UserID == userID {
				return &person, nil
			}
		}
	}

	// Get from database
	person, err := s.db.GetPersonByID(personID)
	if err != nil {
		return nil, fmt.Errorf("failed to get person: %w", err)
	}

	// Verify ownership
	if person.UserID != userID {
		return nil, fmt.Errorf("person not found")
	}

	// Cache the result
	if data, err := json.Marshal(person); err == nil {
		s.cache.Set(context.Background(), cacheKey, string(data), 10*time.Minute)
	}

	return person, nil
}

// CreatePerson creates a new person
func (s *PersonService) CreatePerson(userID string, req models.CreatePersonRequest) (*models.Person, error) {
	person := &models.Person{
		ID:               uuid.New().String(),
		UserID:           userID,
		Name:             req.Name,
		AgeGroup:         req.AgeGroup,
		Avatar:           req.Avatar,
		Difficulty:       req.Difficulty,
		MaxDailyTime:     req.MaxDailyTime,
		ParentalPassword: req.ParentalPassword,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	if err := s.db.CreatePerson(person); err != nil {
		return nil, fmt.Errorf("failed to create person: %w", err)
	}

	// Invalidate cache
	s.invalidateUserCache(userID)

	return person, nil
}

// UpdatePerson updates an existing person
func (s *PersonService) UpdatePerson(userID, personID string, req models.UpdatePersonRequest) (*models.Person, error) {
	// Get existing person
	person, err := s.GetPerson(userID, personID)
	if err != nil {
		return nil, err
	}

	// Update fields
	if req.Name != nil {
		person.Name = *req.Name
	}
	if req.AgeGroup != nil {
		person.AgeGroup = *req.AgeGroup
	}
	if req.Avatar != nil {
		person.Avatar = *req.Avatar
	}
	if req.Difficulty != nil {
		person.Difficulty = *req.Difficulty
	}
	if req.MaxDailyTime != nil {
		person.MaxDailyTime = *req.MaxDailyTime
	}
	if req.ParentalPassword != nil {
		person.ParentalPassword = *req.ParentalPassword
	}

	person.UpdatedAt = time.Now()

	if err := s.db.UpdatePerson(person); err != nil {
		return nil, fmt.Errorf("failed to update person: %w", err)
	}

	// Invalidate cache
	s.invalidatePersonCache(personID)
	s.invalidateUserCache(userID)

	return person, nil
}

// DeletePerson deletes a person
func (s *PersonService) DeletePerson(userID, personID string) error {
	// Verify ownership
	_, err := s.GetPerson(userID, personID)
	if err != nil {
		return err
	}

	if err := s.db.DeletePerson(personID); err != nil {
		return fmt.Errorf("failed to delete person: %w", err)
	}

	// Invalidate cache
	s.invalidatePersonCache(personID)
	s.invalidateUserCache(userID)

	return nil
}

// UpdatePersonSettings updates person settings
func (s *PersonService) UpdatePersonSettings(userID, personID string, req models.UpdatePersonSettingsRequest) (*models.Person, error) {
	// Get existing person
	person, err := s.GetPerson(userID, personID)
	if err != nil {
		return nil, err
	}

	// Update settings
	if req.Difficulty != nil {
		person.Difficulty = *req.Difficulty
	}
	if req.MaxDailyTime != nil {
		person.MaxDailyTime = *req.MaxDailyTime
	}
	if req.ParentalPassword != nil {
		person.ParentalPassword = *req.ParentalPassword
	}

	person.UpdatedAt = time.Now()

	if err := s.db.UpdatePerson(person); err != nil {
		return nil, fmt.Errorf("failed to update person settings: %w", err)
	}

	// Invalidate cache
	s.invalidatePersonCache(personID)
	s.invalidateUserCache(userID)

	return person, nil
}

// GetPersonPlatforms returns platforms available for a person
func (s *PersonService) GetPersonPlatforms(userID, personID string) ([]models.Platform, error) {
	// Verify ownership
	person, err := s.GetPerson(userID, personID)
	if err != nil {
		return nil, err
	}

	cacheKey := fmt.Sprintf("person:%s:platforms", personID)

	// Try to get from cache first
	var cached string
	if err := s.cache.Get(context.Background(), cacheKey, &cached); err == nil && cached != "" {
		var platforms []models.Platform
		if json.Unmarshal([]byte(cached), &platforms) == nil {
			return platforms, nil
		}
	}

	// Get platforms suitable for this person's age group
	platforms, err := s.db.GetPlatformsByAgeGroup(person.AgeGroup)
	if err != nil {
		return nil, fmt.Errorf("failed to get person platforms: %w", err)
	}

	// Cache the result
	if data, err := json.Marshal(platforms); err == nil {
		s.cache.Set(context.Background(), cacheKey, string(data), 10*time.Minute)
	}

	return platforms, nil
}

// GetPersonStatistics returns statistics for a person
func (s *PersonService) GetPersonStatistics(userID, personID string) (*models.PersonStatistics, error) {
	// Verify ownership
	_, err := s.GetPerson(userID, personID)
	if err != nil {
		return nil, err
	}

	cacheKey := fmt.Sprintf("person:%s:statistics", personID)

	// Try to get from cache first
	var cached string
	if err := s.cache.Get(context.Background(), cacheKey, &cached); err == nil && cached != "" {
		var stats models.PersonStatistics
		if json.Unmarshal([]byte(cached), &stats) == nil {
			return &stats, nil
		}
	}

	// Get statistics from database
	stats, err := s.db.GetPersonStatistics(personID)
	if err != nil {
		return nil, fmt.Errorf("failed to get person statistics: %w", err)
	}

	// Cache the result
	if data, err := json.Marshal(stats); err == nil {
		s.cache.Set(context.Background(), cacheKey, string(data), 5*time.Minute)
	}

	return stats, nil
}

// GetLearningProgress returns learning progress for a person
func (s *PersonService) GetLearningProgress(userID, personID string) (*models.LearningProgress, error) {
	// Verify ownership
	_, err := s.GetPerson(userID, personID)
	if err != nil {
		return nil, err
	}

	cacheKey := fmt.Sprintf("person:%s:progress", personID)

	// Try to get from cache first
	var cached string
	if err := s.cache.Get(context.Background(), cacheKey, &cached); err == nil && cached != "" {
		var progress models.LearningProgress
		if json.Unmarshal([]byte(cached), &progress) == nil {
			return &progress, nil
		}
	}

	// Get progress from database
	progress, err := s.db.GetLearningProgress(personID)
	if err != nil {
		return nil, fmt.Errorf("failed to get learning progress: %w", err)
	}

	// Cache the result
	if data, err := json.Marshal(progress); err == nil {
		s.cache.Set(context.Background(), cacheKey, string(data), 5*time.Minute)
	}

	return progress, nil
}

// invalidatePersonCache invalidates cache for a specific person
func (s *PersonService) invalidatePersonCache(personID string) {
	ctx := context.Background()
	s.cache.Delete(ctx, fmt.Sprintf("person:%s", personID))
	s.cache.Delete(ctx, fmt.Sprintf("person:%s:platforms", personID))
	s.cache.Delete(ctx, fmt.Sprintf("person:%s:statistics", personID))
	s.cache.Delete(ctx, fmt.Sprintf("person:%s:progress", personID))
}

// invalidateUserCache invalidates cache for a specific user
func (s *PersonService) invalidateUserCache(userID string) {
	ctx := context.Background()
	s.cache.Delete(ctx, fmt.Sprintf("user:%s:persons", userID))
}
