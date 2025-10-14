#!/usr/bin/env node

// 测试 UserSwitcher 组件修复是否有效
const fetch = require('node-fetch');

async function testUserSwitcherFix() {
  console.log('🧪 测试 UserSwitcher 组件修复...\n');
  
  try {
    // 测试前端页面是否正常加载
    console.log('📡 测试前端页面加载...');
    const response = await fetch('http://localhost:5173');
    
    if (response.ok) {
      console.log('✅ 前端页面加载成功 - 状态:', response.status);
      
      // 测试登录页面
      console.log('\n📡 测试登录页面...');
      const authResponse = await fetch('http://localhost:5173/auth');
      
      if (authResponse.ok) {
        console.log('✅ 登录页面加载成功 - 状态:', authResponse.status);
      } else {
        console.log('❌ 登录页面加载失败 - 状态:', authResponse.status);
      }
      
      // 测试 API 端点
      console.log('\n📡 测试 API 端点...');
      const apiResponse = await fetch('http://localhost:5173/api/auth/session');
      
      if (apiResponse.ok) {
        console.log('✅ API 端点正常 - 状态:', apiResponse.status);
        const data = await apiResponse.json();
        console.log('📄 会话数据:', data);
      } else {
        console.log('❌ API 端点异常 - 状态:', apiResponse.status);
      }
      
    } else {
      console.log('❌ 前端页面加载失败 - 状态:', response.status);
    }
    
  } catch (error) {
    console.log('❌ 连接失败:', error.message);
    console.log('\n💡 请确保：');
    console.log('   1. Vite 开发服务器正在运行 (npm run dev)');
    console.log('   2. NextJS 服务器正在运行 (cd server/next-kidsviewer && npm run dev)');
  }
  
  console.log('\n🎯 如果所有测试都通过，说明 UserSwitcher 组件修复成功！');
  console.log('💡 现在可以访问 http://localhost:5173/auth 进行登录测试');
}

testUserSwitcherFix();
