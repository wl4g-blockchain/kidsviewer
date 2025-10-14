# KidsViewer Web3 Integration

## 概述

KidsViewer 现已集成 Reown AppKit，支持多种登录方式和 Web3 功能。

## 功能特性

### 1. 多种登录方式
- **传统登录**: 邮箱/手机号 + 密码
- **Web3 登录**: 
  - 邮箱登录 (OTP 验证)
  - 社交账号登录 (Google, Apple, GitHub, X, Discord, Facebook, Farcaster)
  - 钱包登录 (MetaMask 等)

### 2. 钱包绑定功能
- 社交/邮箱登录用户可绑定额外钱包
- 支持家长设置中的钱包管理
- Reward Vault 充值功能

## 技术实现

### 依赖包
```json
{
  "@reown/appkit": "^1.8.9",
  "@reown/appkit-adapter-wagmi": "^1.8.9",
  "wagmi": "^2.12.0",
  "viem": "^2.21.0",
  "@tanstack/react-query": "^5.90.2"
}
```

### 核心文件
- `src/config/appkit.ts` - AppKit 配置
- `src/services/web3AuthService.ts` - Web3 认证服务
- `src/stores/authStore.ts` - 更新的认证状态管理
- `src/pages/AuthPage.tsx` - 更新的认证页面
- `src/components/web3/RewardVaultManager.tsx` - 更新的奖励金库管理

## 使用方法

### 1. 环境配置
创建 `.env` 文件：
```env
VITE_WALLETCONNECT_APP_ID=your-project-id-here
```

### 2. 获取 WalletConnect Project ID
1. 访问 [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. 创建新项目
3. 复制 Project ID 到环境变量
## 用户流程

### 传统登录用户
1. 选择"传统登录"
2. 输入邮箱/手机号和密码
3. 登录成功后可直接使用所有功能

### Web3 登录用户
1. 选择"Web3 登录"
2. 选择登录方式：
   - 邮箱：输入邮箱，接收 OTP 验证码
   - 社交：点击对应平台按钮
   - 钱包：连接 MetaMask 等钱包
3. 登录成功

### 社交/邮箱用户的钱包绑定
1. 在家长设置中进入"Reward Vault"
2. 启用奖励功能
3. 点击"Bind Wallet"按钮
4. 连接钱包完成绑定
5. 绑定后可进行充值操作

## 安全考虑

1. **AppKit 内置安全**: 使用 Reown AppKit 的内置安全机制
2. **会话管理**: 使用安全的会话存储和验证
3. **钱包验证**: 所有钱包连接都经过验证
4. **社交登录安全**: 使用 OAuth 2.0 标准
5. **钱包绑定**: 社交用户需要额外绑定钱包才能进行金融操作
6. **权限控制**: 家长可控制孩子的奖励和投资权限

## 开发说明

### 添加新的社交提供商
在 `src/config/appkit.ts` 中的 `socials` 数组添加新提供商：
```typescript
socials: [
  'google',
  'x', 
  'github',
  'discord',
  'apple',
  'facebook',
  'farcaster',
  'new-provider' // 添加新提供商
]
```

## 故障排除

### 常见问题
1. **Project ID 错误**: 确保 WalletConnect Project ID 正确
2. **网络连接**: 确保网络连接正常
3. **钱包连接**: 确保用户已安装 MetaMask 等钱包
4. **AppKit 配置**: 检查 AppKit 配置是否正确

### 调试
使用浏览器开发者工具查看控制台日志，所有 Web3 相关操作都有详细日志输出。
