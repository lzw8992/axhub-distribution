#!/usr/bin/env node

/**
 * 批量检查所有组件和页面
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HOST = 'localhost';
const PORT = 51720;

function reviewCode(targetPath) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ path: targetPath });
    
    const options = {
      hostname: HOST,
      port: PORT,
      path: '/api/code-review',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 5000
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(new Error(`解析响应失败: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
    
    req.write(postData);
    req.end();
  });
}

function getAllComponents() {
  const srcDir = path.resolve(__dirname, '../src');
  const components = [];
  
  // 扫描 pages
  const pagesDir = path.join(srcDir, 'pages');
  if (fs.existsSync(pagesDir)) {
    const pages = fs.readdirSync(pagesDir, { withFileTypes: true });
    pages.forEach(page => {
      if (page.isDirectory()) {
        const indexPath = path.join(pagesDir, page.name, 'index.tsx');
        if (fs.existsSync(indexPath)) {
          components.push({
            type: 'page',
            name: page.name,
            path: `pages/${page.name}`
          });
        }
      }
    });
  }
  
  // 扫描 elements
  const elementsDir = path.join(srcDir, 'elements');
  if (fs.existsSync(elementsDir)) {
    const elements = fs.readdirSync(elementsDir, { withFileTypes: true });
    elements.forEach(element => {
      if (element.isDirectory()) {
        const indexPath = path.join(elementsDir, element.name, 'index.tsx');
        if (fs.existsSync(indexPath)) {
          components.push({
            type: 'element',
            name: element.name,
            path: `elements/${element.name}`
          });
        }
      }
    });
  }
  
  return components;
}

function formatIssue(issue, indent = '     ') {
  const icon = issue.type === 'error' ? '❌' : '⚠️';
  let output = `${indent}${icon} [${issue.rule}] ${issue.message}`;
  if (issue.suggestion) {
    output += `\n${indent}   💡 ${issue.suggestion}`;
  }
  return output;
}

async function main() {
  console.log('\n🔍 扫描项目中的所有组件和页面...\n');
  
  const components = getAllComponents();
  
  if (components.length === 0) {
    console.log('❌ 未找到任何组件或页面\n');
    process.exit(1);
  }
  
  console.log(`找到 ${components.length} 个组件/页面\n`);
  console.log('='.repeat(70));
  
  let totalChecked = 0;
  let totalPassed = 0;
  let totalErrors = 0;
  let totalWarnings = 0;
  const failedComponents = [];
  
  for (const component of components) {
    totalChecked++;
    const displayName = `${component.type === 'page' ? '📄' : '🧩'} ${component.name}`;
    
    try {
      const result = await reviewCode(component.path);
      
      if (result.error) {
        console.log(`\n${displayName}`);
        console.log(`   ❌ 检查失败: ${result.error}`);
        continue;
      }
      
      const errors = result.issues.filter(i => i.type === 'error');
      const warnings = result.issues.filter(i => i.type === 'warning');
      
      totalErrors += errors.length;
      totalWarnings += warnings.length;
      
      if (result.passed) {
        totalPassed++;
        console.log(`\n${displayName}`);
        console.log(`   ✅ 通过`);
      } else {
        failedComponents.push({
          component,
          result
        });
        console.log(`\n${displayName}`);
        console.log(`   ❌ 未通过 (${errors.length} 错误, ${warnings.length} 警告)`);
        
        // 只显示错误，不显示警告（简化输出）
        if (errors.length > 0) {
          errors.forEach(issue => {
            console.log(formatIssue(issue));
          });
        }
      }
      
    } catch (error) {
      console.log(`\n${displayName}`);
      console.log(`   ❌ 检查失败: ${error.message}`);
    }
  }
  
  // 总结
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 检查总结:\n');
  console.log(`   总计: ${totalChecked} 个组件/页面`);
  console.log(`   通过: ${totalPassed} 个 ✅`);
  console.log(`   失败: ${totalChecked - totalPassed} 个 ❌`);
  console.log(`   错误: ${totalErrors} 个`);
  console.log(`   警告: ${totalWarnings} 个`);
  
  if (failedComponents.length > 0) {
    console.log('\n⚠️  需要修复的组件:\n');
    failedComponents.forEach(({ component }) => {
      console.log(`   - ${component.path}`);
    });
  }
  
  console.log('\n' + '='.repeat(70) + '\n');
  
  if (totalPassed === totalChecked) {
    console.log('✅ 所有组件都符合规范！\n');
  } else {
    console.log('⚠️  部分组件需要修复，请查看上面的详细信息。\n');
    console.log('💡 使用以下命令查看单个组件的详细问题：');
    console.log('   node scripts/code-review.js <path>\n');
    process.exit(1);
  }
}

// 检查服务器
function checkServer() {
  return new Promise((resolve) => {
    const req = http.get(`http://${HOST}:${PORT}/api/version`, (res) => {
      resolve(true);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

(async () => {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.error('\n❌ 错误：开发服务器未运行');
    console.log('\n请先启动开发服务器：');
    console.log('  npm run dev\n');
    process.exit(1);
  }
  
  await main();
})();
