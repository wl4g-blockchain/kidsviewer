#!/bin/bash

# Life Book Application Management Script
# Unified script for managing the Life Book application setup and utilities

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to show help
show_help() {
    echo "Life Book Application Management Script"
    echo ""
    echo "Usage: ./run.sh <command> [options]"
    echo ""
    echo "Commands:"
    echo "  setup           Setup the application (install dependencies, generate Prisma client)"
    echo "  generate-keys   Generate RSA key pair for web authentication"
    echo "  dev             Start development server"
    echo "  build           Build the application for production"
    echo "  start           Start production server"
    echo "  lint            Run ESLint to check code quality"
    echo "  db:generate     Generate Prisma client stub codes"
    echo "  db:init         Initialize database with DDL and DML files using Prisma (WARNING: This will delete all data)"
    echo "  db:push         Push database schema"
    echo "  db:pull         Pull database schema to Prisma schema"
    echo "  db:studio       Open Prisma Studio"
    echo "  db:status       Check migration status"
    echo "  db:version      Show Prisma version"
    echo "  db:debug        Show Prisma debug information"
    echo "  db:reset        Reset database schema & data (WARNING: This will delete all data)"
    echo "  db:migrate      Run database migrations"
    echo "  db:deploy       Deploy migrations to production"
    echo "  db:seed         Seed database with initial data"
    echo "  fix:sequences   Fix PostgreSQL sequences"
    echo "  clean           Clean build artifacts and node_modules"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./run.sh dev"
    echo "  ./run.sh build"
    echo "  ./run.sh generate-keys"
    echo "  ./run.sh db:reset"
    echo "  ./run.sh db:studio"
    echo "  ./run.sh fix:sequences"
    echo "  ..."
}

# Function to check if Node.js is installed
check_node() {
    if ! command -v node &>/dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi

    local node_version=$(node --version)
    print_info "Node.js version: $node_version"
}

# Function to check if npm is installed
check_npm() {
    if ! command -v npm &>/dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
}

# Function to setup the application
setup_app() {
    print_info "Setting up Life Book application..."

    check_node
    check_npm

    # Install dependencies
    print_info "Installing dependencies..."
    npm install

    # Generate Prisma client
    print_info "Generating Prisma client..."
    npm run db:generate

    print_success "Application setup completed!"
    print_warning "Please ensure you have configured the database connection:"
    echo "1. Copy env.example to .env.local"
    echo "2. Configure DATABASE_URL"
    echo "3. Run './run.sh db:push' to create database tables"
    echo "4. Run './run.sh dev' to start development server"
}

# Function to generate RSA keys
generate_keys() {
    print_info "Generating RSA key pair and base64 encoding..."

    # Check if openssl is available
    if ! command -v openssl &>/dev/null; then
        print_error "OpenSSL is not installed. Please install OpenSSL first."
        exit 1
    fi

    # Generate private key
    openssl genrsa -out private.pem 2048

    # Generate public key
    openssl rsa -in private.pem -pubout -out public.pem

    # Convert private key to base64
    echo ""
    print_info "Base64 encoded private key (for .env.local):"
    echo "=============================================="
    base64 -i private.pem | tr -d '\n'
    echo ""
    echo "=============================================="

    # Show the public key
    echo ""
    print_info "Public key (for reference):"
    echo "=========================="
    cat public.pem
    echo "=========================="

    echo ""
    print_info "Add this to your .env.local file:"
    echo "RSA_PRIVATE_KEY=\"$(base64 -i private.pem | tr -d '\n')\""

    # Clean up
    rm private.pem public.pem

    print_success "RSA key generation completed! The private key has been base64 encoded and ready for .env.local"
}

# Function to start development server
start_dev() {
    print_info "Starting development server..."
    npm run dev
}

# Function to build the application
build_app() {
    print_info "Building application for production..."
    npm run build
    print_success "Build completed!"
}

# Function to start production server
start_prod() {
    print_info "Starting production server..."
    npm run start
}

# Function to generate Prisma client
db_generate() {
    print_info "Generating Prisma client stub codes..."
    npm run db:generate
    print_success "Prisma client stub codes generated!"
}

# Function to initialize database with DDL and DML files
db_init() {
    print_info "Initializing database with DDL and DML files..."

    # Check if DATABASE_URL is set
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL environment variable is not set!"
        print_info "Please set DATABASE_URL in your .env.local file"
        exit 1
    fi

    # Check if Node.js is available
    if ! command -v node &>/dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi

    # Use JavaScript tool to execute database initialization
    print_info "Using JavaScript tool to execute database initialization..."
    if node scripts/db-init.js; then
        print_success "Database initialization completed!"
        print_info "Database structure and initial data have been created."
    else
        print_error "Database initialization failed!"
        exit 1
    fi
}

# Function to push database schema
db_push() {
    print_info "Pushing database schema..."
    npm run db:push
    print_success "Database schema pushed!"
}

# Function to run linting
run_lint() {
    print_info "Running ESLint to check code quality..."
    npm run lint
    print_success "Linting completed!"
}

# Function to pull database schema
db_pull() {
    print_info "Pulling database schema to Prisma schema..."
    npm run migrate:gen:schema:from-db
    print_success "Database schema pulled!"
}

# Function to open Prisma Studio
db_studio() {
    print_info "Opening Prisma Studio..."
    npm run migrate:studio
}

# Function to check migration status
db_status() {
    print_info "Checking migration status..."
    npm run migrate:status
}

# Function to show Prisma version
db_version() {
    print_info "Showing Prisma version..."
    npm run migrate:version
}

# Function to show Prisma debug information
db_debug() {
    print_info "Showing Prisma debug information..."
    npm run migrate:debug
}

# Function to run database migrations
db_migrate() {
    print_info "Running database migrations..."
    npm run migrate:db:gen-migrations-client:upgrade
    print_success "Database migrations completed!"
}

# Function to reset database
db_reset() {
    print_warning "This will delete all data in the database!"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Resetting database..."
        npm run migrate:db:drop-all:upgrade
        print_success "Database reset completed!"
    else
        print_info "Database reset cancelled."
    fi
}

# Function to deploy migrations to production
db_deploy() {
    print_info "Deploying migrations to production..."
    npm run migrate:db:upgrade:from-migrations
    print_success "Migrations deployed to production!"
}

# Function to seed database
db_seed() {
    print_info "Seeding database with initial data..."
    npm run migrate:db:init:data
    print_success "Database seeded!"
}

# Function to fix PostgreSQL sequences
fix_sequences() {
    print_info "Fixing PostgreSQL sequences..."
    npm run fix:sequences
    print_success "PostgreSQL sequences fixed!"
}

# Function to clean build artifacts
clean_app() {
    print_info "Cleaning build artifacts and node_modules..."

    # Remove node_modules
    if [ -d "node_modules" ]; then
        rm -rf node_modules
        print_info "Removed node_modules"
    fi

    # Remove .next directory
    if [ -d ".next" ]; then
        rm -rf .next
        print_info "Removed .next directory"
    fi

    # Remove package-lock.json
    if [ -f "package-lock.json" ]; then
        rm package-lock.json
        print_info "Removed package-lock.json"
    fi

    print_success "Clean completed!"
}

# Main script logic
main() {
    # Check if no arguments provided
    if [ $# -eq 0 ]; then
        show_help
        exit 1
    fi

    # Get the command
    local command=$1
    shift

    # Execute the appropriate function based on command
    case $command in
    "setup")
        setup_app
        ;;
    "generate-keys")
        generate_keys
        ;;
    "dev")
        start_dev
        ;;
    "build")
        build_app
        ;;
    "start")
        start_prod
        ;;
    "lint")
        run_lint
        ;;
    "db:generate")
        db_generate
        ;;
    "db:init")
        db_init
        ;;
    "db:push")
        db_push
        ;;
    "db:pull")
        db_pull
        ;;
    "db:studio")
        db_studio
        ;;
    "db:status")
        db_status
        ;;
    "db:version")
        db_version
        ;;
    "db:debug")
        db_debug
        ;;
    "db:migrate")
        db_migrate
        ;;
    "db:reset")
        db_reset
        ;;
    "db:deploy")
        db_deploy
        ;;
    "db:seed")
        db_seed
        ;;
    "fix:sequences")
        fix_sequences
        ;;
    "clean")
        clean_app
        ;;
    "help" | "-h" | "--help")
        show_help
        ;;
    *)
        print_error "Unknown command: $command"
        echo ""
        show_help
        exit 1
        ;;
    esac
}

# Run main function with all arguments
main "$@"
