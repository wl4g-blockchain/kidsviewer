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

// SettingsService handles application settings business logic
type SettingsService struct {
	db    *database.Database
	cache cache.Cache
}

// NewSettingsService creates a new settings service
func NewSettingsService(db *database.Database, cache cache.Cache) *SettingsService {
	return &SettingsService{
		db:    db,
		cache: cache,
	}
}

// GetAppSettings retrieves application settings for a user
func (s *SettingsService) GetAppSettings(ctx context.Context, userID uint) (*models.AppSettings, error) {
	// Try cache first
	cacheKey := cache.CacheKey(cache.SettingsPrefix, strconv.FormatUint(uint64(userID), 10))
	var cachedSettings models.AppSettings
	if err := s.cache.Get(ctx, cacheKey, &cachedSettings); err == nil {
		return &cachedSettings, nil
	}

	// Load from database
	var settings models.AppSettings
	err := s.db.DB.Where("user_id = ?", userID).First(&settings).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// Create default settings
			settings = models.AppSettings{
				UserID:   userID,
				Language: "en",
				Theme:    "light",
				Settings: make(map[string]interface{}),
			}

			if err := s.db.DB.Create(&settings).Error; err != nil {
				return nil, fmt.Errorf("failed to create default settings: %w", err)
			}
		} else {
			return nil, fmt.Errorf("failed to get app settings: %w", err)
		}
	}

	// Cache for future requests
	if err := s.cache.Set(ctx, cacheKey, &settings, 30*time.Minute); err != nil {
		fmt.Printf("Warning: failed to cache settings: %v\n", err)
	}

	return &settings, nil
}

// UpdateAppSettings updates application settings for a user
func (s *SettingsService) UpdateAppSettings(ctx context.Context, userID uint, updates *models.AppSettings) (*models.AppSettings, error) {
	var settings models.AppSettings
	err := s.db.DB.Where("user_id = ?", userID).First(&settings).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// Create new settings
			updates.UserID = userID
			if err := s.db.DB.Create(updates).Error; err != nil {
				return nil, fmt.Errorf("failed to create settings: %w", err)
			}
			settings = *updates
		} else {
			return nil, fmt.Errorf("failed to find settings: %w", err)
		}
	} else {
		// Update existing settings
		if updates.Language != "" {
			settings.Language = updates.Language
		}
		if updates.Theme != "" {
			settings.Theme = updates.Theme
		}
		if updates.Settings != nil {
			settings.Settings = updates.Settings
		}

		if err := s.db.DB.Save(&settings).Error; err != nil {
			return nil, fmt.Errorf("failed to update settings: %w", err)
		}
	}

	// Update cache
	cacheKey := cache.CacheKey(cache.SettingsPrefix, strconv.FormatUint(uint64(userID), 10))
	if err := s.cache.Set(ctx, cacheKey, &settings, 30*time.Minute); err != nil {
		fmt.Printf("Warning: failed to update cached settings: %v\n", err)
	}

	return &settings, nil
}

// GetAppInfo returns application information
func (s *SettingsService) GetAppInfo(ctx context.Context) (*models.AppInfo, error) {
	// This could be cached or loaded from build-time configuration
	appInfo := &models.AppInfo{
		Version:   "1.0.0",
		BuildType: "development",
		Platform:  "server",
		BuildDate: "2024-01-01",
	}

	return appInfo, nil
}

// DeleteAppSettings deletes application settings for a user
func (s *SettingsService) DeleteAppSettings(ctx context.Context, userID uint) error {
	if err := s.db.DB.Where("user_id = ?", userID).Delete(&models.AppSettings{}).Error; err != nil {
		return fmt.Errorf("failed to delete settings: %w", err)
	}

	// Remove from cache
	cacheKey := cache.CacheKey(cache.SettingsPrefix, strconv.FormatUint(uint64(userID), 10))
	if err := s.cache.Delete(ctx, cacheKey); err != nil {
		fmt.Printf("Warning: failed to remove settings from cache: %v\n", err)
	}

	return nil
}
