package cache

import (
	"context"
	"fmt"
	"kidsviewer-server/internal/config"
	"strings"
	"time"
)

// Cache defines the cache interface
type Cache interface {
	Get(ctx context.Context, key string, dest interface{}) error
	Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error
	Delete(ctx context.Context, key string) error
	Exists(ctx context.Context, key string) (bool, error)
	Clear(ctx context.Context) error
	Health(ctx context.Context) error
	Close() error
}

// NewCache creates a new cache instance based on configuration
func NewCache(cfg *config.Config) (Cache, error) {
	switch cfg.Cache.Type {
	case "memory":
		return NewMemoryCache(cfg), nil
	case "redis":
		return NewRedisCache(cfg)
	default:
		return nil, fmt.Errorf("unsupported cache type: %s", cfg.Cache.Type)
	}
}

// Utility functions for common cache patterns

// CacheKey generates a cache key with prefix
func CacheKey(prefix string, parts ...string) string {
	key := prefix
	if len(parts) > 0 {
		key += ":" + strings.Join(parts, ":")
	}
	return key
}

// CacheKeyWithTTL generates a cache key and returns a default TTL
func CacheKeyWithTTL(prefix string, ttl time.Duration, parts ...string) (string, time.Duration) {
	return CacheKey(prefix, parts...), ttl
}

// Common cache key prefixes
const (
	UserPrefix          = "user"
	SessionPrefix       = "session"
	WatchingTokenPrefix = "watching_token"
	QuestionPrefix      = "question"
	PlatformPrefix      = "platform"
	SettingsPrefix      = "settings"
	StatsPrefix         = "stats"
)
