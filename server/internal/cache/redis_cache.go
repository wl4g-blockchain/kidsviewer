package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"kidsviewer-server/internal/config"
	"time"

	"github.com/redis/go-redis/v9"
)

// RedisCache implements Cache using Redis
type RedisCache struct {
	client redis.Cmdable
}

// NewRedisCache creates a new Redis cache
func NewRedisCache(cfg *config.Config) (*RedisCache, error) {
	var client redis.Cmdable

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
		})
	}

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	return &RedisCache{client: client}, nil
}

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
	// Check if client is a closeable type
	if closer, ok := r.client.(interface{ Close() error }); ok {
		return closer.Close()
	}
	return nil
}
