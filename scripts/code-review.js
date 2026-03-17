#!/usr/bin/env node

/**
 * 代码检查命令行工具
 * 
 * 使用方法：
 * node scripts/code-review.js pages/landing-page
 * node scripts/code-review.js elements/button
 * 
 * 或者在 package.json 中添加脚本：
 * "review": "node scripts/code-review.js"
 */

import http from 'http';

// 从命令行参数获取要检查的路径
const targetPath = process.argv[2];

if (!targetPath) {
  console.error('❌ 错误：缺少路径参数');
  console.log('\n使用方法：');
  console.log('  node scripts/code-review.js pages/landing-page');
  console.log('  node scripts/code-review.js elements/button');
  process.exit(1);
}

// 配置
const HOST = 'localhost';
const PORT = 51720;

// 发送检查请求
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
      }
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
      reject(new Error(`请求失败: ${error.message}\n请确保开发服务器正在运行 (npm run dev)`));
    });
    
    req.write(postData);
    req.end();
  });
}

// 格式化输出
function formatResult(result) {
  console.log('\n' + '='.repeat(60));
  console.log(`📋 检查文件: ${result.file}`);
  console.log('='.repeat(60));
  
  if (result.issues.length === 0) {
    console.log('\n✅ 太棒了！代码完全符合规范，没有发现任何问题。\n');
    return;
  }
  
  // 统计问题数量
  const errors = result.issues.filter(issue => issue.type === 'error');
  const warnings = result.issues.filter(issue => issue.type === 'warning');
  
  console.log(`\n发现 ${errors.length} 个错误，${warnings.length} 个警告\n`);
  
  // 输出错误
  if (errors.length > 0) {
    console.log('❌ 错误 (必须修复):');
    console.log('-'.repeat(60));
    errors.forEach((issue, index) => {
      console.log(`\n${index + 1}. [${issue.rule}]`);
      console.log(`   ${issue.message}`);
      if (issue.suggestion) {
        console.log(`   💡 建议: ${issue.suggestion}`);
      }
    });
    console.log();
  }
  
  // 输出警告
  if (warnings.length > 0) {
    console.log('⚠️  警告 (建议修复):');
    console.log('-'.repeat(60));
    warnings.forEach((issue, index) => {
      console.log(`\n${index + 1}. [${issue.rule}]`);
      console.log(`   ${issue.message}`);
      if (issue.suggestion) {
        console.log(`   💡 建议: ${issue.suggestion}`);
      }
    });
    console.log();
  }
  
  // 总结
  console.log('='.repeat(60));
  if (result.passed) {
    console.log('✅ 检查通过 (仅有警告，不影响使用)');
  } else {
    console.log('❌ 检查未通过 (存在错误，需要修复)');
  }
  console.log('='.repeat(60) + '\n');
}

// 主函数
async function main() {
  console.log(`\n🔍 正在检查: ${targetPath}...\n`);
  
  try {
    const result = await reviewCode(targetPath);
    
    if (result.error) {
      console.error(`❌ 检查失败: ${result.error}`);
      process.exit(1);
    }
    
    formatResult(result);
    
    // 如果有错误，退出码为 1
    if (!result.passed) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error(`\n❌ ${error.message}\n`);
    process.exit(1);
  }
}

main();
