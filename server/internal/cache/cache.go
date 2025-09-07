package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"kidsviewer-server/internal/config"
	"strings"
	"time"

	"github.com/patrickmn/go-cache"
	"github.com/redis/go-redis/v9"
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

// MemoryCache implements Cache using in-memory storage
type MemoryCache struct {
	cache *cache.Cache
}

// RedisCache implements Cache using Redis
type RedisCache struct {
	client *redis.Client
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

// NewMemoryCache creates a new in-memory cache
func NewMemoryCache(cfg *config.Config) *MemoryCache {
	defaultExpiration := time.Duration(cfg.Cache.Memory.DefaultExpiration) * time.Minute
	cleanupInterval := time.Duration(cfg.Cache.Memory.CleanupInterval) * time.Minute

	c := cache.New(defaultExpiration, cleanupInterval)

	return &MemoryCache{
		cache: c,
	}
}

// NewRedisCache creates a new Redis cache
func NewRedisCache(cfg *config.Config) (*RedisCache, error) {
	var client *redis.Client

	if len(cfg.Cache.Redis.Servers) == 1 {
		// Single Redis instance
		client = redis.NewClient(&redis.Options{
			Addr:         cfg.Cache.Redis.Servers[0],
			Username:     cfg.Cache.Redis.Username,
			Password:     cfg.Cache.Redis.Password,
			DB:           cfg.Cache.Redis.Database,
			PoolSize:     cfg.Cache.Redis.PoolSize,
			MinIdleConns: cfg.Cache.Redis.MinIdleConns,
		})
	} else {
		// Redis cluster
		client = redis.NewClusterClient(&redis.ClusterOptions{
			Addrs:        cfg.Cache.Redis.Servers,
			Username:     cfg.Cache.Redis.Username,
			Password:     cfg.Cache.Redis.Password,
			PoolSize:     cfg.Cache.Redis.PoolSize,
			MinIdleConns: cfg.Cache.Redis.MinIdleConns,
		}).(*redis.Client)
	}

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	return &RedisCache{client: client}, nil
}

// Memory Cache Implementation

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

// Redis Cache Implementation

func (r *RedisCache) Get(ctx context.Context, key string, dest interface{}) error {
	value, err := r.client.Get(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return fmt.Errorf("key not found: %s", key)
		}
		return fmt.Errorf("failed to get key %s: %w", key, err)
	}

	// If dest is a pointer to string, set it directly
	if strPtr, ok := dest.(*string); ok {
		*strPtr = value
		return nil
	}

	// For other types, unmarshal JSON
	if err := json.Unmarshal([]byte(value), dest); err != nil {
		return fmt.Errorf("failed to unmarshal cached value: %w", err)
	}

	return nil
}

func (r *RedisCache) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	var jsonValue string

	// If value is already a string, use it directly
	if str, ok := value.(string); ok {
		jsonValue = str
	} else {
		// Marshal to JSON
		jsonBytes, err := json.Marshal(value)
		if err != nil {
			return fmt.Errorf("failed to marshal value: %w", err)
		}
		jsonValue = string(jsonBytes)
	}

	if err := r.client.Set(ctx, key, jsonValue, expiration).Err(); err != nil {
		return fmt.Errorf("failed to set key %s: %w", key, err)
	}

	return nil
}

func (r *RedisCache) Delete(ctx context.Context, key string) error {
	if err := r.client.Del(ctx, key).Err(); err != nil {
		return fmt.Errorf("failed to delete key %s: %w", key, err)
	}
	return nil
}

func (r *RedisCache) Exists(ctx context.Context, key string) (bool, error) {
	result, err := r.client.Exists(ctx, key).Result()
	if err != nil {
		return false, fmt.Errorf("failed to check key existence %s: %w", key, err)
	}
	return result > 0, nil
}

func (r *RedisCache) Clear(ctx context.Context) error {
	if err := r.client.FlushDB(ctx).Err(); err != nil {
		return fmt.Errorf("failed to clear cache: %w", err)
	}
	return nil
}

func (r *RedisCache) Health(ctx context.Context) error {
	return r.client.Ping(ctx).Err()
}

func (r *RedisCache) Close() error {
	return r.client.Close()
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
