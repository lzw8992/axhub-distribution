/**
 * 重新部署 - 先删除再上传
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
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
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
  return contentTypes[ext] || 'application/octet-stream';
}

// 删除 COS 上的所有文件
async function clearBucket() {
  return new Promise((resolve, reject) => {
    cos.getBucket({
      Bucket: CONFIG.BUCKET_NAME,
      Region: CONFIG.REGION
    }, (err, data) => {
      if (err) {
        console.error('❌ 获取文件列表失败:', err.message);
        reject(err);
        return;
      }
      
      if (!data.Contents || data.Contents.length === 0) {
        console.log('📂 存储桶为空，无需清理');
        resolve();
        return;
      }
      
      const objects = data.Contents.map(item => ({ Key: item.Key }));
      
      cos.deleteMultipleObject({
        Bucket: CONFIG.BUCKET_NAME,
        Region: CONFIG.REGION,
        Objects: objects
      }, (err, data) => {
        if (err) {
          console.error('❌ 删除文件失败:', err.message);
          reject(err);
        } else {
          console.log(`✅ 已删除 ${objects.length} 个文件`);
          resolve();
        }
      });
    });
  });
}

// 上传文件到 COS
function uploadFile(localPath, cosKey) {
  return new Promise((resolve, reject) => {
    const contentType = getContentType(localPath);
    
    cos.putObject({
      Bucket: CONFIG.BUCKET_NAME,
      Region: CONFIG.REGION,
      Key: cosKey,
      Body: fs.createReadStream(localPath),
      ContentType: contentType,
      ContentDisposition: 'inline' // 强制浏览器内联显示，而不是下载
    }, (err, data) => {
      if (err) {
        console.error(`❌ 上传失败: ${cosKey}`, err.message);
        reject(err);
      } else {
        console.log(`✅ 上传成功: ${cosKey} (${contentType})`);
        resolve(data);
      }
    });
  });
}

// 递归上传目录
async function uploadDir(localDir, cosPrefix = '') {
  const files = fs.readdirSync(localDir);
  
  for (const file of files) {
    const localPath = path.join(localDir, file);
    const cosKey = cosPrefix ? `${cosPrefix}/${file}` : file;
    
    if (fs.statSync(localPath).isDirectory()) {
      await uploadDir(localPath, cosKey);
    } else {
      await uploadFile(localPath, cosKey);
    }
  }
}

async function main() {
  console.log('🚀 开始重新部署...\n');
  
  try {
    // 步骤1：清空存储桶
    console.log('📋 步骤 1/3: 清空存储桶...');
    await clearBucket();
    console.log('');
    
    // 步骤2：上传文件
    console.log('📤 步骤 2/3: 上传文件...');
    await uploadDir(CONFIG.DIST_DIR);
    console.log('');
    
    // 步骤3：配置静态网站
    console.log('📋 步骤 3/3: 配置静态网站...');
    await new Promise((resolve, reject) => {
      cos.putBucketWebsite({
        Bucket: CONFIG.BUCKET_NAME,
        Region: CONFIG.REGION,
        WebsiteConfiguration: {
          IndexDocument: { Suffix: 'index.html' },
          ErrorDocument: { Key: 'index.html' }
        }
      }, (err, data) => {
        if (err) reject(err);
        else {
          console.log('✅ 静态网站配置成功');
          resolve(data);
        }
      });
    });
    console.log('');
    
    console.log('✨ 重新部署完成！\n');
    console.log('访问地址：');
    console.log(`  待我配货: https://${CONFIG.BUCKET_NAME}.cos-website.${CONFIG.REGION}.myqcloud.com/pages/pending-distribution.html`);
    console.log(`  我的配货单: https://${CONFIG.BUCKET_NAME}.cos-website.${CONFIG.REGION}.myqcloud.com/pages/my-distribution-order.html`);
    
  } catch (error) {
    console.error('\n❌ 部署失败:', error.message);
    process.exit(1);
  }
}

main();
