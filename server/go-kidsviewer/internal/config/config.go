package config

import (
	"fmt"
	"strings"

	"github.com/spf13/viper"
)

// Config represents the complete application configuration
type Config struct {
	Server     ServerConfig     `mapstructure:"server"`
	Logging    LoggingConfig    `mapstructure:"logging"`
	Database   DatabaseConfig   `mapstructure:"database"`
	Cache      CacheConfig      `mapstructure:"cache"`
	JWT        JWTConfig        `mapstructure:"jwt"`
	KidsViewer KidsViewerConfig `mapstructure:"kids-viewer"`
}

// ServerConfig contains HTTP server configuration
type ServerConfig struct {
	Address         string     `mapstructure:"address"`
	Port            int        `mapstructure:"port"`
	ReadTimeout     int        `mapstructure:"read-timeout"`     // seconds
	WriteTimeout    int        `mapstructure:"write-timeout"`    // seconds
	ShutdownTimeout int        `mapstructure:"shutdown-timeout"` // seconds
	CORS            CORSConfig `mapstructure:"cors"`
}

// CORSConfig contains CORS configuration
type CORSConfig struct {
	AllowOrigins     []string `mapstructure:"allow-origins"`
	AllowMethods     []string `mapstructure:"allow-methods"`
	AllowHeaders     []string `mapstructure:"allow-headers"`
	AllowCredentials bool     `mapstructure:"allow-credentials"`
	MaxAge           int      `mapstructure:"max-age"`
}

// LoggingConfig contains logging configuration
type LoggingConfig struct {
	RootLevel string            `mapstructure:"root-level"`
	Format    string            `mapstructure:"format"` // json or text
	Loggers   map[string]string `mapstructure:"loggers"`
}

// DatabaseConfig contains database configuration
type DatabaseConfig struct {
	Type     string             `mapstructure:"type"` // sqlite or postgres
	SQLite   SQLiteConfig       `mapstructure:"sqlite"`
	Postgres PostgresConfig     `mapstructure:"postgres"`
	Pool     DatabasePoolConfig `mapstructure:"pool"`
}

// SQLiteConfig contains SQLite-specific configuration
type SQLiteConfig struct {
	Path   string            `mapstructure:"path"`
	Pragma map[string]string `mapstructure:"pragma"`
}

// PostgresConfig contains PostgreSQL-specific configuration
type PostgresConfig struct {
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	Database string `mapstructure:"database"`
	Username string `mapstructure:"username"`
	Password string `mapstructure:"password"`
	SSLMode  string `mapstructure:"ssl-mode"`
	TimeZone string `mapstructure:"timezone"`
}

// DatabasePoolConfig contains database connection pool configuration
type DatabasePoolConfig struct {
	MaxOpenConns    int `mapstructure:"max-open-conns"`
	MaxIdleConns    int `mapstructure:"max-idle-conns"`
	ConnMaxLifetime int `mapstructure:"conn-max-lifetime"` // seconds
}

// CacheConfig contains cache configuration
type CacheConfig struct {
	Type   string      `mapstructure:"type"` // memory or redis
	Memory MemoryCache `mapstructure:"memory"`
	Redis  RedisConfig `mapstructure:"redis"`
}

// MemoryCache contains in-memory cache configuration
type MemoryCache struct {
	DefaultExpiration int `mapstructure:"default-expiration"` // minutes
	CleanupInterval   int `mapstructure:"cleanup-interval"`   // minutes
	MaxItems          int `mapstructure:"max-items"`
}

// RedisConfig contains Redis configuration
type RedisConfig struct {
	Username     string   `mapstructure:"username"`
	Password     string   `mapstructure:"password"`
	Servers      []string `mapstructure:"servers"` // host:port format
	Database     int      `mapstructure:"database"`
	PoolSize     int      `mapstructure:"pool-size"`
	MinIdleConns int      `mapstructure:"min-idle-conns"`
}

// JWTConfig contains JWT configuration
type JWTConfig struct {
	SecretKey       string `mapstructure:"secret-key"`
	ExpirationHours int    `mapstructure:"expiration-hours"`
	RefreshHours    int    `mapstructure:"refresh-hours"`
	Issuer          string `mapstructure:"issuer"`
}

// KidsViewerConfig contains application-specific configuration
type KidsViewerConfig struct {
	DefaultSessionTimeLimit int              `mapstructure:"default-session-time-limit"` // minutes
	DefaultDailyTimeLimit   int              `mapstructure:"default-daily-time-limit"`   // minutes
	DefaultQuestionCount    int              `mapstructure:"default-question-count"`
	MaxQuestionCount        int              `mapstructure:"max-question-count"`
	WatchingTokenExpiry     int              `mapstructure:"watching-token-expiry"`     // minutes
	SessionTimeoutMinutes   int              `mapstructure:"session-timeout-minutes"`   // minutes
	QuestionIntervalMinutes int              `mapstructure:"question-interval-minutes"` // minutes
	MaxQuestionsPerSession  int              `mapstructure:"max-questions-per-session"`
	Features                map[string]bool  `mapstructure:"features"`
	Platforms               []PlatformConfig `mapstructure:"platforms"`
}

// PlatformConfig contains platform-specific configuration
type PlatformConfig struct {
	ID          string   `mapstructure:"id"`
	NameEN      string   `mapstructure:"name-en"`
	NameCN      string   `mapstructure:"name-cn"`
	URL         string   `mapstructure:"url"`
	Description string   `mapstructure:"description"`
	AgeGroups   []string `mapstructure:"age-groups"`
	Enabled     bool     `mapstructure:"enabled"`
}

// Load loads configuration from various sources with priority:
// 1. Command line flags
// 2. Environment variables
// 3. Configuration file
// 4. Default values
func Load() (*Config, error) {
	viper.SetConfigName("application")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./config")
	viper.AddConfigPath("/etc/kidsviewer")

	// Set default values
	setDefaults()

	// Enable environment variables
	viper.SetEnvPrefix("KIDSVIEWER")
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_", "-", "_"))
	viper.AutomaticEnv()

	// Read configuration file if it exists
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("failed to read config file: %w", err)
		}
	}

	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	// Validate configuration
	if err := validate(&config); err != nil {
		return nil, fmt.Errorf("invalid configuration: %w", err)
	}

	return &config, nil
}

// setDefaults sets default configuration values
func setDefaults() {
	// Server defaults
	viper.SetDefault("server.address", "0.0.0.0")
	viper.SetDefault("server.port", 9988)
	viper.SetDefault("server.read-timeout", 30)
	viper.SetDefault("server.write-timeout", 30)
	viper.SetDefault("server.shutdown-timeout", 30)
	viper.SetDefault("server.cors.allow-origins", []string{"*"})
	viper.SetDefault("server.cors.allow-methods", []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"})
	viper.SetDefault("server.cors.allow-headers", []string{"*"})
	viper.SetDefault("server.cors.allow-credentials", true)
	viper.SetDefault("server.cors.max-age", 86400)

	// Logging defaults
	viper.SetDefault("logging.root-level", "INFO")
	viper.SetDefault("logging.format", "json")

	// Database defaults
	viper.SetDefault("database.type", "sqlite")
	viper.SetDefault("database.sqlite.path", "./data/kidsviewer.db")
	viper.SetDefault("database.sqlite.pragma.journal_mode", "WAL")
	viper.SetDefault("database.sqlite.pragma.synchronous", "NORMAL")
	viper.SetDefault("database.sqlite.pragma.foreign_keys", "ON")
	viper.SetDefault("database.postgres.host", "localhost")
	viper.SetDefault("database.postgres.port", 5432)
	viper.SetDefault("database.postgres.database", "kidsviewer")
	viper.SetDefault("database.postgres.username", "kidsviewer")
	viper.SetDefault("database.postgres.password", "password")
	viper.SetDefault("database.postgres.ssl-mode", "disable")
	viper.SetDefault("database.postgres.timezone", "UTC")
	viper.SetDefault("database.pool.max-open-conns", 25)
	viper.SetDefault("database.pool.max-idle-conns", 25)
	viper.SetDefault("database.pool.conn-max-lifetime", 300)

	// Cache defaults
	viper.SetDefault("cache.type", "memory")
	viper.SetDefault("cache.memory.default-expiration", 60)
	viper.SetDefault("cache.memory.cleanup-interval", 10)
	viper.SetDefault("cache.memory.max-items", 1000)
	viper.SetDefault("cache.redis.database", 0)
	viper.SetDefault("cache.redis.pool-size", 10)
	viper.SetDefault("cache.redis.min-idle-conns", 5)

	// JWT defaults
	viper.SetDefault("jwt.secret-key", "your-secret-key-change-in-production")
	viper.SetDefault("jwt.expiration-hours", 24)
	viper.SetDefault("jwt.refresh-hours", 168) // 7 days
	viper.SetDefault("jwt.issuer", "kidsviewer-server")

	// KidsViewer defaults
	viper.SetDefault("kids-viewer.default-session-time-limit", 30)
	viper.SetDefault("kids-viewer.default-daily-time-limit", 120)
	viper.SetDefault("kids-viewer.default-question-count", 3)
	viper.SetDefault("kids-viewer.max-question-count", 10)
	viper.SetDefault("kids-viewer.watching-token-expiry", 60)
	viper.SetDefault("kids-viewer.session-timeout-minutes", 60)
	viper.SetDefault("kids-viewer.question-interval-minutes", 10)
	viper.SetDefault("kids-viewer.max-questions-per-session", 5)
	viper.SetDefault("kids-viewer.features.question-templates", true)
	viper.SetDefault("kids-viewer.features.platform-management", true)
	viper.SetDefault("kids-viewer.features.analytics", true)
}

// validate validates the configuration
func validate(config *Config) error {
	// Validate server configuration
	if config.Server.Port <= 0 || config.Server.Port > 65535 {
		return fmt.Errorf("invalid server port: %d", config.Server.Port)
	}

	// Validate database configuration
	if config.Database.Type != "sqlite" && config.Database.Type != "postgres" {
		return fmt.Errorf("unsupported database type: %s", config.Database.Type)
	}

	// Validate cache configuration
	if config.Cache.Type != "memory" && config.Cache.Type != "redis" {
		return fmt.Errorf("unsupported cache type: %s", config.Cache.Type)
	}

	// Validate JWT configuration
	if len(config.JWT.SecretKey) < 32 {
		return fmt.Errorf("JWT secret key must be at least 32 characters long")
	}

	return nil
}
