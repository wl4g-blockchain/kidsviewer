package database

import (
	"fmt"
	"kidsviewer-server/internal/config"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// NewPostgresDatabase creates a new PostgreSQL database connection
func NewPostgresDatabase(cfg *config.Config, gormConfig *gorm.Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s TimeZone=%s",
		cfg.Database.Postgres.Host,
		cfg.Database.Postgres.Port,
		cfg.Database.Postgres.Username,
		cfg.Database.Postgres.Password,
		cfg.Database.Postgres.Database,
		cfg.Database.Postgres.SSLMode,
		cfg.Database.Postgres.TimeZone,
	)
	db, err := gorm.Open(postgres.Open(dsn), gormConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to PostgreSQL database: %w", err)
	}

	return db, nil
}
