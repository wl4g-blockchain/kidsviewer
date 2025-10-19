#!/usr/bin/env node

/**
 * 测试 Next.js 集成模式
 * 验证前后端分离模式和 Next.js SSR 模式是否都能正常工作
 */

const { spawn } = require('child_process');
const http = require('http');
const https = require('https');

// 测试配置
const config = {
  vitePort: 5173,
  nextPort: 3000,
  timeout: 30000, // 30秒超时
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 检查端口是否可用
function checkPort(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on('error', () => resolve(false));
  });
}

// 等待服务启动
function waitForService(url, timeout = config.timeout) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      const request = url.startsWith('https') ? https : http;
      
      const req = request.get(url, (res) => {
        if (res.statusCode === 200 || res.statusCode === 302) {
          resolve(true);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
      
      req.on('error', () => {
        if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout'));
        } else {
          setTimeout(check, 1000);
        }
      });
    };
    
    check();
  });
}

// 测试 API 端点
async function testAPI(baseUrl, endpoint) {
  return new Promise((resolve) => {
    const url = `${baseUrl}${endpoint}`;
    const request = url.startsWith('https') ? https : http;
    
    const req = request.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data,
          success: res.statusCode >= 200 && res.statusCode < 400
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({
        status: 0,
        data: err.message,
        success: false
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        status: 0,
        data: 'Timeout',
        success: false
      });
    });
  });
}

// 运行测试
async function runTests() {
  log('🚀 开始测试 Next.js 集成模式...', 'cyan');
  
  // 检查端口可用性
  log('📋 检查端口可用性...', 'blue');
  const vitePortAvailable = await checkPort(config.vitePort);
  const nextPortAvailable = await checkPort(config.nextPort);
  
  if (!vitePortAvailable) {
    log(`❌ 端口 ${config.vitePort} 不可用`, 'red');
  }
  if (!nextPortAvailable) {
    log(`❌ 端口 ${config.nextPort} 不可用`, 'red');
  }
  
  // 测试前后端分离模式
  log('\n🔧 测试前后端分离模式 (Vite + Next.js API)...', 'yellow');
  try {
    log('⏳ 等待 Vite 开发服务器启动...', 'blue');
    await waitForService(`http://localhost:${config.vitePort}`);
    log('✅ Vite 开发服务器已启动', 'green');
    
    // 测试 API 端点
    const apiTests = [
      '/api/v1/auth/session',
      '/api/v1/auth/public-key',
      '/api/v1/sys/config'
    ];
    
    for (const endpoint of apiTests) {
      const result = await testAPI(`http://localhost:${config.nextPort}`, endpoint);
      if (result.success) {
        log(`✅ ${endpoint} - 状态: ${result.status}`, 'green');
      } else {
        log(`❌ ${endpoint} - 状态: ${result.status}, 错误: ${result.data}`, 'red');
      }
    }
    
  } catch (error) {
    log(`❌ 前后端分离模式测试失败: ${error.message}`, 'red');
  }
  
  // 测试 Next.js SSR 模式
  log('\n🔧 测试 Next.js SSR 模式...', 'yellow');
  try {
    log('⏳ 等待 Next.js 开发服务器启动...', 'blue');
    await waitForService(`http://localhost:${config.nextPort}`);
    log('✅ Next.js 开发服务器已启动', 'green');
    
    // 测试页面路由
    const pageTests = [
      '/',
      '/login',
      '/app'
    ];
    
    for (const page of pageTests) {
      const result = await testAPI(`http://localhost:${config.nextPort}`, page);
      if (result.success) {
        log(`✅ ${page} - 状态: ${result.status}`, 'green');
      } else {
        log(`❌ ${page} - 状态: ${result.status}, 错误: ${result.data}`, 'red');
      }
    }
    
  } catch (error) {
    log(`❌ Next.js SSR 模式测试失败: ${error.message}`, 'red');
  }
  
  log('\n🎉 测试完成!', 'cyan');
  log('\n📝 使用说明:', 'blue');
  log('1. 前后端分离模式: npm run dev:unified', 'reset');
  log('2. Next.js SSR 模式: cd server/next-kidsviewer && npm run dev', 'reset');
  log('3. 生产部署: vercel --prod', 'reset');
}

// 主函数
async function main() {
  try {
    await runTests();
  } catch (error) {
    log(`❌ 测试过程中发生错误: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { runTests, testAPI, waitForService };
