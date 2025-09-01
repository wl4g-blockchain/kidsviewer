# 🍎 KidsViewer iOS/iPad 打包指南

## 📋 前置要求

### 1. 系统要求
- macOS 12.0 或更高版本
- Xcode 14.0 或更高版本
- iOS 15.0 或更高版本支持

### 2. 必需软件
- [Xcode](https://developer.apple.com/xcode/) (从Mac App Store安装)
- [CocoaPods](https://cocoapods.org/) (Ruby gem)

## 🚀 快速开始

### 方法1: 使用启动脚本（推荐）
```bash
./start-ios.sh
```

### 方法2: 手动步骤
```bash
# 1. 构建项目
npm run build

# 2. 同步Capacitor资源
npx cap sync ios

# 3. 安装iOS依赖
cd ios/App && pod install && cd ../..

# 4. 打开Xcode项目
npx cap open ios
```

## 🔧 详细配置步骤

### 1. 安装Xcode
```bash
# 从Mac App Store安装Xcode
# 或者从Apple Developer网站下载
```

### 2. 配置Xcode命令行工具
```bash
# 切换到完整Xcode
sudo xcode-select --switch /Applications/Xcode.app

# 验证安装
xcodebuild -version
```

### 3. 安装CocoaPods
```bash
sudo gem install cocoapods

# 验证安装
pod --version
```

### 4. 配置iOS项目
```bash
# 同步资源
npx cap sync ios

# 打开项目
npx cap open ios
```

## 📱 Xcode配置

### 1. 项目设置
- **Bundle Identifier**: `com.kidsviewer.app`
- **Deployment Target**: iOS 15.0
- **Devices**: iPhone + iPad

### 2. 签名配置
- 选择您的开发者账户
- 配置Provisioning Profile
- 设置Bundle ID

### 3. 权限配置
在`Info.plist`中添加：
```xml
<key>NSCameraUsageDescription</key>
<string>需要访问相机进行身份验证</string>
<key>NSMicrophoneUsageDescription</key>
<string>需要访问麦克风进行语音识别</string>
```

### 4. iPad支持
- 在General设置中启用iPad支持
- 设置Launch Screen和App Icon

## 🧪 测试和调试

### 1. 模拟器测试
```bash
# 运行iOS模拟器
npx cap run ios

# 指定设备
npx cap run ios --target "iPhone 15 Pro"
```

### 2. 真机测试
- 连接iOS设备
- 在Xcode中选择设备
- 点击运行按钮

### 3. 调试技巧
```bash
# 查看日志
npx cap run ios --livereload

# 同步代码更改
npx cap sync ios
```

## 📦 打包发布

### 1. 构建Release版本
```bash
# 在Xcode中
# Product -> Archive
```

### 2. 导出选项
- **App Store**: 上传到App Store Connect
- **Ad Hoc**: 分发给测试设备
- **Enterprise**: 企业内部分发

### 3. 上传到App Store
- 使用Xcode Organizer
- 或使用`altool`命令行工具

## 🐛 常见问题

### 1. Xcode命令行工具错误
```bash
# 错误: xcode-select: error: tool 'xcodebuild' requires Xcode
# 解决: 安装完整Xcode，不只是命令行工具
sudo xcode-select --switch /Applications/Xcode.app
```

### 2. CocoaPods安装失败
```bash
# 更新Ruby
brew install ruby

# 重新安装CocoaPods
gem install cocoapods
```

### 3. 签名问题
- 检查开发者账户状态
- 验证Provisioning Profile
- 确认Bundle ID匹配

### 4. 设备兼容性
- 检查Deployment Target
- 验证设备支持设置
- 测试不同屏幕尺寸

## 📚 相关资源

- [Capacitor官方文档](https://capacitorjs.com/docs)
- [iOS开发指南](https://developer.apple.com/ios/)
- [Xcode使用教程](https://developer.apple.com/xcode/)
- [CocoaPods文档](https://cocoapods.org/)

## 🆘 获取帮助

如果遇到问题：
1. 查看控制台错误信息
2. 检查Capacitor日志
3. 参考官方文档
4. 在GitHub Issues中搜索

---

**注意**: 首次构建可能需要较长时间，请耐心等待。确保网络连接稳定以下载依赖。 