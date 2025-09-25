package migration

import (
	"database/sql"
	"fmt"
	"io/fs"
	"kidsviewer-server/internal/config"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"gorm.io/gorm"
)

// Migration represents a database migration
type Migration struct {
	Version   string
	Type      string // "ddl" or "dml"
	Filename  string
	Content   string
	AppliedAt *time.Time
}

// MigrationManager handles database migrations
type MigrationManager struct {
	db     *gorm.DB
	config *config.Config
}

// NewMigrationManager creates a new migration manager
func NewMigrationManager(db *gorm.DB, cfg *config.Config) *MigrationManager {
	return &MigrationManager{
		db:     db,
		config: cfg,
	}
}

// RunMigrations executes all pending migrations
func (m *MigrationManager) RunMigrations() error {
	// Create migrations table if it doesn't exist
	if err := m.createMigrationsTable(); err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}

	// Get applied migrations
	appliedMigrations, err := m.getAppliedMigrations()
	if err != nil {
		return fmt.Errorf("failed to get applied migrations: %w", err)
	}

	// Get available migrations
	availableMigrations, err := m.getAvailableMigrations()
	if err != nil {
		return fmt.Errorf("failed to get available migrations: %w", err)
	}

	// Find pending migrations
	pendingMigrations := m.findPendingMigrations(availableMigrations, appliedMigrations)

	if len(pendingMigrations) == 0 {
		log.Println("No pending migrations found")
		return nil
	}

	// Execute pending migrations
	for _, migration := range pendingMigrations {
		if err := m.executeMigration(migration); err != nil {
			return fmt.Errorf("failed to execute migration %s: %w", migration.Version, err)
		}
		log.Printf("Applied migration: %s", migration.Version)
	}

	log.Printf("Successfully applied %d migrations", len(pendingMigrations))
	return nil
}

// createMigrationsTable creates the migrations tracking table
func (m *MigrationManager) createMigrationsTable() error {
	createTableSQL := `
	CREATE TABLE IF NOT EXISTS schema_migrations (
		version VARCHAR(255) PRIMARY KEY,
		type VARCHAR(10) NOT NULL,
		filename VARCHAR(255) NOT NULL,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)`

	return m.db.Exec(createTableSQL).Error
}

// getAppliedMigrations returns a list of already applied migrations
func (m *MigrationManager) getAppliedMigrations() (map[string]bool, error) {
	var migrations []struct {
		Version string `gorm:"column:version"`
	}

	if err := m.db.Table("schema_migrations").Select("version").Find(&migrations).Error; err != nil {
		return nil, err
	}

	applied := make(map[string]bool)
	for _, migration := range migrations {
		applied[migration.Version] = true
	}

	return applied, nil
}

// getAvailableMigrations scans the migrations directory for available migrations
func (m *MigrationManager) getAvailableMigrations() ([]Migration, error) {
	var migrations []Migration

	// Determine the database type and set the appropriate path
	var migrationPath string
	switch m.config.Database.Type {
	case "postgres":
		migrationPath = "migrations/postgres"
	case "sqlite":
		migrationPath = "migrations/sqlite"
	default:
		return nil, fmt.Errorf("unsupported database type: %s", m.config.Database.Type)
	}

	// Walk through the migration directory
	err := filepath.WalkDir(migrationPath, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if d.IsDir() {
			return nil
		}

		// Check if it's a SQL file
		if !strings.HasSuffix(path, ".sql") {
			return nil
		}

		// Parse the path to extract version and type
		relPath, err := filepath.Rel(migrationPath, path)
		if err != nil {
			return err
		}

		parts := strings.Split(relPath, "/")
		if len(parts) < 2 {
			return nil
		}

		version := parts[0]
		filename := parts[1]

		// Determine migration type from filename
		var migrationType string
		if strings.Contains(filename, ".ddl.") {
			migrationType = "ddl"
		} else if strings.Contains(filename, ".dml.") {
			migrationType = "dml"
		} else {
			return nil
		}

		// Read the migration content
		content, err := os.ReadFile(path)
		if err != nil {
			return err
		}

		migration := Migration{
			Version:  version,
			Type:     migrationType,
			Filename: filename,
			Content:  string(content),
		}

		migrations = append(migrations, migration)
		return nil
	})

	if err != nil {
		return nil, err
	}

	// Sort migrations by version and type
	sort.Slice(migrations, func(i, j int) bool {
		if migrations[i].Version != migrations[j].Version {
			return migrations[i].Version < migrations[j].Version
		}
		// DDL migrations should run before DML migrations
		return migrations[i].Type < migrations[j].Type
	})

	return migrations, nil
}

// findPendingMigrations finds migrations that haven't been applied yet
func (m *MigrationManager) findPendingMigrations(available []Migration, applied map[string]bool) []Migration {
	var pending []Migration

	for _, migration := range available {
		key := fmt.Sprintf("%s_%s", migration.Version, migration.Type)
		if !applied[key] {
			pending = append(pending, migration)
		}
	}

	return pending
}

// executeMigration executes a single migration
func (m *MigrationManager) executeMigration(migration Migration) error {
	// Start a transaction
	tx := m.db.Begin()
	if tx.Error != nil {
		return tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Execute the migration SQL
	if err := tx.Exec(migration.Content).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Record the migration as applied
	key := fmt.Sprintf("%s_%s", migration.Version, migration.Type)
	recordSQL := `
		INSERT INTO schema_migrations (version, type, filename, applied_at) 
		VALUES (?, ?, ?, ?)
	`

	if err := tx.Exec(recordSQL, key, migration.Type, migration.Filename, time.Now()).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Commit the transaction
	return tx.Commit().Error
}

// GetMigrationStatus returns the current migration status
func (m *MigrationManager) GetMigrationStatus() ([]Migration, error) {
	var migrations []Migration

	// Get applied migrations from database
	rows, err := m.db.Raw(`
		SELECT version, type, filename, applied_at 
		FROM schema_migrations 
		ORDER BY applied_at
	`).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var migration Migration
		var appliedAt sql.NullTime

		if err := rows.Scan(&migration.Version, &migration.Type, &migration.Filename, &appliedAt); err != nil {
			return nil, err
		}

		if appliedAt.Valid {
			migration.AppliedAt = &appliedAt.Time
		}

		migrations = append(migrations, migration)
	}

	return migrations, nil
}
