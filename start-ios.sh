#!/bin/bash

echo "🚀 启动 KidsViewer iOS 开发环境..."

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 构建项目
echo "🔨 构建项目..."
npm run build

# 同步Capacitor资源
echo "📱 同步iOS资源..."
npx cap sync ios

# 检查Xcode是否安装
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ 错误: 未找到Xcode，请从Mac App Store安装Xcode"
    echo "💡 提示: 安装Xcode后，运行 'sudo xcode-select --switch /Applications/Xcode.app'"
    exit 1
fi

# 检查CocoaPods是否安装
if ! command -v pod &> /dev/null; then
    echo "📦 安装CocoaPods..."
    sudo gem install cocoapods
fi

# 安装iOS依赖
echo "📱 安装iOS依赖..."
cd ios/App && pod install && cd ../..

echo "✅ iOS环境准备完成！"
echo "🎯 运行以下命令打开Xcode项目："
echo "   npx cap open ios"
echo ""
echo "📱 或者运行模拟器："
echo "   npx cap run ios" 