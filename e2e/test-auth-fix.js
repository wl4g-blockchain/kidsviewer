#!/usr/bin/env node

// 测试 NextAuth.js 修复是否有效
const fetch = require('node-fetch');

async function testAuthEndpoints() {
  console.log('🧪 测试 NextAuth.js 修复...\n');
  
  const endpoints = [
    '/api/auth/session',
    '/api/auth/csrf',
    '/api/auth/public-key'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`📡 测试 ${endpoint}...`);
      const response = await fetch(`http://localhost:5173${endpoint}`);
      
      if (response.ok) {
        console.log(`✅ ${endpoint} - 状态: ${response.status}`);
        if (endpoint === '/api/auth/public-key') {
          const data = await response.json();
          console.log(`📄 公钥长度: ${data.publicKey ? data.publicKey.length : 'N/A'}`);
        }
      } else {
        console.log(`❌ ${endpoint} - 状态: ${response.status}`);
        const text = await response.text();
        console.log(`📄 错误信息: ${text.substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - 连接失败: ${error.message}`);
    }
    console.log('');
  }
  
  console.log('💡 如果所有端点都返回 200 状态码，说明修复成功！');
}

testAuthEndpoints();
