# 路径映射说明

## 两种模式的路径对比

### 前后端分离模式 (Vite + React Router)
- **首页**: `/parental-page` (家长) 或 `/person-page` (儿童)
- **设置**: `/settings`
- **子账户管理**: `/sub-accounts`
- **个人资料**: `/profile`
- **登录**: `/login`

### Next.js SSR 模式
- **首页**: `/app`
- **设置**: `/app/settings`
- **子账户管理**: `/app/sub-accounts`
- **个人资料**: `/app/profile`
- **登录**: `/login`

## 页面文件结构

```
server/next-kidsviewer/app/
├── page.tsx                    # 根页面 (重定向到 /app 或 /login)
├── login/
│   └── page.tsx               # 登录页面
└── app/
    ├── page.tsx               # 主应用页面 (动态导入 AppNextJS)
    ├── settings/
    │   └── page.tsx           # 设置页面 (动态导入 SettingsPage)
    ├── sub-accounts/
    │   └── page.tsx           # 子账户管理 (动态导入 SubAccountManagement)
    └── profile/
        └── page.tsx           # 个人资料 (动态导入 UserProfilePage)
```

## 动态导入机制

所有页面都使用动态导入来引用 `src/` 目录中的组件：

```typescript
const SettingsPage = dynamic(() => 
  import('../../../../src/pages/SettingsPage').then(mod => ({ 
    default: mod.SettingsPage 
  })), { 
    ssr: false,
    loading: () => <LoadingComponent />
  }
)
```

## 兼容性处理

### Navigation 组件
- 自动检测环境 (Next.js vs Vite)
- 根据环境使用不同的路径和 Link 组件

### UserSwitcher 组件
- 使用 `CompatibleLink` 组件
- 自动转换路径格式

### AuthGuard 组件
- 支持两种路由系统的重定向
- 自动检测环境并使用相应的导航方法

## 使用建议

1. **开发阶段**: 使用前后端分离模式 (`npm run dev:unified`)
2. **测试阶段**: 使用 Next.js SSR 模式 (`cd server/next-kidsviewer && npm run dev`)
3. **生产部署**: 使用 Next.js SSR 模式 (`vercel --prod`)

## 注意事项

- 所有页面组件都从 `src/` 目录动态导入，避免重复编写
- 路径转换逻辑确保两种模式下都能正常工作
- 组件会自动检测运行环境并适配相应的路由系统
