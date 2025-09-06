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

# iOS setup and preparation
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
    echo ""
    print_info "For development with live reload, run:"
    echo "   ./run.sh ios-dev"
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
    
    npm run dev &
    PIDS+=($!)
    
    # Wait for all background processes
    wait
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
    echo "  ios-dev        Start iOS development with live reload in simulator"
    echo "  web            Start web development server"
    echo "  build          Build project for production"
    echo "  help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 electron-dev    # Start development with hot reload"
    echo "  $0 ios            # Setup iOS environment"
    echo "  $0 ios-dev        # Start iOS development with live reload"
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
    "ios-dev")
        ios_dev
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
