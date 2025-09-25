package database

import (
	"fmt"
	"kidsviewer-server/internal/config"
	"kidsviewer-server/internal/migration"
	"kidsviewer-server/internal/models"
	"log"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Database wraps the GORM database connection
type Database struct {
	DB *gorm.DB
}

// New creates a new database connection based on configuration
func New(cfg *config.Config) (*Database, error) {
	var db *gorm.DB
	var err error

	// Configure GORM logger
	gormLogger := logger.Default
	if cfg.Logging.RootLevel == "DEBUG" {
		gormLogger = logger.Default.LogMode(logger.Info)
	} else {
		gormLogger = logger.Default.LogMode(logger.Silent)
	}

	gormConfig := &gorm.Config{
		Logger: gormLogger,
		NowFunc: func() time.Time {
			return time.Now().UTC()
		},
	}

	switch cfg.Database.Type {
	case "sqlite":
		db, err = NewSQLiteDatabase(cfg, gormConfig)
		if err != nil {
			return nil, fmt.Errorf("failed to connect to SQLite database: %w", err)
		}
	case "postgres":
		db, err = NewPostgresDatabase(cfg, gormConfig)
		if err != nil {
			return nil, fmt.Errorf("failed to connect to PostgreSQL database: %w", err)
		}
	default:
		return nil, fmt.Errorf("unsupported database type: %s", cfg.Database.Type)
	}

	// Configure connection pool
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get database instance: %w", err)
	}

	sqlDB.SetMaxOpenConns(cfg.Database.Pool.MaxOpenConns)
	sqlDB.SetMaxIdleConns(cfg.Database.Pool.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(time.Duration(cfg.Database.Pool.ConnMaxLifetime) * time.Second)

	// Test the connection
	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	database := &Database{DB: db}

	// Run database migrations
	migrationManager := migration.NewMigrationManager(db, cfg)
	if err := migrationManager.RunMigrations(); err != nil {
		return nil, fmt.Errorf("failed to run database migrations: %w", err)
	}

	log.Printf("Successfully connected to %s database", cfg.Database.Type)
	return database, nil
}

// AutoMigrate runs database migrations for all models
func (d *Database) AutoMigrate() error {
	return d.DB.AutoMigrate(
		&models.Parental{},
		&models.Person{},
		&models.Platform{},
		&models.QuestionTemplate{},
		&models.WatchingSession{},
		&models.AppSettings{},
	)
}

// Close closes the database connection
func (d *Database) Close() error {
	sqlDB, err := d.DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// Health checks database connectivity
func (d *Database) Health() error {
	sqlDB, err := d.DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Ping()
}

// Transaction executes a function within a database transaction
func (d *Database) Transaction(fn func(*gorm.DB) error) error {
	return d.DB.Transaction(fn)
}

// Person-related database operations

// GetPersonsByUserID retrieves all persons for a specific user
func (d *Database) GetPersonsByUserID(userID string) ([]models.Person, error) {
	var persons []models.Person
	err := d.DB.Where("user_id = ?", userID).Find(&persons).Error
	return persons, err
}

// GetPersonByID retrieves a person by ID
func (d *Database) GetPersonByID(personID string) (*models.Person, error) {
	var person models.Person
	err := d.DB.Where("id = ?", personID).First(&person).Error
	if err != nil {
		return nil, err
	}
	return &person, nil
}

// CreatePerson creates a new person
func (d *Database) CreatePerson(person *models.Person) error {
	return d.DB.Create(person).Error
}

// UpdatePerson updates an existing person
func (d *Database) UpdatePerson(person *models.Person) error {
	return d.DB.Save(person).Error
}

// DeletePerson deletes a person by ID
func (d *Database) DeletePerson(personID string) error {
	return d.DB.Delete(&models.Person{}, "id = ?", personID).Error
}

// GetPlatformsByAgeGroup retrieves platforms suitable for an age group
func (d *Database) GetPlatformsByAgeGroup(ageGroup string) ([]models.Platform, error) {
	var platforms []models.Platform
	err := d.DB.Where("JSON_EXTRACT(age_groups, '$') LIKE ? AND enabled = ?", "%\""+ageGroup+"\"%", true).Find(&platforms).Error
	return platforms, err
}

// GetPersonStatistics retrieves statistics for a person
func (d *Database) GetPersonStatistics(personID string) (*models.PersonStatistics, error) {
	var person models.Person
	err := d.DB.Select("statistics").Where("id = ?", personID).First(&person).Error
	if err != nil {
		return nil, err
	}
	return &person.Statistics, nil
}

// GetLearningProgress retrieves learning progress for a person
func (d *Database) GetLearningProgress(personID string) (*models.LearningProgress, error) {
	var person models.Person
	err := d.DB.Select("statistics").Where("id = ?", personID).First(&person).Error
	if err != nil {
		return nil, err
	}
	return &person.Statistics.LearningProgress, nil
}
