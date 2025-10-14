# KidsViewer 🎯

> A cross-platform parental control app that limits children's screen time and promotes learning through educational challenges and Web3 rewards, while cultivating the next generation children's Web3 practical experience.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-Web%20%7C%20iOS%20%7C%20Android%20%7C%20Electron-blue)](https://github.com/your-username/kidsviewer)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)

## 🌟 Features

- **📱 Cross-Platform**: Web, iOS (Evolving), Android (Planning), and Desktop (Electron)
- **🎓 Educational Challenges**: Language expression, mathematical logic, astronomy knowledge with adaptive difficulty
- **⏰ Smart Time Limits**: Configurable viewing duration restrictions
- **👨‍👩‍👧‍👦 Parental Controls**: Comprehensive monitoring and management dashboard
- **🏆 Web3 Reward System**: Blockchain-powered token rewards for learning achievements
- **💰 DeFi Integration**: AAVE protocol integration for reward token management
- **🔒 Transparent On-Chain**: All rewards and learning records stored on Starknet
- **📊 Learning Analytics**: Usage statistics, answer accuracy, and progress tracking

## 🚀 Quick Start

> **Note**: Due to time constraints, the iOS dApp is currently under Apple's official review. To experience the latest features, you can easily start using our unified tool script below. Thank you very much!

### Development Tooling

```bash
# Unified command to start local development
./run.sh dev-start

# More operation subcommands
./run.sh --help
KidsViewer Unified Run Script

Usage: ./run.sh <command>

Development Commands:
  dev-start                 Start unified development environment (frontend + backend)

Frontend Commands:
  electron-dev              Start Electron development mode (with hot reload)
  electron-build            Build Electron application for production
  electron-build-debug      Build Electron application with debug output
  electron-fix-macos        Fix macOS security issues for Electron app
  ios-dev                   Start iOS development with live reload in simulator
  ios-build                 Build iOS package for personal device (no Apple Developer account needed)
  ios-simulator-list        List installed applications on iOS simulator
  ios-simulator-reset       Reset iOS simulator (erase all data)
  web-dev                   Start web development server
  web-build                 Build project for production

Backend Commands:
  next-backend-build        Build Next.js backend service (npm run build)
  next-backend-dev          Run Next.js backend in development mode (npm run dev)
  next-backend-test         Test Next.js backend service (npm run lint)
  next-backend-setup        Setup Next.js backend service (install deps, generate keys)
  go-backend-build          Build Go backend service (go build)
  go-backend-dev            Run Go backend in development mode with hot reload
  go-backend-test           Test Go backend service (go test)
  go-backend-migrate-up     Run Go backend database migrations
  go-backend-migrate-status Check Go backend migration status

Contract Commands:
  ethereum-build            Build Ethereum contracts (forge build)
  ethereum-test             Test Ethereum contracts (forge test)
  starknet-build            Build Starknet contracts (scarb build)
  starknet-test             Test Starknet contracts (snforge test)
  contracts-build           Build all contracts (Ethereum + Starknet)
  contracts-test            Test all contracts (Ethereum + Starknet)
```

## 🏗️ Technical Overview

**Cross-Platform Architecture:**
- **Frontend**: React + TypeScript + Vite
- **Backend: Next.js API Service**: Next.js 14 + Prisma + NextAuth (for Early MVP)
- **Backend: Golang API Service**: GoORM + Gin + Redis (for Enterprise Planning)
- **Web3**: Ethereum + Starknet smart contracts
- **Mobile**: Capacitor for iOS/Android
- **Desktop**: Electron for cross-platform apps

**Key Technologies:**
- Blockchain integration for transparent rewards
- ZK proofs for privacy-preserving learning records
- DeFi protocols (AAVE) for reward token management
- Smart contracts for automated reward distribution

## 📚 Details Documentation

- [🏗️ Technical Architecture](./docs/DEVELOPMENT.md#️-technical-architecture) - Design & Technical Architiecture
- [🚀 Quick Start](./docs/DEVELOPMENT.md#-quick-start) - Full Develop Guide
- [🔧 Build & Deploy](./docs/DEVELOPMENT.md#-build--deploy) - Build and Deployment
- [📜 Smart Contract Development](./docs/DEVELOPMENT.md#smart-contract-development) - Smart Contract Development
- [🔍 Troubleshooting](./docs/DEVELOPMENT.md#-troubleshooting) - Troubleshooting

## 🎯 Business Modules

### Parent View
- **Account Setup**: Support email/design account/Wallet login/registration, set parental control password
- **Child Management**: Add children with nicknames and age ranges (e.g., 4-6 years/6-12 years)
- **Time Limits**: Set viewing restrictions (e.g., 20 minutes/30 minutes/40 minutes auto-lock)
- **Question Configuration**: Customize educational challenges (e.g., language/math/English/astronomy/others)
- **Reward Vault**: Deposit USDC/USDT to blockchain vault contracts for transparent rewards
- **DeFi Management**: Parents configure trusted AAVE pool integration for reward token management
- **Analytics Dashboard**: Monitor usage time, answer accuracy, and learning progress

### Children View
- **Educational Challenges**: Answer questions to unlock viewing time
- **Adaptive Learning**: Questions adjust based on age and performance
- **Reward Collection**: Earn tokens for correct answers (transferred to piggy bank)
- **Progress Tracking**: View learning achievements and improvement over time
- **DeFi Experience**: Learn about yield farming through reward token management

### Web3 Integration
- **Blockchain Rewards**: All rewards stored transparently on Starknet
- **Smart Contracts**: KidsViewerVault.sol and KidsViewerPiggyBank.sol
- **Wallet Integration**: Connect Ethereum/Starknet wallets for deposits
- **DeFi Protocols**: AAVE protocol integration for reward token yield generation
- **ZK Privacy**: Learning records and optional KYC information packaged as ZK proofs (future ZK proofs can be opened to third-party educational institutions for verification/advertising)

## 🌟 Why KidsViewer?

**Solves Real Problems:**
- Children spend excessive time on entertainment apps
- Parents struggle to balance screen time with learning
- Traditional parental controls are too restrictive
- No incentive system for educational engagement

**Our Solution:**
- Gamified learning through educational challenges
- Web3 rewards that teach financial literacy
- Transparent blockchain-based progress tracking
- Flexible time management with learning incentives

**Impact:**
- Transforms passive consumption into active learning
- Introduces our next generation to future Web3 digital world concepts, enabling children to develop financial intelligence from an early age
- Provides parents with detailed learning analytics
- Creates sustainable learning habits and persistent attitude through rewards

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use TypeScript/Golang/Rust for all new code
- Follow standard ESLint configuration
- Write unit tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- Vite team for the fast build tool
- Next.js team for the full-stack solution
- Capacitor team for cross-platform mobile development
- Other excellent dependency library development teams for their contributions

## 📞 Support

- 📧 Email: ~~support@kidsviewer.app~~
- 🐛 Issues: [GitHub Issues](https://github.com/wl4g-hackathon/kidsviewer/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/wl4g-hackathon/kidsviewer/discussions)

---

**Made with ❤️ for better digital parenting**
