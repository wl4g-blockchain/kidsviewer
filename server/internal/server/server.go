package server

import (
	"context"
	"fmt"
	"kidsviewer-server/internal/cache"
	"kidsviewer-server/internal/config"
	"kidsviewer-server/internal/database"
	"kidsviewer-server/internal/handlers"
	"kidsviewer-server/internal/middleware"
	"kidsviewer-server/internal/services"
	"log"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/prometheus"
	otelmetric "go.opentelemetry.io/otel/metric"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
)

// Server represents the HTTP server
type Server struct {
	config   *config.Config
	db       *database.Database
	cache    cache.Cache
	services *Services
	handlers *Handlers
	Router   *gin.Engine
	metrics  *Metrics
}

// Services contains all business logic services
type Services struct {
	Auth     *services.AuthService
	Person   *services.PersonService
	Platform *services.PlatformService
	Question *services.QuestionService
	Watching *services.WatchingService
	Settings *services.SettingsService
}

// Handlers contains all HTTP handlers
type Handlers struct {
	Auth     *handlers.AuthHandler
	Person   *handlers.PersonHandler
	Platform *handlers.PlatformHandler
	Question *handlers.QuestionHandler
	Watching *handlers.WatchingHandler
	Settings *handlers.SettingsHandler
	Health   *handlers.HealthHandler
}

// Metrics contains OpenTelemetry metrics
type Metrics struct {
	RequestCounter  otelmetric.Int64Counter
	RequestDuration otelmetric.Float64Histogram
	ActiveSessions  otelmetric.Int64UpDownCounter
}

// New creates a new server instance
func New(cfg *config.Config) (*Server, error) {
	// Set Gin mode based on logging level
	if cfg.Logging.RootLevel == "DEBUG" {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialize database
	db, err := database.New(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize database: %w", err)
	}

	// Seed initial data
	if err := db.SeedData(); err != nil {
		log.Printf("Warning: failed to seed database: %v", err)
	}

	// Initialize cache
	cacheInstance, err := cache.NewCache(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize cache: %w", err)
	}

	// Initialize metrics
	metrics, err := initMetrics()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize metrics: %w", err)
	}

	// Initialize services
	services := initServices(cfg, db, cacheInstance)

	// Initialize handlers
	handlers := initHandlers(services)

	// Initialize router
	router := initRouter(cfg, handlers, metrics)

	server := &Server{
		config:   cfg,
		db:       db,
		cache:    cacheInstance,
		services: services,
		handlers: handlers,
		Router:   router,
		metrics:  metrics,
	}

	return server, nil
}

// initServices initializes all business logic services
func initServices(cfg *config.Config, db *database.Database, cache cache.Cache) *Services {
	jwtExpiry := time.Duration(cfg.JWT.ExpirationHours) * time.Hour

	authService := services.NewAuthService(db, cache, cfg.JWT.SecretKey, jwtExpiry, cfg.JWT.Issuer)
	personService := services.NewPersonService(db, cache)
	platformService := services.NewPlatformService(db, cache)
	questionService := services.NewQuestionService(db, cache)
	watchingService := services.NewWatchingService(db, cache, &cfg.KidsViewer)
	settingsService := services.NewSettingsService(db, cache)

	return &Services{
		Auth:     authService,
		Person:   personService,
		Platform: platformService,
		Question: questionService,
		Watching: watchingService,
		Settings: settingsService,
	}
}

// initHandlers initializes all HTTP handlers
func initHandlers(services *Services) *Handlers {
	return &Handlers{
		Auth:     handlers.NewAuthHandler(services.Auth),
		Person:   handlers.NewPersonHandler(services.Person),
		Platform: handlers.NewPlatformHandler(services.Platform),
		Question: handlers.NewQuestionHandler(services.Question),
		Watching: handlers.NewWatchingHandler(services.Watching),
		Settings: handlers.NewSettingsHandler(services.Settings),
		Health:   handlers.NewHealthHandler(),
	}
}

// initRouter initializes the HTTP router with all routes and middleware
func initRouter(cfg *config.Config, handlers *Handlers, metrics *Metrics) *gin.Engine {
	router := gin.New()

	// Global middleware
	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	router.Use(middleware.RequestID())
	router.Use(middleware.Metrics(metrics.RequestCounter, metrics.RequestDuration))

	// CORS configuration
	corsConfig := cors.Config{
		AllowOrigins:     cfg.Server.CORS.AllowOrigins,
		AllowMethods:     cfg.Server.CORS.AllowMethods,
		AllowHeaders:     cfg.Server.CORS.AllowHeaders,
		AllowCredentials: cfg.Server.CORS.AllowCredentials,
		MaxAge:           time.Duration(cfg.Server.CORS.MaxAge) * time.Second,
	}
	router.Use(cors.New(corsConfig))

	// Health check endpoints
	router.GET("/health", handlers.Health.Health)
	router.GET("/health/ready", handlers.Health.Ready)
	router.GET("/health/live", handlers.Health.Live)
	router.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// API routes
	api := router.Group("/api/v1")
	{
		// Authentication routes (no auth required)
		auth := api.Group("/auth")
		{
			auth.POST("/register", handlers.Auth.Register)
			auth.POST("/login", handlers.Auth.Login)
		}

		// Protected routes (require authentication)
		protected := api.Group("")
		protected.Use(middleware.AuthRequired(handlers.Auth.AuthService))
		{
			// Auth routes
			protected.POST("/auth/logout", handlers.Auth.Logout)
			protected.GET("/auth/me", handlers.Auth.GetCurrentUser)
			protected.POST("/auth/verify-parental-password", handlers.Auth.VerifyParentalPassword)

			// Person management
			persons := protected.Group("/persons")
			{
				persons.GET("", handlers.Person.GetPersons)
				persons.POST("", handlers.Person.CreatePerson)
				persons.GET("/:id", handlers.Person.GetPerson)
				persons.PUT("/:id", handlers.Person.UpdatePerson)
				persons.DELETE("/:id", handlers.Person.DeletePerson)
				persons.PUT("/:id/settings", handlers.Person.UpdatePersonSettings)
				persons.GET("/:id/platforms", handlers.Person.GetPersonPlatforms)
				persons.GET("/:id/statistics", handlers.Person.GetPersonStatistics)
				persons.GET("/:id/progress", handlers.Person.GetLearningProgress)
			}

			// Platform management
			platforms := protected.Group("/platforms")
			{
				platforms.GET("", handlers.Platform.GetPlatforms)
				platforms.POST("", handlers.Platform.CreatePlatform)
				platforms.GET("/:id", handlers.Platform.GetPlatform)
				platforms.PUT("/:id", handlers.Platform.UpdatePlatform)
				platforms.DELETE("/:id", handlers.Platform.DeletePlatform)
			}

			// Question management
			questions := protected.Group("/questions")
			{
				questions.GET("", handlers.Question.GetQuestions)
				questions.POST("", handlers.Question.CreateQuestion)
				questions.GET("/:id", handlers.Question.GetQuestion)
				questions.PUT("/:id", handlers.Question.UpdateQuestion)
				questions.DELETE("/:id", handlers.Question.DeleteQuestion)
				questions.GET("/templates", handlers.Question.GetQuestionTemplates)
				questions.POST("/templates", handlers.Question.CreateQuestionTemplate)
				questions.PUT("/templates/:id", handlers.Question.UpdateQuestionTemplate)
				questions.DELETE("/templates/:id", handlers.Question.DeleteQuestionTemplate)
			}

			// Watching session management
			watching := protected.Group("/watching")
			{
				watching.POST("/start", handlers.Watching.StartWatching)
				watching.POST("/check", handlers.Watching.CheckWatching)
				watching.POST("/verify", handlers.Watching.VerifyQuestion)
				watching.POST("/skip", handlers.Watching.SkipQuestions)
				watching.GET("/history/:person_id", handlers.Watching.GetWatchingHistory)
			}

			// Settings management
			settings := protected.Group("/settings")
			{
				settings.GET("", handlers.Settings.GetAppSettings)
				settings.PUT("", handlers.Settings.UpdateAppSettings)
				settings.GET("/app-info", handlers.Settings.GetAppInfo)
			}
		}
	}

	return router
}

// initMetrics initializes OpenTelemetry metrics
func initMetrics() (*Metrics, error) {
	// Create a Prometheus exporter
	exporter, err := prometheus.New()
	if err != nil {
		return nil, fmt.Errorf("failed to create prometheus exporter: %w", err)
	}

	// Create a meter provider
	provider := sdkmetric.NewMeterProvider(sdkmetric.WithReader(exporter))
	otel.SetMeterProvider(provider)

	// Create a meter
	meter := provider.Meter("kidsviewer-server")

	// Create metrics
	requestCounter, err := meter.Int64Counter(
		"http_requests_total",
		otelmetric.WithDescription("Total number of HTTP requests"),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create request counter: %w", err)
	}

	requestDuration, err := meter.Float64Histogram(
		"http_request_duration_seconds",
		otelmetric.WithDescription("Duration of HTTP requests in seconds"),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create request duration histogram: %w", err)
	}

	activeSessions, err := meter.Int64UpDownCounter(
		"active_sessions_total",
		otelmetric.WithDescription("Number of active user sessions"),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create active sessions counter: %w", err)
	}

	return &Metrics{
		RequestCounter:  requestCounter,
		RequestDuration: requestDuration,
		ActiveSessions:  activeSessions,
	}, nil
}

// Shutdown gracefully shuts down the server
func (s *Server) Shutdown(ctx context.Context) error {
	log.Println("Shutting down server components...")

	// Close cache connection
	if err := s.cache.Close(); err != nil {
		log.Printf("Error closing cache: %v", err)
	}

	// Close database connection
	if err := s.db.Close(); err != nil {
		log.Printf("Error closing database: %v", err)
	}

	log.Println("Server components shut down successfully")
	return nil
}

// Health returns the server health status
func (s *Server) Health() map[string]interface{} {
	status := map[string]interface{}{
		"status":    "healthy",
		"timestamp": time.Now().UTC(),
		"version":   "1.0.0",
		"checks":    make(map[string]interface{}),
	}

	checks := status["checks"].(map[string]interface{})

	// Check database health
	if err := s.db.Health(); err != nil {
		checks["database"] = map[string]interface{}{
			"status": "unhealthy",
			"error":  err.Error(),
		}
		status["status"] = "unhealthy"
	} else {
		checks["database"] = map[string]interface{}{
			"status": "healthy",
		}
	}

	// Check cache health
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := s.cache.Health(ctx); err != nil {
		checks["cache"] = map[string]interface{}{
			"status": "unhealthy",
			"error":  err.Error(),
		}
		status["status"] = "unhealthy"
	} else {
		checks["cache"] = map[string]interface{}{
			"status": "healthy",
		}
	}

	return status
}
