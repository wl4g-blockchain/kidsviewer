# KidsViewer 🎯

> 一个跨平台家长控制应用，通过教育挑战以及 Web3 奖励来限制儿童的屏幕时间并促进学习，同时也是培养下一代人们的 Web3 实战经验。

[English docs here](./README.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-Web%20%7C%20iOS%20%7C%20Android%20%7C%20Electron-blue)](https://github.com/your-username/kidsviewer)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)

## 🌟 核心功能

- **📱 跨平台支持**: Web、iOS(Evolving)、Android(Planning) 和桌面端(Electron)
- **🎓 教育挑战**: 如语言表达、数学逻辑、天文知识，自适应难度
- **⏰ 智能时间限制**: 可配置观看时长限制
- **👨‍👩‍👧‍👦 家长控制**: 全面的监控和管理面板
- **🏆 Web3 奖励系统**: 基于区块链的学习成就代币奖励
- **💰 DeFi 集成**: AAVE 协议集成，奖励代币理财管理
- **🔒 链上透明**: 所有奖励和学习记录存储在 Starknet 上
- **📊 学习分析**: 使用统计、答题准确率和进度跟踪

## 🚀 快速开始

> 温馨提示：由于时间原因, iOS dApp 目前还在 Apple 官方审核中, 因此如希望体验最新的功能您可以使用如下统一工具脚本轻松启动。非常感谢！

### 开发工具

```bash
# 本地开发统一命令一键启动
./run.sh dev-start

# 更多操作子命令
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

## 🏗️ 技术架构

**跨平台架构:**
- **前端**: React + TypeScript + Vite
- **后端**: Next.js + NextAuth + Prisma
- **Web3**: Ethereum + Starknet 智能合约
- **移动端**: Capacitor for iOS/Android
- **桌面端**: Electron 跨平台应用

**核心技术:**
- 区块链集成实现透明奖励
- ZK 证明保护隐私的学习记录
- DeFi 协议 (AAVE) 用于奖励代币管理
- 智能合约实现自动化奖励分发

## 📚 详细文档

- [🏗️ 技术架构](./docs/DEVELOPMENT_CN.md#-技术架构) - 设计与技术架构
- [🚀 快速开始](./docs/DEVELOPMENT_CN.md#-快速开始) - 完整开发指南
- [🔧 构建部署](./docs/DEVELOPMENT_CN.md#-构建部署) - 构建和部署
- [📜 智能合约开发](./docs/DEVELOPMENT_CN.md#-智能合约开发) - 智能合约开发
- [🔍 故障排除](./docs/DEVELOPMENT_CN.md#-故障排除) - 故障排除

## 🎯 业务模块

### 家长视图
- **账户设置**: 支持邮箱/设计账号/Wallet 登录/注册，设置家长控制密码
- **儿童管理**: 添加儿童昵称和年龄段 (如 4-6岁/6-12岁)
- **时间限制**: 设置观看限制 (如 20分钟/30分钟/40分钟自动锁定)
- **题目配置**: 自定义教育挑战 (如 语言/数学/英语/天文/其他等等)
- **奖励金库**: 向区块链金库合约存入如 USDC/USDT，透明奖励
- **DeFi 管理**: 家长配置可信的 AAVE 池集成，奖励代币理财
- **分析面板**: 监控使用时间、答题准确率和学习进度

### 儿童功能
- **教育挑战**: 回答问题解锁观看时间
- **自适应学习**: 根据年龄和表现调整题目难度
- **奖励收集**: 正确答案获得代币 (转入存钱罐)
- **进度跟踪**: 查看学习成就和进步情况
- **DeFi 体验**: 通过奖励代币管理学习理财

### Web3 集成
- **区块链奖励**: 所有奖励透明存储在 Starknet 上
- **智能合约**: KidsViewerVault.sol 和 KidsViewerPiggyBank.sol
- **钱包集成**: 连接 Ethereum/Starknet 钱包进行充值
- **DeFi 协议**: AAVE 协议集成，奖励代币理财生息
- **ZK 隐私**: 学习记录和可选的 KYC 信息打包为 ZK 证明（未来可开放 ZK 证明给第三方教育机构验证/广告推送）

## 🌟 为什么选择 KidsViewer？

**解决实际问题:**
- 儿童在娱乐应用上花费过多时间
- 家长难以平衡屏幕时间与学习
- 传统家长控制过于限制性
- 缺乏教育参与激励系统

**我们的解决方案:**
- 通过教育挑战实现游戏化学习
- Web3 奖励教授金融素养
- 基于区块链的透明进度跟踪
- 灵活的时间管理与学习激励

**影响力:**
- 将被动消费转化为主动学习
- 让我们下一代孩子们提前了解未来 Web3 数字世界的概念，如 DeFi 能让孩子从小具备财商意识
- 为家长提供详细的学习分析
- 通过奖励创造可持续的学习习惯，做事可持续坚持的态度

## 🤝 贡献

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 代码规范
- 新代码使用 TypeScript/Golang/Rust
- 遵循标准的 ESLint 配置
- 为新功能编写单元测试
- 根据需求更新文档

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- React 团队提供的优秀框架
- Vite 团队提供的快速构建工具
- Next.js 团队提供的全栈解决方案
- Capacitor 团队提供的跨平台移动开发
- 其他优秀依赖库的开发团队的贡献

## 📞 支持

- 📧 邮箱: ~~support@kidsviewer.app~~
- 🐛 问题: [GitHub Issues](https://github.com/wl4g-hackathon/kidsviewer/issues)
- 💬 讨论: [GitHub Discussions](https://github.com/wl4g-hackathon/kidsviewer/discussions)

---

**用 ❤️ 为更好的数字育儿而打造**
