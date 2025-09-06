# KidsViewer

A parental control app that limits children's screen time and promotes learning through educational challenges.

## Quick Start

KidsViewer provides a unified run script that simplifies development and deployment across different platforms.

## Electron Available Commands

```bash
# Development mode with hot reload
./run.sh electron-dev

# Production mode
./run.sh electron-prod
```

## Web Development Available Commands

```bash
# Development mode with hot reload
./run.sh web-dev

# Production build
./run.sh web-build
```

## iOS Development Available Commands

### Development with Live Reload

The `ios-dev` command starts a development server with live reload and launches the app in an iOS simulator:

```bash
./run.sh ios-dev
```

This will:

1. Build the project
2. Start a development server
3. Configure the app for live reload
4. Launch the iOS simulator
5. Install and run the app

### Building for Personal Device

The `ios-build` command prepares the app for installation on your personal iOS device without requiring an Apple Developer account:

```bash
./run.sh ios-build
```

This will:

1. Build the project
2. Sync resources with Capacitor
3. Open the Xcode project

For detailed instructions on completing the installation, see [IOS_DISTRIBUTION_COMPLETE_GUIDE.md](./docs/ios/IOS_DISTRIBUTION_COMPLETE_GUIDE.md).
