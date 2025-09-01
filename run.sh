#!/bin/bash

# KidsViewer Unified Run Script
# This script provides unified commands for different development environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${BLUE}🚀 KidsViewer - $1${NC}"
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

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Check Node.js and npm
check_dependencies() {
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js not found, please install Node.js 18+"
        exit 1
    fi

    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm not found, please install npm"
        exit 1
    fi

    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version too low, requires 18+, current: $(node -v)"
        exit 1
    fi

    print_success "Node.js version check passed: $(node -v)"
}

# Install npm dependencies
install_npm_deps() {
    if [ ! -d "node_modules" ]; then
        print_info "Installing dependencies..."
        npm install
        if [ $? -ne 0 ]; then
            print_error "Failed to install dependencies"
            exit 1
        fi
        print_success "Dependencies installed successfully"
    else
        print_success "Dependencies already installed"
    fi
}

# Build project
build_project() {
    print_info "Building project..."
    npm run build
    if [ $? -ne 0 ]; then
        print_error "Build failed"
        exit 1
    fi
    print_success "Project built successfully"
}

# Electron development mode
electron_dev() {
    print_header "Starting Electron Development Mode"
    
    check_dependencies
    install_npm_deps
    
    print_info "Starting development mode..."
    print_info "Application will open in browser: http://localhost:5173"
    print_info "Electron app will start simultaneously"
    echo ""
    print_warning "Press Ctrl+C to stop the application"
    echo ""
    
    npm run electron-dev
}

# Electron production mode
electron_prod() {
    print_header "Starting Electron Production Mode"
    
    check_dependencies
    install_npm_deps
    
    # Check if Electron is installed
    if [ ! -d "node_modules/electron" ]; then
        print_info "Installing Electron dependencies..."
        npm install electron electron-builder @electron-toolkit/utils --save-dev
    fi
    
    build_project
    
    print_info "Starting Electron application..."
    npm run electron
    
    print_success "KidsViewer started successfully!"
}

# iOS development
ios() {
    print_header "Starting iOS Development Environment"
    
    check_dependencies
    install_npm_deps
    
    build_project
    
    # Sync Capacitor resources
    print_info "Syncing iOS resources..."
    npx cap sync ios
    
    # Check Xcode installation
    if ! command -v xcodebuild &> /dev/null; then
        print_error "Xcode not found, please install Xcode from Mac App Store"
        print_info "After installing Xcode, run: sudo xcode-select --switch /Applications/Xcode.app"
        exit 1
    fi
    
    # Check CocoaPods installation
    if ! command -v pod &> /dev/null; then
        print_info "Installing CocoaPods..."
        sudo gem install cocoapods
    fi
    
    # Install iOS dependencies
    print_info "Installing iOS dependencies..."
    cd ios/App && pod install && cd ../..
    
    print_success "iOS environment setup completed!"
    echo ""
    print_info "To open Xcode project, run:"
    echo "   npx cap open ios"
    echo ""
    print_info "To run on simulator:"
    echo "   npx cap run ios"
}

# Web development mode
web() {
    print_header "Starting Web Development Mode"
    
    check_dependencies
    install_npm_deps
    
    print_info "Starting web development server..."
    print_info "Application will be available at: http://localhost:5173"
    echo ""
    print_warning "Press Ctrl+C to stop the server"
    echo ""
    
    npm run dev
}

# Build for production
build() {
    print_header "Building for Production"
    
    check_dependencies
    install_npm_deps
    build_project
    
    print_success "Production build completed!"
}

# Show help
show_help() {
    echo -e "${BLUE}KidsViewer Unified Run Script${NC}"
    echo ""
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  electron-dev    Start Electron development mode (with hot reload)"
    echo "  electron-prod   Start Electron production mode"
    echo "  ios            Setup and prepare iOS development environment"
    echo "  web            Start web development server"
    echo "  build          Build project for production"
    echo "  help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 electron-dev    # Start development with hot reload"
    echo "  $0 ios            # Setup iOS environment"
    echo "  $0 web            # Start web development server"
    echo ""
}

# Main script logic
case "${1:-help}" in
    "electron-dev")
        electron_dev
        ;;
    "electron-prod")
        electron_prod
        ;;
    "ios")
        ios
        ;;
    "web")
        web
        ;;
    "build")
        build
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
