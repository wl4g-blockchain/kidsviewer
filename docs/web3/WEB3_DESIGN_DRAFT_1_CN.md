# KidsViewer Web3 集成功能

## 概述

KidsViewer 现已集成 Web3 功能，为儿童学习提供奖励机制和理财教育。这是一个实验性功能，旨在帮助孩子理解金钱概念并激励学习。

## 功能特性

### 1. 奖励金库管理 (Reward Vault)

**位置**: 设置页面 → 奖励金库

**功能**:
- 家长可以开启/关闭奖励功能
- 支持 USDC、USDT、KRC (Knowledge Reward Coin) 代币
- 设置每次正确回答的奖励数量
- 设置每日奖励上限
- 连接以太坊或 Starknet 钱包
- 充值到金库合约

**技术实现**:
- 支持以太坊 (MetaMask) 和 Starknet (ArgentX, Braavos) 钱包
- 智能合约交互 (KidsViewerVault.sol)
- ERC20 代币批准和转账

### 2. 存钱罐理财管理 (Piggy Bank Investment)

**位置**: 设置页面 → 存钱罐

**功能**:
- 家长可以开启/关闭自动理财功能
- 设置投资比例 (0-100%)
- 设置每日和累计最大投资额
- 选择 AAVE 理财产品
- 显示当前余额和收益

**技术实现**:
- 自动将奖励转入存钱罐合约 (KidsViewerPiggyBank.sol)
- 集成 AAVE 协议进行理财
- 实时显示每日和总收益

### 3. 孩子视图显示

**位置**: 孩子主页

**功能**:
- 显示当前奖励配置
- 显示存钱罐余额和收益
- 实时更新理财收益
- 激励孩子继续学习

## 技术架构

### 文件结构

```
src/
├── types/web3.ts                    # Web3 类型定义
├── utils/web3Utils.ts               # Web3 工具函数
├── services/web3Service.ts          # 智能合约交互服务
├── components/
│   ├── WalletConnectModal.tsx       # 钱包连接模态框
│   ├── RewardVaultManager.tsx       # 奖励金库管理组件
│   └── PiggyBankManager.tsx         # 存钱罐理财管理组件
└── i18n/locales/
    ├── en.json                      # 英文翻译
    └── zh.json                      # 中文翻译
```

### 智能合约

**KidsViewerVault.sol** (以太坊/Starknet):
- `deposit()`: 充值代币到金库
- `withdraw()`: 从金库提取代币
- `getBalance()`: 查询用户余额
- `transferToPiggyBank()`: 转账到存钱罐

**KidsViewerPiggyBank.sol** (以太坊/Starknet):
- `deposit()`: 存入奖励
- `investInAave()`: 投资到 AAVE 协议
- `getBalance()`: 查询余额
- `getDailyEarnings()`: 查询每日收益
- `getTotalEarnings()`: 查询总收益

### 支持的网络

- **以太坊主网**: 支持 MetaMask 等钱包
- **Starknet 主网**: 支持 ArgentX、Braavos 等钱包

### 支持的代币

- **USDC**: USD Coin (6 位小数)
- **USDT**: Tether USD (6 位小数)  
- **KRC**: Knowledge Reward Coin (自定义代币)

## 使用方法

### 家长设置

1. 进入设置页面
2. 点击"奖励金库"或"存钱罐"卡片
3. 开启相应功能
4. 连接钱包
5. 配置奖励参数或理财设置
6. 充值到金库

### 孩子体验

1. 在主页查看奖励和理财信息
2. 通过正确回答问题获得奖励
3. 查看存钱罐余额和收益
4. 学习金钱和投资概念

## 安全考虑

- 实验性功能，仅使用小额资金
- 所有交易需要家长钱包确认
- 智能合约经过审计 (待实现)
- 私钥安全由用户钱包管理

## 开发说明

### 环境要求

- Node.js 18+
- 支持 Web3 的浏览器
- MetaMask 或 Starknet 钱包

### 安装依赖

```bash
npm install ethers starknet
```

### 开发模式

```bash
npm run dev
```

### 构建

```bash
npm run build
```

## 未来计划

- [ ] 智能合约部署和测试
- [ ] 更多 DeFi 协议集成
- [ ] 游戏化元素
- [ ] 家长控制面板
- [ ] 多链支持
- [ ] 移动端优化

## 注意事项

⚠️ **重要**: 这是一个实验性功能，请谨慎使用，仅使用小额资金进行测试。在生产环境中使用前，请确保智能合约经过充分审计。

## 联系支持

如有问题或建议，请联系开发团队。
