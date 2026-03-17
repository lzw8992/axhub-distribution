/**
 * 部署到腾讯云 CloudBase
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始部署到腾讯云 CloudBase...\n');

// 检查 dist 目录
if (!fs.existsSync('./dist')) {
  console.error('❌ 错误: dist 目录不存在！');
  console.log('请先运行 npm run build 构建项目');
  process.exit(1);
}

// 创建 cloudbase.json 配置文件
const config = {
  "envId": "your-env-id",
  "functionRoot": "./functions",
  "functions": [],
  "region": "ap-shanghai",
  "framework": {
    "name": "axhub-distribution",
    "plugins": {
      "client": {
        "use": "@cloudbase/framework-plugin-website",
        "inputs": {
          "outputPath": "./dist",
          "cloudPath": "/",
          "ignore": ["*.md", "*.txt"]
        }
      }
    }
  }
};

fs.writeFileSync('./cloudbase.json', JSON.stringify(config, null, 2));
console.log('✅ 已创建 cloudbase.json 配置文件\n');

console.log('📋 部署步骤：');
console.log('1. 访问 https://console.cloud.tencent.com/tcb 创建环境');
console.log('2. 获取环境 ID（如：axhub-distribution-xxx）');
console.log('3. 修改 cloudbase.json 中的 envId');
console.log('4. 运行以下命令部署：\n');
console.log('   npx @cloudbase/cli@latest hosting deploy ./dist -e your-env-id\n');

console.log('💡 或者使用全局安装的 CLI：');
console.log('   npm install -g @cloudbase/cli');
console.log('   cloudbase login');
console.log('   cloudbase hosting deploy ./dist -e your-env-id\n');
