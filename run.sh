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

# Process tracking
PIDS=()

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

# Graceful shutdown function
graceful_shutdown() {
    print_info "Gracefully stopping all processes..."
    
    # Clean up temporary files
    if [ -f ".vite-port-output" ]; then
        rm -f .vite-port-output
    fi
    
    # Restore original configuration if backup exists
    if [ -f "capacitor.config.json.bak" ]; then
        print_info "Restoring original configuration..."
        mv capacitor.config.json.bak capacitor.config.json
    fi
    
    for pid in "${PIDS[@]}"; do
        if ps -p $pid > /dev/null; then
            print_info "Stopping process $pid"
            kill -TERM $pid 2>/dev/null || kill -KILL $pid 2>/dev/null
        fi
    done
    print_success "All processes stopped"
    exit 0
}

# Set up trap for graceful shutdown
trap graceful_shutdown INT TERM

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
    
    npm run preelectron-dev &
    npm run electron-dev &
    PIDS+=($!)
    
    # Wait for all background processes
    wait
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
    npm run electron &
    PIDS+=($!)
    
    print_success "KidsViewer started successfully!"
    
    # Wait for all background processes
    wait
}

# iOS development with live reload
ios_dev() {
    print_header "Starting iOS Development with Live Reload"
    
    check_dependencies
    install_npm_deps
    
    # Start dev server with hot reload
    print_info "Starting development server with hot reload..."
    
    # Simple approach: run npm dev and capture output to file
    npm run dev > .vite-port-output 2>&1 &
    DEV_PID=$!
    PIDS+=($DEV_PID)
    
    # Show output in real-time
    tail -f .vite-port-output &
    TAIL_PID=$!
    PIDS+=($TAIL_PID)
    
    # Wait for dev server to start
    sleep 5
    
    # Get the actual port used by Vite
    # Wait a bit more for the server to output port info
    sleep 5
    
    # Wait for Vite to output port information
    MAX_RETRIES=10
    RETRY_COUNT=0
    DEV_PORT=""
    
    print_info "Waiting for Vite to start and detect port..."
    
    # Stop the tail process after we've captured enough output
    sleep 3
    kill $TAIL_PID 2>/dev/null || true
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ] && [ -z "$DEV_PORT" ]; do
        if [ -f ".vite-port-output" ]; then
            # Try to get the port from the output file
            DEV_PORT=$(grep -o "Local:.*http://localhost:[0-9]\+" .vite-port-output 2>/dev/null | tail -1 | grep -o "[0-9]\+$" || echo "")
            
            if [ -n "$DEV_PORT" ]; then
                print_info "Detected Vite port from output: $DEV_PORT"
                break
            fi
        fi
        
        RETRY_COUNT=$((RETRY_COUNT + 1))
        sleep 1
    done
    
    # If we couldn't detect the port, use a default
    if [ -z "$DEV_PORT" ]; then
        print_warning "Could not detect Vite port from output file after $MAX_RETRIES retries"
        print_info "Using default port 5173"
        DEV_PORT="5173"
    fi
    
    # If we couldn't detect the port from output, try using lsof
    if [ -z "$DEV_PORT" ]; then
        DEV_PORT=$(lsof -i -P -n | grep LISTEN | grep node | head -1 | awk '{print $9}' | cut -d':' -f2)
    fi
    
    # If we still couldn't detect the port, default to 5173
    if [ -z "$DEV_PORT" ]; then
        DEV_PORT=5173
    fi
    
    print_info "Development server running on port: $DEV_PORT"
    
    # Create temporary development config file
    print_info "Creating development config for live reload..."
    # Backup original config
    cp capacitor.config.json capacitor.config.json.bak
    
    # Get local IP address for development server
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v ifconfig &> /dev/null; then
            LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
        else
            LOCAL_IP=$(ip addr show | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}' | cut -d/ -f1)
        fi
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        # Windows with Git Bash or similar
        LOCAL_IP=$(ipconfig | grep -i "IPv4 Address" | head -1 | awk '{print $NF}')
    else
        # Default fallback
        LOCAL_IP="localhost"
    fi
    
    # If IP detection failed, use localhost
    if [ -z "$LOCAL_IP" ]; then
        LOCAL_IP="localhost"
    fi
    
    # Create development config
    cat > capacitor.config.json << EOF
{
  "appId": "com.kidsviewer.app",
  "appName": "App",
  "webDir": "dist",
  "server": {
    "androidScheme": "https",
    "iosScheme": "http",
    "allowNavigation": ["*"],
    "hostname": "$LOCAL_IP",
    "cleartext": true,
    "url": "http://$LOCAL_IP:$DEV_PORT"
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 3000,
      "backgroundColor": "#4F46E5",
      "showSpinner": true,
      "androidSpinnerStyle": "large",
      "iosSpinnerStyle": "small",
      "spinnerColor": "#ffffff",
      "splashFullScreen": true,
      "splashImmersive": true
    },
    "StatusBar": {
      "style": "dark",
      "backgroundColor": "#4F46E5",
      "overlaysWebView": true,
      "backgroundColorByHexString": "#4F46E5"
    }
  },
  "ios": {
    "contentInset": "always",
    "scheme": "App",
    "backgroundColor": "#ffffff"
  }
}
EOF
    
    # Sync Capacitor resources
    print_info "Syncing iOS resources with development config..."
    npx cap sync ios
    
    # Check Xcode installation
    if ! command -v xcodebuild &> /dev/null; then
        print_error "Xcode not found, please install Xcode from Mac App Store"
        # Restore original config
        mv capacitor.config.json.bak capacitor.config.json
        graceful_shutdown
        exit 1
    fi
    
    # Get available iOS simulator devices
    print_info "Fetching available iOS simulator devices..."
    
    # Direct parsing of simulator devices
    DEVICES=$(xcrun simctl list devices | grep -v "^==" | grep "(" | sed 's/^[ \t]*//')
    
    if [ -z "$DEVICES" ]; then
        print_error "No available iOS simulator devices found"
        print_info "Please create a simulator device in Xcode first"
        # Restore original config
        mv capacitor.config.json.bak capacitor.config.json
        graceful_shutdown
        exit 1
    fi
    
    # Display available devices and prompt user to select one
    echo ""
    print_info "Available iOS simulator devices:"
    echo ""
    
    # Create array of device IDs and names
    # Using a different approach to create the array that works more reliably
    DEVICE_ARRAY=()
    while IFS= read -r line; do
        DEVICE_ARRAY+=("$line")
    done <<< "$DEVICES"
    
    # Display devices with index numbers
    for i in "${!DEVICE_ARRAY[@]}"; do
        echo "  $((i+1)). ${DEVICE_ARRAY[$i]}"
    done
    
    echo ""
    read -p "Select a device (1-${#DEVICE_ARRAY[@]}): " DEVICE_CHOICE
    
    # Validate input
    if ! [[ "$DEVICE_CHOICE" =~ ^[0-9]+$ ]] || [ "$DEVICE_CHOICE" -lt 1 ] || [ "$DEVICE_CHOICE" -gt "${#DEVICE_ARRAY[@]}" ]; then
        print_error "Invalid selection"
        # Restore original config
        mv capacitor.config.json.bak capacitor.config.json
        graceful_shutdown
        exit 1
    fi
    
    # Get selected device ID
    SELECTED_DEVICE="${DEVICE_ARRAY[$((DEVICE_CHOICE-1))]}"
    
    # Format: "DEVICE_NAME (UDID) (STATE)"
    DEVICE_NAME=$(echo "$SELECTED_DEVICE" | sed -E 's/^([^(]+).*/\1/' | xargs)
    DEVICE_ID=$(echo "$SELECTED_DEVICE" | sed -E 's/.*\(([0-9A-F-]+)\).*/\1/')
    
    print_info "Selected device: $DEVICE_NAME (ID: $DEVICE_ID)"
    
    # Launch iOS simulator with selected device
    print_info "Launching iOS simulator with selected device..."
    # Use Capacitor CLI with proper options
    npx cap run ios --target="$DEVICE_ID" --scheme=App --live-reload --host="$LOCAL_IP" --port="$DEV_PORT" &
    SIM_PID=$!
    PIDS+=($SIM_PID)
    
    print_success "iOS development environment with live reload started!"
    print_info "Changes to your code will automatically refresh in the simulator"
    print_info "App will use the development server at: http://$LOCAL_IP:$DEV_PORT"
    print_warning "Press Ctrl+C to stop all processes"
    
    # Wait for all background processes
    wait
    
    # Restore original config
    print_info "Restoring original configuration..."
    mv capacitor.config.json.bak capacitor.config.json
}

# iOS build for personal device without Apple Developer account
ios_build() {
    print_header "Building iOS Package for Personal Device"
    
    check_dependencies
    install_npm_deps
    
    # Build project
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
    
    # Open Xcode project
    print_info "Opening Xcode project..."
    print_info "Please follow these steps in Xcode:"
    echo ""
    print_info "1. Select your personal device as the build target"
    print_info "2. Go to Signing & Capabilities tab"
    print_info "3. Check 'Automatically manage signing'"
    print_info "4. Select your personal Apple ID"
    print_info "5. Click 'Build and Run' (Play button)"
    echo ""
    print_warning "After installation, go to Settings > General > Device Management on your iOS device"
    print_warning "Find your Apple ID and trust the developer"
    echo ""
    
    # Open Xcode project
    npx cap open ios
    
    print_success "Xcode project opened for building to personal device!"
    print_info "Follow the on-screen instructions to complete the build process"
}

# Start for web development
web_dev() {
    print_header "Starting Web Development Mode"
    
    check_dependencies
    install_npm_deps
    
    print_info "Starting web development server..."
    print_info "Application will be available at: http://localhost:5173"
    echo ""
    print_warning "Press Ctrl+C to stop the server"
    echo ""
    
    npm run dev &
    PIDS+=($!)
    
    # Wait for all background processes
    wait
}

# Build for web production
web_build() {
    print_header "Building for Production"
    
    check_dependencies
    install_npm_deps
    build_project
    
    print_success "Production build completed!"
}

# Ethereum contracts functions
ethereum_build() {
    print_header "Building Ethereum Contracts"
    
    # Check if forge is installed
    if ! command -v forge &> /dev/null; then
        print_error "Forge not found, please install Foundry first"
        print_info "Install Foundry: curl -L https://foundry.paradigm.xyz | bash"
        print_info "Then run: foundryup"
        exit 1
    fi
    
    # Navigate to ethereum contracts directory
    if [ ! -d "contracts/ethereum" ]; then
        print_error "Ethereum contracts directory not found"
        exit 1
    fi
    
    cd contracts/ethereum
    
    print_info "Building Ethereum contracts with forge..."
    forge build
    
    if [ $? -ne 0 ]; then
        print_error "Ethereum contracts build failed"
        cd ../..
        exit 1
    fi
    
    print_success "Ethereum contracts built successfully"
    cd ../..
}

ethereum_test() {
    print_header "Testing Ethereum Contracts"
    
    # Check if forge is installed
    if ! command -v forge &> /dev/null; then
        print_error "Forge not found, please install Foundry first"
        print_info "Install Foundry: curl -L https://foundry.paradigm.xyz | bash"
        print_info "Then run: foundryup"
        exit 1
    fi
    
    # Navigate to ethereum contracts directory
    if [ ! -d "contracts/ethereum" ]; then
        print_error "Ethereum contracts directory not found"
        exit 1
    fi
    
    cd contracts/ethereum
    
    print_info "Running Ethereum contract tests with forge..."
    forge test
    
    if [ $? -ne 0 ]; then
        print_error "Ethereum contract tests failed"
        cd ../..
        exit 1
    fi
    
    print_success "Ethereum contract tests passed"
    cd ../..
}

# Starknet contracts functions
starknet_build() {
    print_header "Building Starknet Contracts"
    
    # Check if scarb is installed
    if ! command -v scarb &> /dev/null; then
        print_error "Scarb not found, please install Scarb first"
        print_info "Install Scarb: curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh"
        exit 1
    fi
    
    # Navigate to starknet contracts directory
    if [ ! -d "contracts/starknet" ]; then
        print_error "Starknet contracts directory not found"
        exit 1
    fi
    
    cd contracts/starknet
    
    print_info "Building Starknet contracts with scarb..."
    scarb build
    
    if [ $? -ne 0 ]; then
        print_error "Starknet contracts build failed"
        cd ../..
        exit 1
    fi
    
    print_success "Starknet contracts built successfully"
    cd ../..
}

starknet_test() {
    print_header "Testing Starknet Contracts"
    
    # Check if snforge is installed
    if ! command -v snforge &> /dev/null; then
        print_error "snforge not found, please install Starknet Foundry first"
        print_info "Install Starknet Foundry: curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/foundry-rs/starknet-foundry/master/scripts/install.sh | sh"
        exit 1
    fi
    
    # Navigate to starknet contracts directory
    if [ ! -d "contracts/starknet" ]; then
        print_error "Starknet contracts directory not found"
        exit 1
    fi
    
    cd contracts/starknet
    
    print_info "Running Starknet contract tests with snforge..."
    snforge test
    
    if [ $? -ne 0 ]; then
        print_error "Starknet contract tests failed"
        cd ../..
        exit 1
    fi
    
    print_success "Starknet contract tests passed"
    cd ../..
}

# Combined contracts functions
contracts_build() {
    print_header "Building All Contracts"
    
    ethereum_build
    starknet_build
    
    print_success "All contracts built successfully"
}

contracts_test() {
    print_header "Testing All Contracts"
    
    ethereum_test
    starknet_test
    
    print_success "All contract tests passed"
}

# Backend Go service functions
backend_build() {
    print_header "Building Backend Go Service"
    
    # Check if Go is installed
    if ! command -v go &> /dev/null; then
        print_error "Go not found, please install Go 1.21+ first"
        print_info "Install Go: https://golang.org/doc/install"
        exit 1
    fi
    
    # Check Go version
    GO_VERSION=$(go version | grep -o 'go[0-9]\+\.[0-9]\+' | cut -d'v' -f2)
    REQUIRED_VERSION="1.21"
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$GO_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
        print_error "Go version too low, requires $REQUIRED_VERSION+, current: $GO_VERSION"
        exit 1
    fi
    
    # Navigate to server directory
    if [ ! -d "server" ]; then
        print_error "Server directory not found"
        exit 1
    fi
    
    cd server
    
    print_info "Building Go backend service..."
    
    # Build with flags to avoid showing local absolute paths
    CGO_ENABLED=0 go build \
        -ldflags="-s -w -X main.version=dev -X main.buildTime=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        -trimpath \
        -o main \
        ./cmd/main.go
    
    if [ $? -ne 0 ]; then
        print_error "Backend build failed"
        cd ..
        exit 1
    fi
    
    print_success "Backend service built successfully"
    cd ..
}

backend_run() {
    print_header "Running Backend Go Service"
    
    # Check if Go is installed
    if ! command -v go &> /dev/null; then
        print_error "Go not found, please install Go 1.21+ first"
        print_info "Install Go: https://golang.org/doc/install"
        exit 1
    fi
    
    # Navigate to server directory
    if [ ! -d "server" ]; then
        print_error "Server directory not found"
        exit 1
    fi
    
    cd server
    
    # Check if config file exists, create from example if not
    if [ ! -f "config.yaml" ] && [ -f "config.example.yaml" ]; then
        print_info "Creating config.yaml from example..."
        cp config.example.yaml config.yaml
        print_warning "Please edit config.yaml with your settings before running the server"
    fi
    
    print_info "Starting Go backend service..."
    print_info "Server will be available at: http://localhost:9988"
    print_warning "Press Ctrl+C to stop the server"
    echo ""
    
    # Run with flags to avoid showing local absolute paths
    CGO_ENABLED=0 go run \
        -ldflags="-s -w -X main.version=dev -X main.buildTime=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        -trimpath \
        ./cmd/main.go
    
    cd ..
}

backend_dev() {
    print_header "Starting Backend Development Mode"
    
    # Check if Go is installed
    if ! command -v go &> /dev/null; then
        print_error "Go not found, please install Go 1.21+ first"
        print_info "Install Go: https://golang.org/doc/install"
        exit 1
    fi
    
    # Navigate to server directory
    if [ ! -d "server" ]; then
        print_error "Server directory not found"
        exit 1
    fi
    
    cd server
    
    # Check if config file exists, create from example if not
    if [ ! -f "config.yaml" ] && [ -f "config.example.yaml" ]; then
        print_info "Creating config.yaml from example..."
        cp config.example.yaml config.yaml
        print_warning "Please edit config.yaml with your settings before running the server"
    fi
    
    print_info "Starting Go backend service in development mode..."
    print_info "Server will be available at: http://localhost:9988"
    print_info "Auto-reload enabled with air (if installed)"
    print_warning "Press Ctrl+C to stop the server"
    echo ""
    
    # Check if air is installed for hot reload
    if command -v air &> /dev/null; then
        print_info "Using air for hot reload..."
        air
    else
        print_info "Air not found, running with go run..."
        print_info "Install air for hot reload: go install github.com/cosmtrek/air@latest"
        # Run with flags to avoid showing local absolute paths
        CGO_ENABLED=0 go run \
            -ldflags="-s -w -X main.version=dev -X main.buildTime=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
            -trimpath \
            ./cmd/main.go
    fi
    
    cd ..
}

backend_test() {
    print_header "Testing Backend Go Service"
    
    # Check if Go is installed
    if ! command -v go &> /dev/null; then
        print_error "Go not found, please install Go 1.21+ first"
        print_info "Install Go: https://golang.org/doc/install"
        exit 1
    fi
    
    # Navigate to server directory
    if [ ! -d "server" ]; then
        print_error "Server directory not found"
        exit 1
    fi
    
    cd server
    
    print_info "Running Go backend tests..."
    
    # Run tests with coverage
    go test -v -race -coverprofile=coverage.out ./...
    
    if [ $? -ne 0 ]; then
        print_error "Backend tests failed"
        cd ..
        exit 1
    fi
    
    # Show coverage if tests passed
    if [ -f "coverage.out" ]; then
        print_info "Test coverage:"
        go tool cover -func=coverage.out | tail -1
    fi
    
    print_success "Backend tests passed"
    cd ..
}

# Show help
show_help() {
    echo -e "${BLUE}KidsViewer Unified Run Script${NC}"
    echo ""
    echo "Usage: $0 <command>"
    echo ""
    echo "Frontend Commands:"
    echo "  electron-dev        Start Electron development mode (with hot reload)"
    echo "  electron-prod       Start Electron production mode"
    echo "  ios-dev             Start iOS development with live reload in simulator"
    echo "  ios-build           Build iOS package for personal device (no Apple Developer account needed)"
    echo "  web-dev             Start web development server"
    echo "  web-build           Build project for production"
    echo ""
    echo "Backend Commands:"
    echo "  backend-build       Build Go backend service (go build)"
    echo "  backend-run         Run Go backend service (go run)"
    echo "  backend-dev         Run Go backend in development mode with hot reload"
    echo "  backend-test        Test Go backend service (go test)"
    echo ""
    echo "Contract Commands:"
    echo "  ethereum-build      Build Ethereum contracts (forge build)"
    echo "  ethereum-test       Test Ethereum contracts (forge test)"
    echo "  starknet-build      Build Starknet contracts (scarb build)"
    echo "  starknet-test       Test Starknet contracts (snforge test)"
    echo "  contracts-build     Build all contracts (Ethereum + Starknet)"
    echo "  contracts-test      Test all contracts (Ethereum + Starknet)"
    echo ""  
    echo "Other Commands:"
    echo "  help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 electron-dev     Start development with hot reload"
    echo "  $0 ios-dev          Start iOS development with live reload"
    echo "  $0 ios-build        Build for personal iOS device"
    echo "  $0 web-dev          Start web development server"
    echo "  $0 web-build        Build project for production"
    echo "  $0 ethereum-build   Build Ethereum contracts"
    echo "  $0 ethereum-test    Test Ethereum contracts"
    echo "  $0 starknet-build   Build Starknet contracts"
    echo "  $0 starknet-test    Test Starknet contracts"
    echo "  $0 contracts-build  Build all contracts"
    echo "  $0 contracts-test   Test all contracts"
    echo "  $0 backend-build    Build Go backend service"
    echo "  $0 backend-run      Run Go backend service"
    echo "  $0 backend-dev      Run Go backend in development mode"
    echo "  $0 backend-test     Test Go backend service"
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
    "ios-dev")
        ios_dev
        ;;
    "ios-build")
        ios_build
        ;;
    "web-dev")
        web_dev
        ;;
    "web-build")
        web_build
        ;;
    "ethereum-build")
        ethereum_build
        ;;
    "ethereum-test")
        ethereum_test
        ;;
    "starknet-build")
        starknet_build
        ;;
    "starknet-test")
        starknet_test
        ;;
    "contracts-build")
        contracts_build
        ;;
    "contracts-test")
        contracts_test
        ;;
    "backend-build")
        backend_build
        ;;
    "backend-run")
        backend_run
        ;;
    "backend-dev")
        backend_dev
        ;;
    "backend-test")
        backend_test
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
