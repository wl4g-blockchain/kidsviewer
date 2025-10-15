# KidsViewer 开发指南

## 📖 项目概述

KidsViewer 是一个跨平台的家长控制应用，通过教育挑战来限制儿童的屏幕时间并促进学习。项目采用前后端分离架构，支持 Web、Electron、iOS(Evolving) 和 Android(Planning) 平台。

## 🏗️ 技术架构

### 前端技术栈

- **框架**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + Headless UI
- **状态管理**: Zustand
- **路由**: React Router
- **国际化**: i18next
- **平台支持**: Web、Electron、iOS (Capacitor)

### 后端技术栈

- **Next.js 版 API 服务**: Next.js 14 + Prisma + NextAuth (for Early MVP)
- **Golang 版 API 服务**: GoORM + Gin + Redis (for Enterprise Planning)
- **数据库**: PostgreSQL

### Web3 技术栈

- **区块链**: Ethereum + Starknet
- **智能合约**: Solidity + Cairo
- **钱包集成**: WalletConnect + Web3Modal
- **DeFi 协议**: AAVE V3
- **隐私保护**: ZK-SNARKs (Starknet)

### 项目结构

```
kidsviewer/
├── src/                   # 前端 React 应用
│   ├── components/        # React 组件
│   ├── pages/             # 页面组件
│   ├── hooks/             # 自定义 Hooks
│   ├── stores/            # 状态管理
│   ├── services/          # API 服务
│   └── utils/             # 工具函数
├── server/
│   ├── next-kidsviewer/   # Next.js 实现的后端 API 服务(for Early MVP)
│   │   ├── app/api/       # API 路由
│   │   ├── prisma/        # 数据库模式
│   │   └── lib/           # 后端工具
│   └── go-kidsviewer/     # Golang 实现的后端 API 微服务(for Enterprise Planning)
├── contracts/             # 智能合约
│   ├── ethereum/          # Solidity 合约
│   │   ├── src/           # 合约源码
│   │   ├── test/          # 合约测试
│   │   └── script/        # 部署脚本
│   └── starknet/          # Cairo 合约
│       ├── src/           # 合约源码
│       └── tests/         # 合约测试
├── docs/                  # 项目文档
├── ios/                   # iOS 原生项目
├── android/               # Android 原生项目
└── electron/              # Electron 配置
```

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- PostgreSQL 数据库
- iOS 开发需要 Xcode (macOS)
- ~~Android 开发需要 Android Studio~~

### 一键启动 (推荐)

```bash
# 启动 web 前端 + 后端服务
./run.sh dev-start

# 如需开发 iOS app
./run.sh ios-dev
```

### 分别启动

```bash
# 启动前端
./run.sh web-dev

# 启动后端 (新终端)
./run.sh next-backend-dev
```

## 🌐 访问地址

- **前端**: http://localhost:5173
- **后端**: http://localhost:3000/api

## 🔧 开发流程

### 日常开发

```bash
# 统一启动 (推荐)
./run.sh dev-start

# 或者分别启动
./run.sh web-dev &           # 前端 (端口 5173)
./run.sh next-backend-dev &  # 后端 (端口 3001)

# 平台特定开发
./run.sh ios-dev             # iOS 开发 + 模拟器
./run.sh android-dev         # Android 开发
./run.sh electron-dev        # Electron 开发
```

### 构建部署

```bash
# 前端构建
./run.sh web-build           # 构建前端静态文件
./run.sh web-preview         # 预览构建结果

# 应用构建
./run.sh electron-prod       # 构建 Electron 应用
./run.sh ios-build           # 构建 iOS 应用

# 后端构建
./run.sh next-backend-build  # 构建 Next.js 后端
```

### 数据库操作

```bash
# 数据库管理
cd server/next-kidsviewer
npx prisma migrate reset     # 重置数据库
npx prisma migrate dev       # 创建新迁移
npx prisma studio           # 打开数据库管理界面
npx prisma generate         # 生成 Prisma 客户端
```

### 智能合约开发

```bash
# Ethereum 合约
cd contracts/ethereum
forge build                 # 编译合约
forge test                 # 运行测试
forge deploy               # 部署合约

# Starknet 合约
cd contracts/starknet
scarb build                # 编译合约
scarb test                 # 运行测试
snforge test               # 运行测试
```

## 🗄️ 数据库

### 数据模型

- 用户管理 (User)
- 人员管理 (Person)
- 问题管理 (Question)
- 会话记录 (Session)
- 奖励记录 (Reward)

### 数据库维护

```bash
# 生成 Prisma 客户端
cd server/next-kidsviewer
npx prisma generate

# 运行迁移
npx prisma migrate dev

# 查看数据库
npx prisma studio
```

## 🔧 配置管理

### 环境变量

```bash
# 后端配置 (server/next-kidsviewer/.env.local)
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
```

### 应用配置

- 前端配置: `src/config/`
- 后端配置: `server/next-kidsviewer/config/`
- 智能合约配置: `contracts/`

## 🧪 测试

### 单元测试

```bash
# 前端测试
npm run test

# 后端测试
cd server/next-kidsviewer
npm run test
```

### 集成测试

```bash
# 端到端测试
npm run test:e2e
```

## 📦 构建部署

### Web 部署

- 平台: Vercel
- 配置: `vercel.json`
- 自动部署: GitHub Actions

### 移动应用

- iOS: App Store Connect
- ~~Android: Google Play Console~~

### 桌面应用

- macOS: 代码签名 + 公证
- Windows: 代码签名
- Linux: AppImage / Snap

## 🐛 故障排除

### 常见问题

#### 端口冲突

```bash
# 查看端口占用
lsof -i :5173
lsof -i :3000

# 杀死进程
kill -9 <PID>
```

#### 依赖问题

```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install
```

#### 数据库连接

```bash
# 检查环境变量
cat server/next-kidsviewer/.env.local

# 重新生成 Prisma 客户端
cd server/next-kidsviewer
npx prisma generate
```

## 📚 相关草稿

- [iOS 分发指南](./ios/IOS_DISTRIBUTION_CN.md)
- [Web3 设计文档](./web3/WEB3_DESIGN_DRAFT_1_CN.md)
- [智能合约文档](../contracts/README.md)
- [API 文档](../server/next-kidsviewer/README.md)
