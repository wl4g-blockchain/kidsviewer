package main

import (
	"context"
	"fmt"
	"kidsviewer-server/internal/config"
	"kidsviewer-server/internal/server"
	"kidsviewer-server/internal/utils"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/spf13/cobra"
)

var (
	cfgFile      string
	viperConfig  *utils.ViperConfigurer
	rootCmd = &cobra.Command{
		Use:   "kidsviewer-server",
		Short: "KidsViewer Server - A safe content viewing platform for children",
		Long: `KidsViewer Server is a comprehensive platform that provides safe content viewing
for children with parental controls, learning questions, and progress tracking.`,
		Run: runServer,
	}
)

func init() {
	cobra.OnInitialize(initConfig)

	// Global flags - only essential ones, detailed config should be in config file
	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is ./config.yaml)")
	rootCmd.PersistentFlags().String("server.address", "0.0.0.0", "server listen address")
	rootCmd.PersistentFlags().Int("server.port", 9988, "server listen port")
	rootCmd.PersistentFlags().String("logging.root-level", "INFO", "root logging level")
}

func initConfig() {
	// Initialize ViperConfigurer
	viperConfig = utils.NewViperConfigurer()
	viperConfig.SetEnvPrefix("KIDSVIEWER")

	// Define default config file if not specified
	defaultConfigFile := "./config.yaml"
	if cfgFile == "" {
		cfgFile = defaultConfigFile
	}

	// Create default config if it doesn't exist
	if !utils.ExistsFileOrDir(cfgFile) {
		log.Printf("Config file %s not found, using defaults", cfgFile)
		cfgFile = "" // Let the config loader use defaults
	}

	if cfgFile != "" {
		// Use the specified config file with default template
		defineConfigContent := getDefaultConfigTemplate()
		if err := viperConfig.SetConfig(defineConfigContent, cfgFile); err != nil {
			log.Printf("Warning: Failed to load config file %s: %v", cfgFile, err)
		} else {
			log.Printf("Using config file: %s", cfgFile)
		}
	}
}

// getDefaultConfigTemplate returns the default configuration template
func getDefaultConfigTemplate() string {
	return `# KidsViewer Server Configuration
server:
  address: "0.0.0.0"
  port: 9988
  cors:
    allow-origins: ["*"]
    allow-methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow-headers: ["*"]
    allow-credentials: true
    max-age: 86400

logging:
  root-level: "INFO"
  format: "json"

database:
  type: "sqlite"
  sqlite:
    path: "./data/kidsviewer.db"
    pragma:
      journal_mode: "WAL"
      synchronous: "NORMAL"
      foreign_keys: "ON"
  pool:
    max-open-conns: 25
    max-idle-conns: 25
    conn-max-lifetime: 300

cache:
  type: "memory"
  memory:
    default-expiration: 60
    cleanup-interval: 10
    max-items: 1000

jwt:
  secret-key: "your-secret-key-change-in-production"
  expiration-hours: 24
  refresh-hours: 168
  issuer: "kidsviewer-server"

kids-viewer:
  default-session-time-limit: 30
  default-daily-time-limit: 120
  default-question-count: 3
  max-question-count: 10
  watching-token-expiry: 60
  features:
    question-templates: true
    platform-management: true
    analytics: true
`
}

func runServer(cmd *cobra.Command, args []string) {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Create server
	srv, err := server.New(cfg)
	if err != nil {
		log.Fatalf("Failed to create server: %v", err)
	}

	// Create HTTP server
	httpServer := &http.Server{
		Addr:         fmt.Sprintf("%s:%d", cfg.Server.Address, cfg.Server.Port),
		Handler:      srv.Router,
		ReadTimeout:  time.Duration(cfg.Server.ReadTimeout) * time.Second,
		WriteTimeout: time.Duration(cfg.Server.WriteTimeout) * time.Second,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Starting KidsViewer Server on %s", httpServer.Addr)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// Create a context with timeout for graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(cfg.Server.ShutdownTimeout)*time.Second)
	defer cancel()

	// Shutdown HTTP server
	if err := httpServer.Shutdown(ctx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	}

	// Shutdown server components
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("Error shutting down server components: %v", err)
	}

	log.Println("Server exited")
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		log.Fatalf("Error executing command: %v", err)
	}
}
