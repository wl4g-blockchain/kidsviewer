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

// PlatformService handles platform-related business logic
type PlatformService struct {
	db    *database.Database
	cache cache.Cache
}

// NewPlatformService creates a new platform service
func NewPlatformService(db *database.Database, cache cache.Cache) *PlatformService {
	return &PlatformService{
		db:    db,
		cache: cache,
	}
}

// GetPlatforms retrieves all platforms
func (s *PlatformService) GetPlatforms(ctx context.Context) ([]models.Platform, error) {
	// Try cache first
	cacheKey := cache.CacheKey(cache.PlatformPrefix, "all")
	var cachedPlatforms []models.Platform
	if err := s.cache.Get(ctx, cacheKey, &cachedPlatforms); err == nil {
		return cachedPlatforms, nil
	}

	// Load from database
	var platforms []models.Platform
	if err := s.db.DB.Where("enabled = ?", true).Find(&platforms).Error; err != nil {
		return nil, fmt.Errorf("failed to get platforms: %w", err)
	}

	// Cache for future requests
	if err := s.cache.Set(ctx, cacheKey, platforms, 30*time.Minute); err != nil {
		fmt.Printf("Warning: failed to cache platforms: %v\n", err)
	}

	return platforms, nil
}

// GetPlatform retrieves a platform by ID
func (s *PlatformService) GetPlatform(ctx context.Context, id uint) (*models.Platform, error) {
	// Try cache first
	cacheKey := cache.CacheKey(cache.PlatformPrefix, strconv.FormatUint(uint64(id), 10))
	var cachedPlatform models.Platform
	if err := s.cache.Get(ctx, cacheKey, &cachedPlatform); err == nil {
		return &cachedPlatform, nil
	}

	// Load from database
	var platform models.Platform
	if err := s.db.DB.First(&platform, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("platform not found")
		}
		return nil, fmt.Errorf("failed to get platform: %w", err)
	}

	// Cache for future requests
	if err := s.cache.Set(ctx, cacheKey, &platform, 30*time.Minute); err != nil {
		fmt.Printf("Warning: failed to cache platform: %v\n", err)
	}

	return &platform, nil
}

// CreatePlatform creates a new platform
func (s *PlatformService) CreatePlatform(ctx context.Context, platform *models.Platform) (*models.Platform, error) {
	if err := s.db.DB.Create(platform).Error; err != nil {
		return nil, fmt.Errorf("failed to create platform: %w", err)
	}

	// Invalidate cache
	s.invalidateCache(ctx)

	return platform, nil
}

// UpdatePlatform updates an existing platform
func (s *PlatformService) UpdatePlatform(ctx context.Context, id uint, updates *models.Platform) (*models.Platform, error) {
	var platform models.Platform
	if err := s.db.DB.First(&platform, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("platform not found")
		}
		return nil, fmt.Errorf("failed to find platform: %w", err)
	}

	if err := s.db.DB.Model(&platform).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("failed to update platform: %w", err)
	}

	// Invalidate cache
	s.invalidateCache(ctx)

	return &platform, nil
}

// DeletePlatform deletes a platform
func (s *PlatformService) DeletePlatform(ctx context.Context, id uint) error {
	if err := s.db.DB.Delete(&models.Platform{}, id).Error; err != nil {
		return fmt.Errorf("failed to delete platform: %w", err)
	}

	// Invalidate cache
	s.invalidateCache(ctx)

	return nil
}

// invalidateCache invalidates platform-related cache entries
func (s *PlatformService) invalidateCache(ctx context.Context) {
	// Delete all platforms cache
	cacheKey := cache.CacheKey(cache.PlatformPrefix, "all")
	if err := s.cache.Delete(ctx, cacheKey); err != nil {
		fmt.Printf("Warning: failed to invalidate platforms cache: %v\n", err)
	}
}
