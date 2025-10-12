package database

import (
	"fmt"
	"kidsviewer-server/internal/config"
	"log"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// NewSQLiteDatabase creates a new SQLite database connection
func NewSQLiteDatabase(cfg *config.Config, gormConfig *gorm.Config) (*gorm.DB, error) {
	dsn := cfg.Database.SQLite.Path
	db, err := gorm.Open(sqlite.Open(dsn), gormConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to SQLite database: %w", err)
	}

	// Apply SQLite pragmas
	for pragma, value := range cfg.Database.SQLite.Pragma {
		if err := db.Exec(fmt.Sprintf("PRAGMA %s = %s", pragma, value)).Error; err != nil {
			log.Printf("Warning: failed to set PRAGMA %s: %v", pragma, err)
		}
	}

	return db, nil
}
