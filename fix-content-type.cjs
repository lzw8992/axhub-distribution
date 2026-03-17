/**
 * 修复 COS 文件 Content-Type 的脚本
 */

const COS = require('cos-nodejs-sdk-v5');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  SECRET_ID: process.env.TENCENT_SECRET_ID,
  SECRET_KEY: process.env.TENCENT_SECRET_KEY,
  BUCKET_NAME: process.env.TENCENT_BUCKET || 'axhub-distribution-1300989594',
  REGION: process.env.TENCENT_REGION || 'ap-shanghai',
  DIST_DIR: './dist'
};

const cos = new COS({
  SecretId: CONFIG.SECRET_ID,
  SecretKey: CONFIG.SECRET_KEY
});

// 获取文件 Content-Type
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
  };
  return contentTypes[ext] || 'text/plain; charset=utf-8';
}

// 重新上传文件并设置正确的 Content-Type
async function fixContentType(localPath, cosKey) {
  const contentType = getContentType(localPath);
  
  return new Promise((resolve, reject) => {
    cos.putObject({
      Bucket: CONFIG.BUCKET_NAME,
      Region: CONFIG.REGION,
      Key: cosKey,
      Body: fs.createReadStream(localPath),
      ContentType: contentType
    }, (err, data) => {
      if (err) {
        console.error(`❌ 修复失败: ${cosKey}`, err.message);
        reject(err);
      } else {
        console.log(`✅ 已修复: ${cosKey} -> ${contentType}`);
        resolve(data);
      }
    });
  });
}

// 递归处理目录
async function processDir(localDir, cosPrefix = '') {
  const files = fs.readdirSync(localDir);
  
  for (const file of files) {
    const localPath = path.join(localDir, file);
    const cosKey = cosPrefix ? `${cosPrefix}/${file}` : file;
    
    if (fs.statSync(localPath).isDirectory()) {
      await processDir(localPath, cosKey);
    } else {
      await fixContentType(localPath, cosKey);
    }
  }
}

async function main() {
  console.log('🔧 开始修复 Content-Type...\n');
  
  try {
    await processDir(CONFIG.DIST_DIR);
    console.log('\n✨ 修复完成！');
    console.log('\n请刷新页面测试访问。');
  } catch (error) {
    console.error('\n❌ 修复失败:', error.message);
    process.exit(1);
  }
}

main();
