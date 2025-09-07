package services

import (
	"context"
	"fmt"
	"kidsviewer-server/internal/cache"
	"kidsviewer-server/internal/database"
	"kidsviewer-server/internal/models"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// AuthService handles authentication and authorization
type AuthService struct {
	db        *database.Database
	cache     cache.Cache
	jwtSecret string
	jwtExpiry time.Duration
	issuer    string
}

// NewAuthService creates a new auth service
func NewAuthService(db *database.Database, cache cache.Cache, jwtSecret string, jwtExpiry time.Duration, issuer string) *AuthService {
	return &AuthService{
		db:        db,
		cache:     cache,
		jwtSecret: jwtSecret,
		jwtExpiry: jwtExpiry,
		issuer:    issuer,
	}
}

// Claims represents JWT claims
type Claims struct {
	UserID   uint   `json:"user_id"`
	Email    string `json:"email"`
	UserType string `json:"user_type"`
	jwt.RegisteredClaims
}

// LoginRequest represents login request
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

// RegisterRequest represents registration request
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Phone    string `json:"phone,omitempty"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name" binding:"required,min=2"`
}

// AuthResponse represents authentication response
type AuthResponse struct {
	User  interface{} `json:"user"`
	Token string      `json:"token"`
}

// Register creates a new parental account
func (s *AuthService) Register(ctx context.Context, req *RegisterRequest) (*AuthResponse, error) {
	// Check if user already exists
	var existingUser models.Parental
	if err := s.db.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		return nil, fmt.Errorf("user with email %s already exists", req.Email)
	} else if err != gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("failed to check existing user: %w", err)
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create new parental user
	parental := &models.Parental{
		Email:           req.Email,
		Phone:           req.Phone,
		Name:            req.Name,
		UserType:        "PARENTAL",
		ControlPassword: string(hashedPassword),
	}

	if err := s.db.DB.Create(parental).Error; err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Generate JWT token
	token, err := s.generateToken(parental.ID, parental.Email, parental.UserType)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	// Cache user session
	if err := s.cacheUserSession(ctx, parental.ID, token); err != nil {
		// Log error but don't fail the request
		fmt.Printf("Warning: failed to cache user session: %v\n", err)
	}

	return &AuthResponse{
		User:  parental,
		Token: token,
	}, nil
}

// Login authenticates a user
func (s *AuthService) Login(ctx context.Context, req *LoginRequest) (*AuthResponse, error) {
	// Find user by email
	var parental models.Parental
	if err := s.db.DB.Where("email = ?", req.Email).First(&parental).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("invalid email or password")
		}
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(parental.ControlPassword), []byte(req.Password)); err != nil {
		return nil, fmt.Errorf("invalid email or password")
	}

	// Generate JWT token
	token, err := s.generateToken(parental.ID, parental.Email, parental.UserType)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	// Load associated persons
	if err := s.db.DB.Preload("Persons").First(&parental, parental.ID).Error; err != nil {
		return nil, fmt.Errorf("failed to load user data: %w", err)
	}

	// Cache user session
	if err := s.cacheUserSession(ctx, parental.ID, token); err != nil {
		// Log error but don't fail the request
		fmt.Printf("Warning: failed to cache user session: %v\n", err)
	}

	return &AuthResponse{
		User:  parental,
		Token: token,
	}, nil
}

// Logout invalidates a user session
func (s *AuthService) Logout(ctx context.Context, userID uint) error {
	// Remove from cache
	cacheKey := cache.CacheKey(cache.SessionPrefix, strconv.FormatUint(uint64(userID), 10))
	return s.cache.Delete(ctx, cacheKey)
}

// ValidateToken validates a JWT token and returns claims
func (s *AuthService) ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.jwtSecret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	return claims, nil
}

// GetCurrentUser returns the current user from token
func (s *AuthService) GetCurrentUser(ctx context.Context, userID uint) (interface{}, error) {
	// Try cache first
	cacheKey := cache.CacheKey(cache.UserPrefix, strconv.FormatUint(uint64(userID), 10))
	var cachedUser models.Parental
	if err := s.cache.Get(ctx, cacheKey, &cachedUser); err == nil {
		return &cachedUser, nil
	}

	// Load from database
	var parental models.Parental
	if err := s.db.DB.Preload("Persons").First(&parental, userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Cache for future requests
	if err := s.cache.Set(ctx, cacheKey, &parental, 15*time.Minute); err != nil {
		fmt.Printf("Warning: failed to cache user: %v\n", err)
	}

	return &parental, nil
}

// VerifyParentalPassword verifies the parental control password
func (s *AuthService) VerifyParentalPassword(ctx context.Context, userID uint, password string) (bool, error) {
	var parental models.Parental
	if err := s.db.DB.First(&parental, userID).Error; err != nil {
		return false, fmt.Errorf("failed to find user: %w", err)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(parental.ControlPassword), []byte(password)); err != nil {
		return false, nil
	}

	return true, nil
}

// generateToken creates a new JWT token
func (s *AuthService) generateToken(userID uint, email, userType string) (string, error) {
	now := time.Now()
	claims := &Claims{
		UserID:   userID,
		Email:    email,
		UserType: userType,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    s.issuer,
			Subject:   strconv.FormatUint(uint64(userID), 10),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(s.jwtExpiry)),
			NotBefore: jwt.NewNumericDate(now),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}

// cacheUserSession caches the user session
func (s *AuthService) cacheUserSession(ctx context.Context, userID uint, token string) error {
	cacheKey := cache.CacheKey(cache.SessionPrefix, strconv.FormatUint(uint64(userID), 10))
	return s.cache.Set(ctx, cacheKey, token, s.jwtExpiry)
}
