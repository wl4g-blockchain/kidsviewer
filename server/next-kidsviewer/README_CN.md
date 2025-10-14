# Next.js KidsViewer Backend

这是一个基于 Next.js 的后端 API 服务，从 lifebook 项目移植而来，提供了完整的用户认证、租户管理和邀请码管理功能。

## 🚀 功能特性

- **用户认证系统**
  - 邮箱密码登录（RSA 加密）
  - GitHub OAuth 登录
  - Google OAuth 登录
  - NextAuth v5 支持

- **租户管理**
  - 租户信息管理
  - 子账号创建和管理
  - 多租户数据隔离

- **邀请码系统**
  - 邀请码生成和管理
  - 使用次数限制
  - 过期时间控制
  - 使用记录追踪

- **数据库支持**
  - PostgreSQL 数据库
  - Prisma ORM
  - 数据库迁移和种子数据

## 📋 环境要求

- Node.js 18+
- PostgreSQL 数据库
- npm 或 yarn

## 🛠️ 安装和配置

### 1. 安装依赖

```bash
npm install
```

### 2. 环境变量配置

复制环境变量示例文件：

```bash
cp env.example .env.local
```

编辑 `.env.local` 文件，配置以下变量：

```env
# 数据库连接
DATABASE_URL="postgresql://username:password@localhost:5432/kidsviewer?schema=public"

# NextAuth 配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OAuth 配置
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# RSA 密钥（用于密码加密）
NEXTAUTH_RSA_PRIVATE_KEY="your-base64-encoded-private-key"
RSA_PUBLIC_KEY="your-base64-encoded-public-key"

# Cloudflare Turnstile（验证码）
TURNSTILE_SITE_KEY="your-turnstile-site-key"
TURNSTILE_SECRET_KEY="your-turnstile-secret-key"
NEXT_PUBLIC_TURNSTILE_SITE_KEY="your-turnstile-site-key"
NEXT_PUBLIC_SKIP_TURNSTILE="false"

# 邀请码配置
INVITATION_MAX_USES="100"
INVITATION_EXPIRES_DAYS="30"

# Prisma 配置
PRISMA_LOG_LEVEL="error"
PRISMA_QUERY_LOG="false"
```

### 3. 生成 RSA 密钥

```bash
npm run generate:rsa-keys
```

这将生成 RSA 密钥对，并将 base64 编码的密钥输出到控制台。复制这些密钥到 `.env.local` 文件中。

### 4. 数据库设置

```bash
# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev

# 填充种子数据
npx prisma db seed
```

## 🚀 运行项目

### 开发模式

```bash
npm run dev
```

### 生产构建

```bash
npm run build
npm start
```

## 📚 API 接口

### 认证相关

- `GET /api/auth/[...nextauth]` - NextAuth 认证端点
- `GET /api/auth/public-key` - 获取 RSA 公钥
- `POST /api/auth/register` - 用户注册

### 租户管理

- `GET /api/tenant/info` - 获取租户信息
- `GET /api/tenant/sub-accounts` - 获取子账号列表
- `POST /api/tenant/sub-accounts` - 创建子账号
- `DELETE /api/tenant/sub-accounts?id={id}` - 删除子账号

### 邀请码管理

- `GET /api/invitation` - 获取邀请码列表
- `POST /api/invitation` - 创建邀请码
- `GET /api/invitation/[id]` - 获取单个邀请码详情
- `PUT /api/invitation/[id]` - 更新邀请码状态
- `DELETE /api/invitation/[id]` - 删除邀请码

## 🗄️ 数据库结构

### 核心表

- `sys_tenant` - 租户表
- `sys_user` - 用户表
- `sys_invitation_code` - 邀请码表
- `sys_invitation_usage` - 邀请码使用记录表
- `t_family` - 家庭表

## 🔧 开发工具

### 数据库管理

```bash
# 打开 Prisma Studio
npm run migrate:studio

# 查看迁移状态
npm run migrate:status

# 重置数据库
npm run migrate:db:drop-all:upgrade
```

### 序列修复

```bash
# 修复 PostgreSQL 序列
npm run fix:sequences
```

## 📝 脚本说明

- `scripts/generate-rsa-keys.sh` - RSA 密钥生成脚本
- `scripts/fix-all-sequences.js` - 数据库序列修复脚本

## 🔒 安全特性

- RSA 密码加密
- Cloudflare Turnstile 验证码
- JWT 会话管理
- 多租户数据隔离
- 软删除机制

## 🚧 注意事项

1. 这是一个临时后端服务，计划后续用纯 Go 语言重新实现
2. 确保在生产环境中正确配置所有环境变量
3. RSA 私钥需要妥善保管，不要提交到版本控制系统
4. 数据库连接字符串包含敏感信息，需要安全存储

## 📄 许可证

本项目采用 MIT 许可证。
