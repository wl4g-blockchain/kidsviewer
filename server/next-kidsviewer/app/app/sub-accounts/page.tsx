'use client'

import dynamic from 'next/dynamic'

// 动态导入外部子账户管理页面组件，避免SSR问题
const SubAccountManagement = dynamic(() => import('../../../../../src/pages/SubAccountManagement').then(mod => ({ default: mod.SubAccountManagement })), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading Sub Account Management...</p>
      </div>
    </div>
  )
})

export default function SubAccountManagementRoute() {
  return <SubAccountManagement />
}
