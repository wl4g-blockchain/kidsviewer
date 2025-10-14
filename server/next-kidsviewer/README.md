# KidsViewer Next.js Backend

基于 Next.js + Next-Auth 的后端服务，提供用户认证、租户管理、邀请系统等功能。

## 功能特性

- 🔐 **多平台登录**: 支持 Google、GitHub 和邮箱密码登录
- 👥 **租户系统**: 支持家庭/组织管理，主账号和子账号
- 📧 **邀请系统**: 邀请码管理，支持使用统计和过期设置
- 🌍 **国际化**: 支持中文和英文界面
- 🎨 **主题切换**: 支持浅色、深色和系统主题
- 🛡️ **安全验证**: 集成 Cloudflare Turnstile 验证码
- 🔒 **密码加密**: RSA 加密传输，SHA256 存储

## 技术栈

- **框架**: Next.js 14 (App Router)
- **认证**: Next-Auth.js
- **数据库**: PostgreSQL + Prisma
- **UI**: Tailwind CSS + Radix UI
- **国际化**: react-i18next
- **主题**: next-themes
- **验证码**: Cloudflare Turnstile

## 项目结构

```
server/next-kidsviewer/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── auth/          # 认证相关 API
│   │   ├── tenant/        # 租户管理 API
│   │   └── invitation/     # 邀请系统 API
│   ├── login/             # 登录页面
│   ├── settings/          # 设置页面
│   └── tenant/            # 租户管理页面
├── components/            # React 组件
│   ├── providers/         # Context 提供者
│   ├── ui/               # UI 组件库
│   └── auth/             # 认证相关组件
├── lib/                  # 工具库
│   ├── auth.ts          # Next-Auth 配置
│   ├── prisma.ts        # Prisma 客户端
│   ├── i18n.ts          # 国际化配置
│   └── utils.ts         # 工具函数
├── prisma/              # 数据库相关
│   ├── schema.prisma    # 数据库模式
│   └── seed.js          # 种子数据
└── scripts/             # 脚本文件
    └── generate-rsa-keys.sh  # RSA 密钥生成
```

## 数据库模式

### 核心表结构

- **sys_tenant**: 租户/家庭信息
- **sys_user**: 用户信息 (user_type: 1=主账号, 2=子账号)
- **sys_invitation_code**: 邀请码
- **sys_invitation_usage**: 邀请码使用记录

### NextAuth.js 表

- **User**: NextAuth 用户表
- **Account**: OAuth 账户关联
- **Session**: 会话管理
- **VerificationToken**: 验证令牌

## 快速开始

### 1. 安装依赖

```bash
cd server/next-kidsviewer
npm install
```

### 2. 环境配置

复制环境变量示例文件：

```bash
cp env.example .env.local
```

配置必要的环境变量：

```env
# 数据库连接
DATABASE_URL="postgresql://username:password@localhost:5432/kidsviewer"

# NextAuth.js 配置
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-secret-key"

# OAuth 提供商
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# RSA 密钥 (用于密码加密)
RSA_PUBLIC_KEY="your-base64-public-key"
RSA_PRIVATE_KEY="your-base64-private-key"

# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY="your-site-key"
TURNSTILE_SECRET_KEY="your-secret-key"
```

### 3. 生成 RSA 密钥

```bash
npm run generate:rsa-keys
```

### 4. 数据库设置

```bash
# 推送数据库模式
npm run migrate:db:upgrade:from-schema

# 运行种子数据
npm run migrate:db:init:data
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3001

## 部署到 Vercel

### 1. 项目配置

项目已配置 `vercel.json` 以支持非标准目录部署：

```json
{
  "buildCommand": "cd server/next-kidsviewer && npm run build",
  "outputDirectory": "server/next-kidsviewer/.next",
  "installCommand": "cd server/next-kidsviewer && npm install",
  "framework": "nextjs",
  "rootDirectory": "server/next-kidsviewer"
}
```

### 2. 环境变量

在 Vercel 控制台中设置所有必要的环境变量。

### 3. 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

## API 接口

### 认证相关

- `POST /api/auth/register` - 用户注册
- `GET /api/auth/public-key` - 获取 RSA 公钥

### 租户管理

- `GET /api/tenant/info` - 获取租户信息
- `PUT /api/tenant/info` - 更新租户信息
- `GET /api/tenant/sub-accounts` - 获取子账号列表
- `POST /api/tenant/sub-accounts` - 创建子账号
- `DELETE /api/tenant/sub-accounts` - 删除子账号

### 邀请系统

- `GET /api/invitation` - 获取邀请码列表
- `POST /api/invitation` - 创建邀请码
- `PUT /api/invitation` - 更新邀请码状态
- `DELETE /api/invitation` - 删除邀请码

## 开发说明

### 添加新的 API 路由

1. 在 `app/api/` 下创建对应的路由文件
2. 使用 `getServerSession` 进行身份验证
3. 根据用户类型 (`userType`) 进行权限控制

### 添加新的 UI 组件

1. 在 `components/ui/` 下创建基础组件
2. 使用 Tailwind CSS 和 Radix UI
3. 支持主题切换和国际化

### 数据库迁移

```bash
# 生成迁移文件
npx prisma migrate dev --name migration_name

# 应用迁移
npx prisma migrate deploy
```

## 注意事项

1. **非标准目录部署**: 项目位于 `server/next-kidsviewer` 目录，已配置 Vercel 支持
2. **密码安全**: 使用 RSA 加密传输，SHA256 存储
3. **权限控制**: 主账号 (userType=1) 和子账号 (userType=2) 有不同的权限
4. **国际化**: 所有文本都支持中英文切换
5. **主题**: 支持浅色、深色和系统主题

## 许可证

MIT License
