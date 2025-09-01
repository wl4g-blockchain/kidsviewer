#!/bin/bash

echo "🚀 启动 KidsViewer Electron 应用..."

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 检查Electron是否安装
if [ ! -d "node_modules/electron" ]; then
    echo "⚡ 安装Electron依赖..."
    npm install electron electron-builder @electron-toolkit/utils --save-dev
fi

# 构建项目
echo "🔨 构建项目..."
npm run build

# 启动Electron
echo "🎯 启动Electron应用..."
npm run electron

echo "✅ KidsViewer 已启动！" 