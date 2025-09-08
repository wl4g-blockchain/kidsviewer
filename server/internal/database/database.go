package database

import (
	"fmt"
	"kidsviewer-server/internal/config"
	"kidsviewer-server/internal/models"
	"log"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
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
		dsn := cfg.Database.SQLite.Path
		db, err = gorm.Open(sqlite.Open(dsn), gormConfig)
		if err != nil {
			return nil, fmt.Errorf("failed to connect to SQLite database: %w", err)
		}

		// Apply SQLite pragmas
		for pragma, value := range cfg.Database.SQLite.Pragma {
			if err := db.Exec(fmt.Sprintf("PRAGMA %s = %s", pragma, value)).Error; err != nil {
				log.Printf("Warning: failed to set PRAGMA %s: %v", pragma, err)
			}
		}

	case "postgres":
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
		db, err = gorm.Open(postgres.Open(dsn), gormConfig)
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

	// Auto-migrate the schema
	if err := database.AutoMigrate(); err != nil {
		return nil, fmt.Errorf("failed to auto-migrate database: %w", err)
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

// SeedData seeds the database with initial data
func (d *Database) SeedData() error {
	// Seed default platforms
	platforms := []models.Platform{
		{
			NameEN:      "National Geographic Kids",
			NameCN:      "国家地理儿童版",
			URL:         "https://kids.nationalgeographic.com/",
			Description: "Explore nature, science, and world cultures",
			AgeGroups:   []string{"young", "older"},
			Enabled:     true,
		},
		{
			NameEN:      "Khan Academy Kids",
			NameCN:      "可汗学院儿童版",
			URL:         "https://www.khanacademy.org/kids",
			Description: "Educational games and videos for young learners",
			AgeGroups:   []string{"preschool", "young"},
			Enabled:     true,
		},
		{
			NameEN:      "YouTube Kids",
			NameCN:      "YouTube 儿童版",
			URL:         "https://www.youtubekids.com/",
			Description: "Safe, educational videos curated for children",
			AgeGroups:   []string{"young", "older"},
			Enabled:     true,
		},
	}

	for _, platform := range platforms {
		var existing models.Platform
		result := d.DB.Where("url = ?", platform.URL).First(&existing)
		if result.Error == gorm.ErrRecordNotFound {
			if err := d.DB.Create(&platform).Error; err != nil {
				return fmt.Errorf("failed to seed platform %s: %w", platform.NameEN, err)
			}
		}
	}

	// Seed question templates
	questionTemplates := []models.QuestionTemplate{
		{
			Type:          "calculation",
			Subject:       "math",
			Difficulty:    "beginner",
			Content:       "What is 2 + 3?",
			CorrectAnswer: "5",
			ExplanationEN: "2 + 3 = 5. This is basic addition.",
			ExplanationCN: "2 + 3 = 5。这是基本的加法。",
			Language:      "en",
			AgeGroups:     []string{"preschool", "young"},
			Tags:          []string{"math", "addition", "beginner"},
			Enabled:       true,
		},
		{
			Type:          "multiple-choice",
			Subject:       "english",
			Difficulty:    "easy",
			Content:       "What color is the sky?",
			Options:       []string{"Blue", "Green", "Red", "Yellow"},
			CorrectAnswer: "Blue",
			ExplanationEN: "The sky is usually blue during the day due to light scattering.",
			ExplanationCN: "天空通常是蓝色的，因为光线散射。",
			Language:      "en",
			AgeGroups:     []string{"preschool", "young"},
			Tags:          []string{"english", "colors", "easy"},
			Enabled:       true,
		},
	}

	for _, template := range questionTemplates {
		var existing models.QuestionTemplate
		result := d.DB.Where("content = ? AND subject = ?", template.Content, template.Subject).First(&existing)
		if result.Error == gorm.ErrRecordNotFound {
			if err := d.DB.Create(&template).Error; err != nil {
				return fmt.Errorf("failed to seed question template: %w", err)
			}
		}
	}

	log.Println("Database seeded successfully")
	return nil
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
