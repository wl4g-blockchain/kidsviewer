package main

import (
	"context"
	"fmt"
	"kidsviewer-server/internal/config"
	"kidsviewer-server/internal/server"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	cfgFile string
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

	// Global flags
	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is ./config.yaml)")
	rootCmd.PersistentFlags().String("server.address", "0.0.0.0", "server listen address")
	rootCmd.PersistentFlags().Int("server.port", 9988, "server listen port")
	rootCmd.PersistentFlags().String("logging.root-level", "INFO", "root logging level")
	rootCmd.PersistentFlags().String("database.type", "sqlite", "database type (sqlite|postgres)")
	rootCmd.PersistentFlags().String("database.dsn", "./data/kidsviewer.db", "database connection string")
	rootCmd.PersistentFlags().String("cache.type", "memory", "cache type (memory|redis)")
	rootCmd.PersistentFlags().String("jwt.secret-key", "", "JWT secret key")
	rootCmd.PersistentFlags().Int("jwt.expiration-hours", 24, "JWT token expiration in hours")

	// Bind flags to viper
	viper.BindPFlag("server.address", rootCmd.PersistentFlags().Lookup("server.address"))
	viper.BindPFlag("server.port", rootCmd.PersistentFlags().Lookup("server.port"))
	viper.BindPFlag("logging.root-level", rootCmd.PersistentFlags().Lookup("logging.root-level"))
	viper.BindPFlag("database.type", rootCmd.PersistentFlags().Lookup("database.type"))
	viper.BindPFlag("database.dsn", rootCmd.PersistentFlags().Lookup("database.dsn"))
	viper.BindPFlag("cache.type", rootCmd.PersistentFlags().Lookup("cache.type"))
	viper.BindPFlag("jwt.secret-key", rootCmd.PersistentFlags().Lookup("jwt.secret-key"))
	viper.BindPFlag("jwt.expiration-hours", rootCmd.PersistentFlags().Lookup("jwt.expiration-hours"))
}

func initConfig() {
	if cfgFile != "" {
		// Use config file from the flag
		viper.SetConfigFile(cfgFile)
	} else {
		// Search config in current directory
		viper.AddConfigPath(".")
		viper.AddConfigPath("./config")
		viper.SetConfigType("yaml")
		viper.SetConfigName("config")
	}

	// Environment variables
	viper.SetEnvPrefix("KIDSVIEWER")
	viper.AutomaticEnv()

	// Set defaults
	setDefaults()

	// Read config file
	if err := viper.ReadInConfig(); err == nil {
		log.Printf("Using config file: %s", viper.ConfigFileUsed())
	}
}

func setDefaults() {
	// Server defaults
	viper.SetDefault("server.address", "0.0.0.0")
	viper.SetDefault("server.port", 9988)
	viper.SetDefault("server.read-timeout", 30)
	viper.SetDefault("server.write-timeout", 30)
	viper.SetDefault("server.shutdown-timeout", 30)

	// CORS defaults
	viper.SetDefault("server.cors.allow-origins", []string{"*"})
	viper.SetDefault("server.cors.allow-methods", []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"})
	viper.SetDefault("server.cors.allow-headers", []string{"*"})
	viper.SetDefault("server.cors.allow-credentials", true)
	viper.SetDefault("server.cors.max-age", 12*3600)

	// Logging defaults
	viper.SetDefault("logging.root-level", "INFO")
	viper.SetDefault("logging.format", "json")

	// Database defaults
	viper.SetDefault("database.type", "sqlite")
	viper.SetDefault("database.dsn", "./data/kidsviewer.db")
	viper.SetDefault("database.max-open-conns", 25)
	viper.SetDefault("database.max-idle-conns", 5)
	viper.SetDefault("database.conn-max-lifetime", "5m")

	// Cache defaults
	viper.SetDefault("cache.type", "memory")
	viper.SetDefault("cache.memory.max-size", 100)
	viper.SetDefault("cache.memory.default-expiration", "10m")
	viper.SetDefault("cache.memory.cleanup-interval", "15m")

	// JWT defaults
	viper.SetDefault("jwt.secret-key", "your-secret-key-change-in-production")
	viper.SetDefault("jwt.expiration-hours", 24)
	viper.SetDefault("jwt.issuer", "kidsviewer-server")

	// Kids Viewer specific defaults
	viper.SetDefault("kids-viewer.max-daily-time", 120)
	viper.SetDefault("kids-viewer.question-interval", 15)
	viper.SetDefault("kids-viewer.max-wrong-answers", 3)
	viper.SetDefault("kids-viewer.session-timeout", 30)
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
