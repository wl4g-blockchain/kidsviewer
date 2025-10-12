package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"kidsviewer-server/internal/config"
	"time"

	"github.com/patrickmn/go-cache"
)

// MemoryCache implements Cache using in-memory storage
type MemoryCache struct {
	cache *cache.Cache
}

// NewMemoryCache creates a new in-memory cache
func NewMemoryCache(cfg *config.Config) *MemoryCache {
	defaultExpiration := time.Duration(cfg.Cache.Memory.DefaultExpiration) * time.Minute
	cleanupInterval := time.Duration(cfg.Cache.Memory.CleanupInterval) * time.Minute

	c := cache.New(defaultExpiration, cleanupInterval)

	return &MemoryCache{
		cache: c,
	}
}

func (m *MemoryCache) Get(ctx context.Context, key string, dest interface{}) error {
	value, found := m.cache.Get(key)
	if !found {
		return fmt.Errorf("key not found: %s", key)
	}

	// If dest is a pointer to string, set it directly
	if strPtr, ok := dest.(*string); ok {
		if str, ok := value.(string); ok {
			*strPtr = str
			return nil
		}
	}

	// For other types, use JSON marshaling/unmarshaling
	jsonBytes, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to marshal cached value: %w", err)
	}

	if err := json.Unmarshal(jsonBytes, dest); err != nil {
		return fmt.Errorf("failed to unmarshal cached value: %w", err)
	}

	return nil
}

func (m *MemoryCache) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	if expiration == 0 {
		expiration = cache.DefaultExpiration
	}
	m.cache.Set(key, value, expiration)
	return nil
}

func (m *MemoryCache) Delete(ctx context.Context, key string) error {
	m.cache.Delete(key)
	return nil
}

func (m *MemoryCache) Exists(ctx context.Context, key string) (bool, error) {
	_, found := m.cache.Get(key)
	return found, nil
}

func (m *MemoryCache) Clear(ctx context.Context) error {
	m.cache.Flush()
	return nil
}

func (m *MemoryCache) Health(ctx context.Context) error {
	// Memory cache is always healthy if it exists
	return nil
}

func (m *MemoryCache) Close() error {
	// Memory cache doesn't need explicit closing
	return nil
}
