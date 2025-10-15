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

# Cross-platform timeout function
run_with_timeout() {
    local timeout_seconds=$1
    shift

    # Check if timeout command is available
    if command -v timeout &>/dev/null; then
        # Use GNU timeout (Linux)
        timeout $timeout_seconds "$@"
    elif command -v gtimeout &>/dev/null; then
        # Use GNU timeout from coreutils (macOS with Homebrew)
        gtimeout $timeout_seconds "$@"
    else
        # Fallback: run without timeout (macOS without coreutils)
        print_warning "timeout command not available, running without timeout..."
        "$@"
    fi
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
        if ps -p $pid >/dev/null; then
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
    if ! command -v node &>/dev/null; then
        print_error "Node.js not found, please install Node.js 18+"
        exit 1
    fi

    # Check npm
    if ! command -v npm &>/dev/null; then
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

# Electron build for production
electron_build() {
    local debug_mode=${1:-false}

    if [ "$debug_mode" = "true" ]; then
        print_header "Building Electron for Production (Debug Mode)"
    else
        print_header "Building Electron for Production"
    fi

    check_dependencies
    install_npm_deps

    # Check if Electron is installed
    if [ ! -d "node_modules/electron" ]; then
        print_info "Installing Electron dependencies..."
        npm install electron electron-builder @electron-toolkit/utils --save-dev
    fi

    if [ "$debug_mode" = "true" ]; then
        print_info "Building project with debug output..."
        npm run build-debug
    else
        build_project
    fi

    print_info "Building Electron application..."
    print_warning "Note: Electron build may take several minutes and might appear to hang..."
    print_info "This is normal for the first build as it downloads Electron binaries"

    if [ "$debug_mode" = "true" ]; then
        print_info "Debug mode enabled - showing detailed build output..."
        print_info "This will help identify where the build process hangs"
        print_info "Setting debug environment variables..."
        export DEBUG=electron-builder
        export ELECTRON_BUILDER_CACHE=/tmp/electron-builder-cache
        export ELECTRON_BUILDER_OFFLINE=false
        print_info "DEBUG=electron-builder"
        print_info "ELECTRON_BUILDER_CACHE=/tmp/electron-builder-cache"
        print_info "ELECTRON_BUILDER_OFFLINE=false"

        # Show system information
        print_info "System information:"
        print_info "Node.js version: $(node -v)"
        print_info "npm version: $(npm -v)"
        print_info "Platform: $(uname -a)"
        print_info "Available disk space:"
        df -h . | head -2
    fi

    # Try simple build first (faster, less likely to hang)
    print_info "Attempting simple build first..."
    if [ "$debug_mode" = "true" ]; then
        if run_with_timeout 300 npm run electron-build-debug; then
            print_success "Simple debug build completed successfully!"
            print_info "Built files are available in the release/ directory"
            return 0
        fi
    else
        if run_with_timeout 300 npm run electron-build; then
            print_success "Simple build completed successfully!"
            print_info "Built files are available in the release/ directory"
            return 0
        fi
    fi

    # If simple build fails, try full build with timeout
    print_info "Simple build failed, trying full build..."
    if [ "$debug_mode" = "true" ]; then
        run_with_timeout 600 npm run electron-build-debug || {
            BUILD_EXIT_CODE=$?
            if [ $BUILD_EXIT_CODE -eq 124 ]; then
                print_warning "Debug build timed out after 10 minutes"
            else
                print_warning "Debug build failed with exit code: $BUILD_EXIT_CODE"
            fi

            # Check if any build artifacts were created
            if [ -d "release/mac-arm64/Electron.app" ]; then
                print_warning "Build artifacts found despite error/timeout"
                print_info "Attempting to fix the missing executable..."

                # Try to find and copy the main executable
                if [ -f "release/mac-arm64/Electron.app/Contents/Frameworks/Electron Helper.app/Contents/MacOS/Electron Helper" ]; then
                    print_info "Found Electron Helper, creating main executable..."
                    cp "release/mac-arm64/Electron.app/Contents/Frameworks/Electron Helper.app/Contents/MacOS/Electron Helper" "release/mac-arm64/Electron.app/Contents/MacOS/KidsViewer"
                    chmod +x "release/mac-arm64/Electron.app/Contents/MacOS/KidsViewer"
                    print_success "Fixed missing executable"
                else
                    print_warning "Could not find Electron Helper to copy"
                fi

                print_success "Electron application built successfully!"
                print_info "Built files are available in the release/ directory"
            else
                print_error "No build artifacts found. Build failed completely."
                print_info "Try running: npm run electron-build-debug manually to see detailed error"
                exit 1
            fi
        }
    else
        run_with_timeout 600 npm run electron-build || {
            BUILD_EXIT_CODE=$?
            if [ $BUILD_EXIT_CODE -eq 124 ]; then
                print_warning "Build timed out after 10 minutes"
            else
                print_warning "Build failed with exit code: $BUILD_EXIT_CODE"
            fi

            # Check if any build artifacts were created
            if [ -d "release/mac-arm64/Electron.app" ]; then
                print_warning "Build artifacts found despite error/timeout"
                print_info "Attempting to fix the missing executable..."

                # Try to find and copy the main executable
                if [ -f "release/mac-arm64/Electron.app/Contents/Frameworks/Electron Helper.app/Contents/MacOS/Electron Helper" ]; then
                    print_info "Found Electron Helper, creating main executable..."
                    cp "release/mac-arm64/Electron.app/Contents/Frameworks/Electron Helper.app/Contents/MacOS/Electron Helper" "release/mac-arm64/Electron.app/Contents/MacOS/KidsViewer"
                    chmod +x "release/mac-arm64/Electron.app/Contents/MacOS/KidsViewer"
                    print_success "Fixed missing executable"
                else
                    print_warning "Could not find Electron Helper to copy"
                fi

                print_success "Electron application built successfully!"
                print_info "Built files are available in the release/ directory"
            else
                print_error "No build artifacts found. Build failed completely."
                print_info "Try running: npm run electron-build manually to see detailed error"
                exit 1
            fi
        }
    fi

    # If we reach here, build was successful
    print_success "Electron application built successfully!"
    print_info "Built files are available in the release/ directory"
}

# Fix macOS security issues for Electron app
electron_fix_macos() {
    print_header "Fixing macOS Security Issues"

    if [ ! -d "release/mac-arm64/Electron.app" ]; then
        print_error "Electron app not found. Please run electron-build first."
        exit 1
    fi

    print_info "Removing quarantine attributes..."
    xattr -d com.apple.quarantine release/mac-arm64/Electron.app 2>/dev/null || true

    print_info "Adding execution permissions..."
    chmod +x release/mac-arm64/Electron.app/Contents/MacOS/KidsViewer

    print_info "Signing the application (ad-hoc signing)..."
    codesign --force --deep --sign - release/mac-arm64/Electron.app

    if [ $? -eq 0 ]; then
        print_success "macOS security issues fixed!"
        print_info "You can now run the application without security warnings"
        print_info "To run: open release/mac-arm64/Electron.app"
    else
        print_warning "Code signing failed, but app should still work"
        print_info "You may need to allow the app in System Preferences > Security & Privacy"
    fi
}

# ----- iOS development with live reload -----
ios_dev() {
    print_header "Starting iOS Development with Live Reload"

    check_dependencies
    install_npm_deps

    # Start dev server with hot reload
    print_info "Starting development server with hot reload..."

    # Simple approach: run npm dev and capture output to file
    npm run dev >.vite-port-output 2>&1 &
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
        if command -v ifconfig &>/dev/null; then
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
    cat >capacitor.config.json <<EOF
{
  "appId": "com.wl4g.kidsviewer",
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
    if ! command -v xcodebuild &>/dev/null; then
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
    done <<<"$DEVICES"

    # Display devices with index numbers
    for i in "${!DEVICE_ARRAY[@]}"; do
        echo "  $((i + 1)). ${DEVICE_ARRAY[$i]}"
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
    SELECTED_DEVICE="${DEVICE_ARRAY[$((DEVICE_CHOICE - 1))]}"

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

ios_simulator_list() {
    print_header "Listing iOS Simulators"

    # Check Xcode installation
    if ! command -v xcrun &>/dev/null; then
        print_error "Xcode command line tools not found, please install Xcode from Mac App Store"
        exit 1
    fi

    # Get available iOS simulator devices
    print_info "Available iOS simulator devices:"
    echo ""

    # Direct parsing of simulator devices
    DEVICES=$(xcrun simctl list devices | grep -v "^==" | grep "(" | sed 's/^[ \t]*//')

    if [ -z "$DEVICES" ]; then
        print_error "No available iOS simulator devices found"
        print_info "Please create a simulator device in Xcode first"
        exit 1
    fi

    # Display devices with index numbers
    DEVICE_ARRAY=()
    while IFS= read -r line; do
        DEVICE_ARRAY+=("$line")
    done <<<"$DEVICES"

    # Display devices in table format
    printf "  %-3s %-2s %-25s %-40s %-10s\n" "No." "St" "Device Name" "Device ID" "Status"
    printf "  %-3s %-2s %-25s %-40s %-10s\n" "---" "--" "-----------" "---------" "------"

    for i in "${!DEVICE_ARRAY[@]}"; do
        DEVICE_LINE="${DEVICE_ARRAY[$i]}"
        DEVICE_NAME=$(echo "$DEVICE_LINE" | sed -E 's/^([^(]+).*/\1/' | xargs)
        DEVICE_ID=$(echo "$DEVICE_LINE" | sed -E 's/.*\(([0-9A-F-]+)\).*/\1/')

        # Extract state from the end of the line
        if [[ "$DEVICE_LINE" == *"(Booted)"* ]]; then
            DEVICE_STATE="Booted"
            STATUS_EMOJI="🟢"
        else
            DEVICE_STATE="Shutdown"
            STATUS_EMOJI="⚪"
        fi

        # Format index with leading zero for two digits
        INDEX=$(printf "%02d" $((i + 1)))

        # Truncate device name if too long
        if [ ${#DEVICE_NAME} -gt 25 ]; then
            DEVICE_NAME="${DEVICE_NAME:0:22}..."
        fi

        printf "  %-3s %-2s %-25s %-40s %-10s\n" "$INDEX" "$STATUS_EMOJI" "$DEVICE_NAME" "$DEVICE_ID" "$DEVICE_STATE"
    done

    echo ""
    print_success "Simulator list completed"
}

ios_simulator_reset() {
    print_header "Resetting iOS Simulator"

    # Check Xcode installation
    if ! command -v xcrun &>/dev/null; then
        print_error "Xcode command line tools not found, please install Xcode from Mac App Store"
        exit 1
    fi

    # Get available iOS simulator devices
    print_info "Fetching available iOS simulator devices..."

    # Direct parsing of simulator devices
    DEVICES=$(xcrun simctl list devices | grep -v "^==" | grep "(" | sed 's/^[ \t]*//')

    if [ -z "$DEVICES" ]; then
        print_error "No available iOS simulator devices found"
        print_info "Please create a simulator device in Xcode first"
        exit 1
    fi

    # Display available devices and prompt user to select one
    echo ""
    print_info "Available iOS simulator devices:"
    echo ""

    # Create array of device IDs and names
    DEVICE_ARRAY=()
    while IFS= read -r line; do
        DEVICE_ARRAY+=("$line")
    done <<<"$DEVICES"

    # Display devices with index numbers
    for i in "${!DEVICE_ARRAY[@]}"; do
        echo "  $((i + 1)). ${DEVICE_ARRAY[$i]}"
    done

    echo ""
    read -p "Select a device to reset (1-${#DEVICE_ARRAY[@]}): " DEVICE_CHOICE

    # Validate input
    if ! [[ "$DEVICE_CHOICE" =~ ^[0-9]+$ ]] || [ "$DEVICE_CHOICE" -lt 1 ] || [ "$DEVICE_CHOICE" -gt "${#DEVICE_ARRAY[@]}" ]; then
        print_error "Invalid selection"
        exit 1
    fi

    # Get selected device ID
    SELECTED_DEVICE="${DEVICE_ARRAY[$((DEVICE_CHOICE - 1))]}"

    # Format: "DEVICE_NAME (UDID) (STATE)"
    DEVICE_NAME=$(echo "$SELECTED_DEVICE" | sed -E 's/^([^(]+).*/\1/' | xargs)
    DEVICE_ID=$(echo "$SELECTED_DEVICE" | sed -E 's/.*\(([0-9A-F-]+)\).*/\1/')

    print_info "Selected device: $DEVICE_NAME (ID: $DEVICE_ID)"

    # Warning about reset
    print_warning "This will completely reset the simulator and delete ALL data!"
    print_warning "All installed apps, settings, and user data will be lost!"
    echo ""
    read -p "Are you sure you want to reset this simulator? (yes/no): " CONFIRM

    if [ "$CONFIRM" = "yes" ]; then
        print_info "Resetting simulator $DEVICE_NAME..."

        # Shutdown simulator if running
        print_info "Shutting down simulator if running..."
        xcrun simctl shutdown "$DEVICE_ID" 2>/dev/null || true

        # Erase simulator
        print_info "Erasing simulator data..."
        xcrun simctl erase "$DEVICE_ID"

        if [ $? -eq 0 ]; then
            print_success "Simulator reset completed successfully!"
            print_info "The simulator is now in a clean state with no installed apps"
        else
            print_error "Failed to reset simulator"
            exit 1
        fi
    else
        print_info "Operation cancelled"
    fi
}

ios_build() {
    # iOS build for personal device without Apple Developer account
    print_header "Building iOS Package for Personal Device"

    check_dependencies
    install_npm_deps

    # Build project
    build_project

    # Sync Capacitor resources
    print_info "Syncing iOS resources..."
    npx cap sync ios

    # Check Xcode installation
    if ! command -v xcodebuild &>/dev/null; then
        print_error "Xcode not found, please install Xcode from Mac App Store"
        print_info "After installing Xcode, run: sudo xcode-select --switch /Applications/Xcode.app"
        exit 1
    fi

    # Check CocoaPods installation
    if ! command -v pod &>/dev/null; then
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

# ----- Start for web development -----
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

# ----- Build for web production -----
web_build() {
    print_header "Building for Production"

    check_dependencies
    install_npm_deps
    build_project

    print_success "Production build completed!"
}

# ----- Ethereum contracts functions -----
ethereum_build() {
    print_header "Building Ethereum Contracts"

    # Check if contracts run script exists
    if [ ! -f "contracts/run.sh" ]; then
        print_error "Contracts run script not found"
        exit 1
    fi

    # Call contracts run script
    cd contracts
    ./run.sh ethereum-build
    cd ..
}

ethereum_test() {
    print_header "Testing Ethereum Contracts"

    # Check if contracts run script exists
    if [ ! -f "contracts/run.sh" ]; then
        print_error "Contracts run script not found"
        exit 1
    fi

    # Call contracts run script
    cd contracts
    ./run.sh ethereum-test
    cd ..
}

# ----- Starknet contracts functions -----
starknet_build() {
    print_header "Building Starknet Contracts"

    # Check if contracts run script exists
    if [ ! -f "contracts/run.sh" ]; then
        print_error "Contracts run script not found"
        exit 1
    fi

    # Call contracts run script
    cd contracts
    ./run.sh starknet-build
    cd ..
}

starknet_test() {
    print_header "Testing Starknet Contracts"

    # Check if contracts run script exists
    if [ ! -f "contracts/run.sh" ]; then
        print_error "Contracts run script not found"
        exit 1
    fi

    # Call contracts run script
    cd contracts
    ./run.sh starknet-test
    cd ..
}

# ----- All contracts functions -----
contracts_build() {
    print_header "Building All Contracts"

    # Check if contracts run script exists
    if [ ! -f "contracts/run.sh" ]; then
        print_error "Contracts run script not found"
        exit 1
    fi

    # Call contracts run script
    cd contracts
    ./run.sh contracts-build
    cd ..
}

contracts_test() {
    print_header "Testing All Contracts"

    # Check if contracts run script exists
    if [ ! -f "contracts/run.sh" ]; then
        print_error "Contracts run script not found"
        exit 1
    fi

    # Call contracts run script
    cd contracts
    ./run.sh contracts-test
    cd ..
}

# ----- Next.js Backend functions -----
next_backend_build() {
    print_header "Building Next.js Backend Service"

    # Check if Node.js is installed
    if ! command -v node &>/dev/null; then
        print_error "Node.js not found, please install Node.js 18+ first"
        print_info "Install Node.js: https://nodejs.org/"
        exit 1
    fi

    # Navigate to Next.js backend directory
    if [ ! -d "server/next-kidsviewer" ]; then
        print_error "Next.js backend directory not found"
        exit 1
    fi

    cd server/next-kidsviewer

    print_info "Installing Next.js backend dependencies..."
    npm install

    if [ $? -ne 0 ]; then
        print_error "Failed to install Next.js backend dependencies"
        cd ../..
        exit 1
    fi

    print_info "Building Next.js backend service..."
    npm run build

    if [ $? -ne 0 ]; then
        print_error "Next.js backend build failed"
        cd ../..
        exit 1
    fi

    print_success "Next.js backend service built successfully"
    print_info "Built files are available in server/next-kidsviewer/.next"
    cd ../..
}

next_backend_dev() {
    print_header "Starting Next.js Backend Development Mode"

    # Check if Node.js is installed
    if ! command -v node &>/dev/null; then
        print_error "Node.js not found, please install Node.js 18+ first"
        print_info "Install Node.js: https://nodejs.org/"
        exit 1
    fi

    # Navigate to Next.js backend directory
    if [ ! -d "server/next-kidsviewer" ]; then
        print_error "Next.js backend directory not found"
        exit 1
    fi

    cd server/next-kidsviewer

    # Check if .env.local exists, create from example if not
    if [ ! -f ".env.local" ] && [ -f "env.example" ]; then
        print_info "Creating .env.local from example..."
        cp env.example .env.local
        print_warning "Please edit .env.local with your settings before running the server"
    fi

    print_info "Installing Next.js backend dependencies..."
    npm install

    if [ $? -ne 0 ]; then
        print_error "Failed to install Next.js backend dependencies"
        cd ../..
        exit 1
    fi

    print_info "Starting Next.js backend service in development mode..."
    print_info "Server will be available at: http://localhost:3000"
    print_warning "Press Ctrl+C to stop the server"
    echo ""

    npm run dev &
    PIDS+=($!)

    # Wait for all background processes
    wait

    cd ../..
}

next_backend_test() {
    print_header "Testing Next.js Backend Service"

    # Check if Node.js is installed
    if ! command -v node &>/dev/null; then
        print_error "Node.js not found, please install Node.js 18+ first"
        print_info "Install Node.js: https://nodejs.org/"
        exit 1
    fi

    # Navigate to Next.js backend directory
    if [ ! -d "server/next-kidsviewer" ]; then
        print_error "Next.js backend directory not found"
        exit 1
    fi

    cd server/next-kidsviewer

    print_info "Installing Next.js backend dependencies..."
    npm install

    if [ $? -ne 0 ]; then
        print_error "Failed to install Next.js backend dependencies"
        cd ../..
        exit 1
    fi

    print_info "Running Next.js backend tests..."
    npm run lint

    if [ $? -ne 0 ]; then
        print_error "Next.js backend linting failed"
        cd ../..
        exit 1
    fi

    print_success "Next.js backend tests passed"
    cd ../..
}

next_backend_setup() {
    print_header "Setting up Next.js Backend Service"

    # Check if Node.js is installed
    if ! command -v node &>/dev/null; then
        print_error "Node.js not found, please install Node.js 18+ first"
        print_info "Install Node.js: https://nodejs.org/"
        exit 1
    fi

    # Navigate to Next.js backend directory
    if [ ! -d "server/next-kidsviewer" ]; then
        print_error "Next.js backend directory not found"
        exit 1
    fi

    cd server/next-kidsviewer

    print_info "Setting up Next.js backend service..."

    # Run setup script if exists
    if [ -f "setup.sh" ]; then
        print_info "Running setup script..."
        chmod +x setup.sh
        ./setup.sh
    else
        print_info "Installing dependencies..."
        npm install

        if [ $? -ne 0 ]; then
            print_error "Failed to install Next.js backend dependencies"
            cd ../..
            exit 1
        fi

        # Generate RSA keys if script exists
        if [ -f "scripts/generate-rsa-keys.sh" ]; then
            print_info "Generating RSA keys..."
            chmod +x scripts/generate-rsa-keys.sh
            ./scripts/generate-rsa-keys.sh
        fi

        # Create .env.local from example if not exists
        if [ ! -f ".env.local" ] && [ -f "env.example" ]; then
            print_info "Creating .env.local from example..."
            cp env.example .env.local
            print_warning "Please edit .env.local with your settings"
        fi
    fi

    print_success "Next.js backend setup completed"
    print_info "Next steps:"
    print_info "1. Edit server/next-kidsviewer/.env.local with your configuration"
    print_info "2. Run: ./run.sh next-backend-dev"
    cd ../..
}

# ----- Backend Go service functions -----
go_backend_dev() {
    print_header "Starting Go Backend Development Mode"

    # Check if Go is installed
    if ! command -v go &>/dev/null; then
        print_error "Go not found, please install Go 1.21+ first"
        print_info "Install Go: https://golang.org/doc/install"
        exit 1
    fi

    # Navigate to Go backend directory
    if [ ! -d "server/go-kidsviewer" ]; then
        print_error "Go backend directory not found"
        exit 1
    fi

    cd server/go-kidsviewer

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
    if command -v air &>/dev/null; then
        print_info "Using air for hot reload..."
        air
    else
        print_info "Air not found, running with go run..."
        print_info "Install air for hot reload: go install github.com/cosmtrek/air@latest"
        # Run with CGO enabled for SQLite support
        CGO_ENABLED=1 go run \
            -ldflags="-s -w -X main.version=dev -X main.buildTime=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
            -trimpath \
            ./cmd/main.go
    fi

    cd ../..
}

go_backend_test() {
    print_header "Testing Go Backend Service"

    # Check if Go is installed
    if ! command -v go &>/dev/null; then
        print_error "Go not found, please install Go 1.21+ first"
        print_info "Install Go: https://golang.org/doc/install"
        exit 1
    fi

    # Navigate to Go backend directory
    if [ ! -d "server/go-kidsviewer" ]; then
        print_error "Go backend directory not found"
        exit 1
    fi

    cd server/go-kidsviewer

    print_info "Running Go backend tests..."

    # Run tests with coverage
    go test -v -race -coverprofile=coverage.out ./...

    if [ $? -ne 0 ]; then
        print_error "Go backend tests failed"
        cd ../..
        exit 1
    fi

    # Show coverage if tests passed
    if [ -f "coverage.out" ]; then
        print_info "Test coverage:"
        go tool cover -func=coverage.out | tail -1
    fi

    print_success "Go backend tests passed"
    cd ../..
}

go_backend_build() {
    print_header "Building Go Backend Service"

    # Check if Go is installed
    if ! command -v go &>/dev/null; then
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

    # Navigate to Go backend directory
    if [ ! -d "server/go-kidsviewer" ]; then
        print_error "Go backend directory not found"
        exit 1
    fi

    cd server/go-kidsviewer

    print_info "Building Go backend service..."

    # Build with CGO enabled for SQLite support
    CGO_ENABLED=1 go build \
        -ldflags="-s -w -X main.version=dev -X main.buildTime=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        -trimpath \
        -o kidsviewer-server \
        ./cmd/main.go

    if [ $? -ne 0 ]; then
        print_error "Go backend build failed"
        cd ../..
        exit 1
    fi

    print_success "Go backend service built successfully"
    print_info "Binary is available at: server/go-kidsviewer/kidsviewer-server"
    cd ../..
}

go_backend_migrate_up() {
    print_header "Running Go Backend Database Migrations"

    # Check if Go is installed
    if ! command -v go &>/dev/null; then
        print_error "Go not found, please install Go 1.21+ first"
        print_info "Install Go: https://golang.org/doc/install"
        exit 1
    fi

    # Navigate to Go backend directory
    if [ ! -d "server/go-kidsviewer" ]; then
        print_error "Go backend directory not found"
        exit 1
    fi

    cd server/go-kidsviewer

    # Check if config file exists
    if [ ! -f "config.yaml" ]; then
        if [ -f "config.example.yaml" ]; then
            print_info "Creating config.yaml from example..."
            cp config.example.yaml config.yaml
            print_warning "Please edit config.yaml with your settings before running migrations"
        else
            print_error "No config file found. Please create config.yaml first"
            cd ../..
            exit 1
        fi
    fi

    print_info "Running database migrations..."

    # Build and run migration command
    go build -o kidsviewer-server ./cmd/main.go ./cmd/migrate.go
    ./kidsviewer-server migrate up

    if [ $? -ne 0 ]; then
        print_error "Migration failed"
        cd ../..
        exit 1
    fi

    print_success "Database migrations completed successfully"
    cd ../..
}

go_backend_migrate_status() {
    print_header "Checking Go Backend Migration Status"

    # Check if Go is installed
    if ! command -v go &>/dev/null; then
        print_error "Go not found, please install Go 1.21+ first"
        print_info "Install Go: https://golang.org/doc/install"
        exit 1
    fi

    # Navigate to Go backend directory
    if [ ! -d "server/go-kidsviewer" ]; then
        print_error "Go backend directory not found"
        exit 1
    fi

    cd server/go-kidsviewer

    # Check if config file exists
    if [ ! -f "config.yaml" ]; then
        if [ -f "config.example.yaml" ]; then
            print_info "Creating config.yaml from example..."
            cp config.example.yaml config.yaml
            print_warning "Please edit config.yaml with your settings before checking migration status"
        else
            print_error "No config file found. Please create config.yaml first"
            cd ../..
            exit 1
        fi
    fi

    print_info "Checking migration status..."

    # Build and run migration status command
    go build -o kidsviewer-server ./cmd/main.go ./cmd/migrate.go
    ./kidsviewer-server migrate status

    cd ../..
}

# Unified development start
dev_start() {
    print_header "Starting Unified Development Environment (Frontend + Next.js Backend)..."
    echo ""

    check_dependencies

    # --- Start frontend ---
    print_header "Starting Frontend (React + Vite)..."

    print_info "Installing frontend dependencies..."
    if [ ! -d "node_modules" ]; then
        npm install
    fi

    print_info "Starting Vite development server..."
    print_info "Frontend will be available at: http://localhost:5173"

    npm run dev &
    FRONTEND_PID=$!
    PIDS+=($FRONTEND_PID)

    # Wait for frontend to start.
    sleep 3
    print_success "Frontend started (PID: $FRONTEND_PID)"

    # --- Start backend ---
    print_header "Starting Backend (Next.js Backend)..."

    if [ ! -d "server/next-kidsviewer" ]; then
        print_error "Next.js backend directory not found"
        exit 1
    fi

    cd server/next-kidsviewer

    print_info "Installing backend dependencies..."
    if [ ! -d "node_modules" ]; then
        npm install
    fi

    print_info "Starting Next.js development server..."
    print_info "Backend will be available at: http://localhost:3000"

    npm run dev &
    BACKEND_PID=$!
    PIDS+=($BACKEND_PID)

    cd ../..

    # Wait for backend to start.
    sleep 5
    print_success "Backend started (PID: $BACKEND_PID)"

    # --- Check the services---
    sleep 2

    # Checking the frontend server
    print_info "Checking the frontend..."
    for port in 5173 5174 5175; do
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:$port | grep -q "200"; then
            print_success "Frontend accessible at http://localhost:$port"
            break
        fi
    done

    # Checking the backend server.
    print_info "Checking the backend..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
        print_success "Backend accessible at http://localhost:3000"
    else
        print_warning "Backend not yet ready, may need more time..."
    fi

    # --- Show status ---
    print_header "Development Environment Status"
    echo ""
    print_info "Services running:"
    for pid in "${PIDS[@]}"; do
        if ps -p $pid >/dev/null 2>&1; then
            print_success "Process $pid is running"
        else
            print_error "Process $pid has stopped"
        fi
    done

    echo ""
    print_info "Access URLs:"
    print_info "Frontend: http://localhost:5173 (or 5174/5175)"
    print_info "Backend API: http://localhost:3000/api"
    print_info "Backend Login: http://localhost:3000/login"

    echo ""
    print_warning "Press Ctrl+C to stop all services"

    # Wait for all background processes
    wait
}

# Show help
show_help() {
    echo -e "${BLUE}KidsViewer Unified Run Script${NC}"
    echo ""
    echo "Usage: $0 <command>"
    echo ""
    echo "Development Commands:"
    echo "  dev-start                 Start unified development environment (frontend + backend)"
    echo ""
    echo "Frontend Commands:"
    echo "  electron-dev              Start Electron development mode (with hot reload)"
    echo "  electron-build            Build Electron application for production"
    echo "  electron-build-debug      Build Electron application with debug output"
    echo "  electron-fix-macos        Fix macOS security issues for Electron app"
    echo "  ios-dev                   Start iOS development with live reload in simulator"
    echo "  ios-build                 Build iOS package for personal device (no Apple Developer account needed)"
    echo "  ios-simulator-list        List installed applications on iOS simulator"
    echo "  ios-simulator-reset       Reset iOS simulator (erase all data)"
    echo "  web-dev                   Start web development server"
    echo "  web-build                 Build project for production"
    echo ""
    echo "Backend Commands:"
    echo "  next-backend-setup        Setup Next.js backend service (install deps, generate keys)"
    echo "  next-backend-dev          Run Next.js backend in development mode (npm run dev)"
    echo "  next-backend-test         Test Next.js backend service (npm run lint)"
    echo "  next-backend-build        Build Next.js backend service (npm run build)"
    echo "  go-backend-dev            Run Go backend in development mode with hot reload"
    echo "  go-backend-test           Test Go backend service (go test)"
    echo "  go-backend-build          Build Go backend service (go build)"
    echo "  go-backend-migrate-up     Run Go backend database migrations"
    echo "  go-backend-migrate-status Check Go backend migration status"
    echo ""
    echo "Contract Commands:"
    echo "  ethereum-build            Build Ethereum contracts (forge build)"
    echo "  ethereum-test             Test Ethereum contracts (forge test)"
    echo "  starknet-build            Build Starknet contracts (scarb build)"
    echo "  starknet-test             Test Starknet contracts (snforge test)"
    echo "  contracts-build           Build all contracts (Ethereum + Starknet)"
    echo "  contracts-test            Test all contracts (Ethereum + Starknet)"
    echo ""
    echo "Other Commands:"
    echo "  help                      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev-start              Start unified development environment"
    echo "  $0 electron-dev           Start Electron development with hot reload"
    echo "  $0 electron-build         Build Electron application for production"
    echo "  $0 electron-build-debug   Build Electron with detailed debug output"
    echo "  $0 ios-dev                Start iOS development with live reload"
    echo "  $0 ios-build              Build for personal iOS device"
    echo "  $0 ios-simulator-list     List installed applications on iOS simulator"
    echo "  $0 ios-simulator-reset    Reset iOS simulator (erase all data)"
    echo "  $0 web-dev                Start web development server"
    echo "  $0 web-build              Build project for production"
    echo "  $0 ethereum-test          Test Ethereum contracts"
    echo "  $0 ethereum-build         Build Ethereum contracts"
    echo "  $0 starknet-test          Test Starknet contracts"
    echo "  $0 starknet-build         Build Starknet contracts"
    echo "  $0 contracts-test         Test all contracts"
    echo "  $0 contracts-build        Build all contracts"
    echo "  $0 next-backend-setup     Setup Next.js backend service"
    echo "  $0 next-backend-dev       Run Next.js backend in development mode"
    echo "  $0 next-backend-test      Test Next.js backend service"
    echo "  $0 next-backend-build     Build Next.js backend service"
    echo "  $0 go-backend-dev         Run Go backend in development mode"
    echo "  $0 go-backend-test        Test Go backend service"
    echo "  $0 go-backend-build       Build Go backend service"
    echo "  $0 go-backend-migrate-up  Run Go backend database migrations"
    echo "  $0 go-backend-migrate-status Check Go backend migration status"
    echo ""
}

# Main script logic
case "${1:-help}" in
"electron-dev")
    electron_dev
    ;;
"electron-build")
    electron_build
    ;;
"electron-build-debug")
    electron_build true
    ;;
"electron-fix-macos")
    electron_fix_macos
    ;;
"ios-dev")
    ios_dev
    ;;
"ios-build")
    ios_build
    ;;
"ios-simulator-list")
    ios_simulator_list
    ;;
"ios-simulator-reset")
    ios_simulator_reset
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
"dev-start")
    dev_start
    ;;
"next-backend-setup")
    next_backend_setup
    ;;
"next-backend-dev")
    next_backend_dev
    ;;
"next-backend-test")
    next_backend_test
    ;;
"next-backend-build")
    next_backend_build
    ;;
"go-backend-dev")
    go_backend_dev
    ;;
"go-backend-test")
    go_backend_test
    ;;
"go-backend-build")
    go_backend_build
    ;;
"go-backend-migrate-up")
    go_backend_migrate_up
    ;;
"go-backend-migrate-status")
    go_backend_migrate_status
    ;;
"help" | "-h" | "--help")
    show_help
    ;;
*)
    print_error "Unknown command: $1"
    echo ""
    show_help
    exit 1
    ;;
esac
