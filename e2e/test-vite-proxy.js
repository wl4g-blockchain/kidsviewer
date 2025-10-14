#!/usr/bin/env node

// 测试 Vite 代理配置是否工作
const fetch = require('node-fetch');

async function testProxy() {
  console.log('🧪 测试 Vite 代理配置...\n');
  
  try {
    // 测试代理到 NextJS API
    const response = await fetch('http://localhost:5173/api/auth/public-key');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ 代理配置成功！');
      console.log('📡 响应状态:', response.status);
      console.log('📄 响应数据:', data);
    } else {
      console.log('❌ 代理配置失败');
      console.log('📡 响应状态:', response.status);
      console.log('📄 响应文本:', await response.text());
    }
  } catch (error) {
    console.log('❌ 连接失败:', error.message);
    console.log('\n💡 请确保：');
    console.log('   1. Vite 开发服务器正在运行 (npm run dev)');
    console.log('   2. NextJS 服务器正在运行 (cd server/next-kidsviewer && npm run dev)');
  }
}

testProxy();
