package main

import (
	"kidsviewer-server/internal/config"
	"kidsviewer-server/internal/database"
	"kidsviewer-server/internal/migration"
	"log"

	"github.com/spf13/cobra"
)

var migrateCmd = &cobra.Command{
	Use:   "migrate",
	Short: "Database migration commands",
	Long:  "Commands for managing database migrations",
}

var migrateUpCmd = &cobra.Command{
	Use:   "up",
	Short: "Run all pending migrations",
	Long:  "Execute all pending database migrations",
	Run: func(cmd *cobra.Command, args []string) {
		runMigrations()
	},
}

var migrateStatusCmd = &cobra.Command{
	Use:   "status",
	Short: "Show migration status",
	Long:  "Display the current status of database migrations",
	Run: func(cmd *cobra.Command, args []string) {
		showMigrationStatus()
	},
}

func init() {
	rootCmd.AddCommand(migrateCmd)
	migrateCmd.AddCommand(migrateUpCmd)
	migrateCmd.AddCommand(migrateStatusCmd)
}

func runMigrations() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Connect to database
	db, err := database.New(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Run migrations
	migrationManager := migration.NewMigrationManager(db.DB, cfg)
	if err := migrationManager.RunMigrations(); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	log.Println("Migrations completed successfully")
}

func showMigrationStatus() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Connect to database
	db, err := database.New(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Get migration status
	migrationManager := migration.NewMigrationManager(db.DB, cfg)
	migrations, err := migrationManager.GetMigrationStatus()
	if err != nil {
		log.Fatalf("Failed to get migration status: %v", err)
	}

	if len(migrations) == 0 {
		log.Println("No migrations found")
		return
	}

	log.Println("Migration Status:")
	log.Println("=================")
	for _, migration := range migrations {
		status := "PENDING"
		if migration.AppliedAt != nil {
			status = "APPLIED"
		}
		log.Printf("%s | %s | %s | %s", status, migration.Version, migration.Type, migration.Filename)
	}
}
