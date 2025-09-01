# KidsViewer - 儿童视界

一款专为拯救儿童玩手机而设计的智能家长控制应用，通过教育挑战来限制屏幕时间并促进学习。

## 🌟 主要功能

### 家长控制功能

- **时间限制**: 支持 10/15/20/30/40 分钟自动锁定
- **学习解锁**: 通过回答教育问题来解锁继续观看
- **多学科支持**: 数学、语文（繁体字识别）、英语等
- **个性化设置**: 根据孩子年龄段调整难度
- **使用统计**: 详细的每日使用报告和学习进度

### 儿童学习功能

- **智能题库**: 动态随机生成适合年龄的问题
- **进度跟踪**: 记录学习表现和健忘曲线
- **趣味界面**: 专为儿童设计的友好 UI
- **多语言支持**: 中文和英文界面

## 🚀 技术架构

- **前端**: React 18 + TypeScript + Vite
- **桌面端**: Electron 28 (跨平台支持)
- **状态管理**: Zustand
- **样式**: Tailwind CSS
- **国际化**: react-i18next
- **图标**: Lucide React

## 📱 平台支持

1. **iPad/iOS** (优先实现)
2. **Android**
3. **桌面端** (Windows/macOS/Linux)

## 🏗️ 项目结构

```
kidviewer/
├── src/
│   ├── api/              # API 处理器
│   │   ├── IAPIHandler.ts
│   │   └── LocalAPIHandler.ts
│   ├── components/       # 可复用组件
│   ├── hooks/           # 自定义 Hooks
│   ├── i18n/            # 国际化配置
│   ├── pages/           # 页面组件
│   ├── stores/          # 状态管理
│   ├── types/           # TypeScript 类型定义
│   └── utils/           # 工具函数
├── electron/            # Electron 主进程
├── public/              # 静态资源
└── dist/               # 构建输出
```

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装依赖
```bash
npm install
# 或者
yarn install
```

### 开发模式

#### 1. Web开发模式
```bash
npm run dev
```

#### 2. Electron开发模式（推荐）
```bash
npm run electron-dev
```
这将同时启动Vite开发服务器和Electron应用。

#### 3. 仅运行Electron（需要先构建）
```bash
npm run build
npx tsc -p electron/tsconfig.json
npm run electron
```

### 构建和打包

#### 1. 构建Web版本
```bash
npm run build
```

#### 2. 构建Electron应用
```bash
# 构建并打包为桌面应用
npm run electron-build

# 或者分步执行
npm run build
npm run dist
```

#### 3. 构建产物位置
- Web版本: `dist/` 目录
- Electron应用: `release/` 目录

## 📱 iOS/iPad 打包方案

### 方案1: Capacitor (推荐)

#### 1. 安装 Capacitor

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init
```

#### 2. 添加 iOS 平台

```bash
npx cap add ios
```

#### 3. 构建并同步

```bash
npm run build
npx cap sync
npx cap open ios

open ios/App/App.xcworkspace

# Start the Apple Simulator.
open -a Simulator

# Show the All simulation devices.
xcrun simctl list devices
# == Devices ==
# -- iOS 18.6 --
#    iPhone 16 Pro (2E44C96B-66F9-451D-8439-1B5670DCD583) (Shutdown) 
#    iPhone 16 Pro Max (F5C0C199-8170-4D96-9102-4FFB7EEE8784) (Shutdown) 
#    iPhone 16e (26992A73-3E64-46D6-8342-E964978A0660) (Shutdown) 
#    iPhone 16 (9C58C2CD-05E3-406E-A0FF-3ED004A4D057) (Shutdown) 
#    iPhone 16 Plus (C52892AE-4C32-46A1-8DD2-39D33082A0FD) (Shutdown) 
#    iPad Pro 11-inch (M4) (A8163E8A-711F-478B-9FD8-86CD74230039) (Shutdown) 
#    iPad Pro 13-inch (M4) (45C94D7B-D6D0-4342-A01C-C886DD93DCE5) (Shutdown) 
#    iPad mini (A17 Pro) (4A67F379-7F01-4EB2-97A7-8B60905857CA) (Shutdown) 
#    iPad (A16) (419808B3-8D84-4836-8024-2422D2B66D09) (Shutdown) 
#    iPad Air 13-inch (M3) (77D47C11-1848-4DEE-A7EA-0884BBC2BA91) (Shutdown) 
#    iPad Air 11-inch (M3) (B259CACC-A8E5-48F2-A761-128EE8719BBF) (Shutdown) 

# Deploy APP in the simulation Device.
npx cap run ios --target "A8163E8A-711F-478B-9FD8-86CD74230039"
```

#### 4. 在Xcode中配置

- 打开 `ios/App/App.xcworkspace`
- 配置Bundle Identifier
- 设置签名证书
- 配置权限（网络、存储等）

### 方案2: React Native (高级)

#### 1. 创建React Native项目

```bash
npx react-native init KidsViewerRN
```

#### 2. 迁移核心逻辑

- 复制状态管理逻辑
- 迁移API处理
- 适配React Native组件

#### 3. 构建iOS应用

```bash
cd ios
pod install
cd ..
npx react-native run-ios
```

## 🔧 开发指南

### 添加新的视频平台

1. 在 `src/api/` 中添加平台API
2. 在 `src/types/` 中定义类型
3. 在 `src/pages/PersonViewer.tsx` 中集成

### 添加新的问题类型

1. 在 `src/types/index.ts` 中定义问题类型
2. 在 `src/api/` 中添加问题生成逻辑
3. 在UI中实现问题展示

### 国际化

1. 在 `src/i18n/locales/` 中添加翻译
2. 使用 `useTranslation()` Hook
3. 支持动态语言切换

## 🐛 常见问题

### Electron相关问题

#### Q: Electron应用无法启动
A: 检查依赖是否正确安装：
```bash
npm install electron electron-builder @electron-toolkit/utils --save-dev
```

#### Q: BrowserView无法加载外部网站
A: 确保在 `electron/main.ts` 中设置了：
```typescript
webSecurity: false
```

#### Q: 视频平台无法嵌入
A: 使用BrowserView方案，可以绕过CSP限制。

### iOS打包相关问题

#### Q: Capacitor构建失败
A: 检查iOS开发环境：
- 安装Xcode
- 配置开发者证书
- 安装CocoaPods

#### Q: 应用无法访问网络
A: 在 `ios/App/App/Info.plist` 中添加：
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📞 联系我们

如有问题，请通过以下方式联系：
- 邮箱: support@kidsviewer.com
- GitHub Issues: [项目地址] 