# KidsViewer Development Guide

## 📖 Project Overview

KidsViewer is a cross-platform parental control application that limits children's screen time and promotes learning through educational challenges. The project adopts a frontend-backend separation architecture, supporting Web, Electron, iOS(Evolving), and Android(Planning) platforms.

## 🏗️ Technical Architecture

### Frontend Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + Headless UI
- **State Management**: Zustand
- **Routing**: React Router
- **Internationalization**: i18next
- **Platform Support**: Web, Electron, iOS (Capacitor)

### Backend Tech Stack

- **Next.js API Service**: Next.js 14 + Prisma + NextAuth (for Early MVP)
- **Golang API Service**: GoORM + Gin + Redis (for Enterprise Planning)
- **Database**: PostgreSQL

### Web3 Tech Stack

- **Blockchain**: Ethereum + Starknet
- **Smart Contracts**: Solidity + Cairo
- **Wallet Integration**: WalletConnect + Web3Modal
- **DeFi Protocol**: AAVE V3
- **Privacy Protection**: ZK-SNARKs (Starknet)

### Project Structure

```
kidsviewer/
├── src/                   # Frontend React application
│   ├── components/        # React components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom Hooks
│   ├── stores/            # State management
│   ├── services/          # API services
│   └── utils/             # Utility functions
├── server/
│   ├── next-kidsviewer/   # Next.js backend API service (for Early MVP)
│   │   ├── app/api/       # API routes
│   │   ├── prisma/        # Database schema
│   │   └── lib/           # Backend utilities
│   └── go-kidsviewer/     # Golang backend API microservice (for Enterprise Planning)
├── contracts/             # Smart contracts
│   ├── ethereum/          # Solidity contracts
│   │   ├── src/           # Contract source code
│   │   ├── test/          # Contract tests
│   │   └── script/         # Deployment scripts
│   └── starknet/          # Cairo contracts
│       ├── src/           # Contract source code
│       └── tests/         # Contract tests
├── docs/                  # Project documentation
├── ios/                   # iOS native project
├── android/               # Android native project
└── electron/              # Electron configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database
- iOS development requires Xcode (macOS)
- ~~Android development requires Android Studio~~

### One-Click Start (Recommended)

```bash
# Start web frontend + backend services
./run.sh dev-start

# For iOS app development
./run.sh ios-dev
```

### Separate Start

```bash
# Start frontend
./run.sh web-dev

# Start backend (new terminal)
./run.sh next-backend-dev
```

## 🌐 Access Points

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000/api

## 🔧 Development Workflow

### Daily Development

```bash
# Unified start (recommended)
./run.sh dev-start

# Or start separately
./run.sh web-dev &           # Frontend (port 5173)
./run.sh next-backend-dev &  # Backend (port 3001)

# Platform-specific development
./run.sh ios-dev             # iOS development + simulator
./run.sh android-dev         # Android development
./run.sh electron-dev        # Electron development
```

### Build & Deploy

```bash
# Frontend build
./run.sh web-build           # Build frontend static files
./run.sh web-preview         # Preview build results

# Application build
./run.sh electron-prod       # Build Electron application
./run.sh ios-build           # Build iOS application

# Backend build
./run.sh next-backend-build  # Build Next.js backend
```

### Database Operations

```bash
# Database management
cd server/next-kidsviewer
npx prisma migrate reset    # Reset database
npx prisma migrate dev      # Create new migration
npx prisma studio           # Open database management interface
npx prisma generate         # Generate Prisma client
```

### Smart Contract Development

```bash
# Ethereum contracts
cd contracts/ethereum
forge build                # Compile contracts
forge test                 # Run tests
forge deploy               # Deploy contracts

# Starknet contracts
cd contracts/starknet
scarb build                # Compile contracts
scarb test                 # Run tests
snforge test               # Run tests
```

## 🗄️ Database

### Data Models

- User Management (User)
- Person Management (Person)
- Question Management (Question)
- Session Records (Session)
- Reward Records (Reward)

### Database Maintenance

```bash
# Generate Prisma client
cd server/next-kidsviewer
npx prisma generate

# Run migrations
npx prisma migrate dev

# View database
npx prisma studio
```

## 🔧 Configuration Management

### Environment Variables

```bash
# Backend configuration (server/next-kidsviewer/.env.local)
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
```

### Application Configuration

- Frontend configuration: `src/config/`
- Backend configuration: `server/next-kidsviewer/config/`
- Smart contract configuration: `contracts/`

## 🧪 Testing

### Unit Testing

```bash
# Frontend testing
npm run test

# Backend testing
cd server/next-kidsviewer
npm run test
```

### Integration Testing

```bash
# End-to-end testing
npm run test:e2e
```

## 📦 Build & Deploy

### Web Deployment

- Platform: Vercel
- Configuration: `vercel.json`
- Auto deployment: GitHub Actions

### Mobile Applications

- iOS: App Store Connect
- ~~Android: Google Play Console~~

### Desktop Applications

- macOS: Code signing + notarization
- Windows: Code signing
- Linux: AppImage / Snap

## 🐛 Troubleshooting

### Common Issues

#### Port Conflicts

```bash
# Check port usage
lsof -i :5173
lsof -i :3000

# Kill processes
kill -9 <PID>
```

#### Dependency Issues

```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Database Connection

```bash
# Check environment variables
cat server/next-kidsviewer/.env.local

# Regenerate Prisma client
cd server/next-kidsviewer
npx prisma generate
```

## 📚 Related Documentation

- [iOS Distribution Guide](./ios/IOS_DISTRIBUTION_EN.md)
- [Web3 Design Document](./web3/WEB3_DESIGN_DRAFT_1_CN.md)
- [Smart Contract Documentation](../contracts/README.md)
- [API Documentation](../server/next-kidsviewer/README.md)
