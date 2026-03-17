/**
 * 腾讯云 COS 部署脚本
 * 
 * 使用前需要配置以下信息：
 * 1. SECRET_ID - 腾讯云 API 密钥 ID
 * 2. SECRET_KEY - 腾讯云 API 密钥 Key
 * 3. BUCKET_NAME - COS 存储桶名称
 * 4. REGION - COS 存储桶地域
 * 
 * 获取方式：
 * 1. 登录 https://console.cloud.tencent.com/cam/capi 创建 API 密钥
 * 2. 登录 https://console.cloud.tencent.com/cos5/bucket 创建存储桶
 */

const COS = require('cos-nodejs-sdk-v5');
const fs = require('fs');
const path = require('path');

// ==================== 配置区域 ====================
const CONFIG = {
  // 腾讯云 API 密钥（从 https://console.cloud.tencent.com/cam/capi 获取）
  SECRET_ID: process.env.TENCENT_SECRET_ID || 'your-secret-id',
  SECRET_KEY: process.env.TENCENT_SECRET_KEY || 'your-secret-key',
  
  // COS 存储桶配置（从 https://console.cloud.tencent.com/cos5/bucket 获取）
  BUCKET_NAME: process.env.TENCENT_BUCKET || 'axhub-distribution', // 替换为你的存储桶名称
  REGION: process.env.TENCENT_REGION || 'ap-guangzhou', // 替换为你的存储桶地域
  
  // 本地构建目录
  DIST_DIR: './dist',
  
  // COS 上的目标路径（保持为空表示上传到根目录）
  COS_PREFIX: ''
};
// =================================================

// 检查配置
if (CONFIG.SECRET_ID === 'your-secret-id' || CONFIG.SECRET_KEY === 'your-secret-key') {
  console.error('❌ 错误：请先配置腾讯云 API 密钥！');
  console.log('\n请按以下步骤操作：');
  console.log('1. 访问 https://console.cloud.tencent.com/cam/capi 创建 API 密钥');
  console.log('2. 访问 https://console.cloud.tencent.com/cos5/bucket 创建存储桶');
  console.log('3. 修改 deploy.js 中的 CONFIG 配置，或设置环境变量：');
  console.log('   export TENCENT_SECRET_ID=your-secret-id');
  console.log('   export TENCENT_SECRET_KEY=your-secret-key');
  console.log('   export TENCENT_BUCKET=your-bucket-name');
  console.log('   export TENCENT_REGION=ap-guangzhou');
  process.exit(1);
}

// 创建 COS 客户端
const cos = new COS({
  SecretId: CONFIG.SECRET_ID,
  SecretKey: CONFIG.SECRET_KEY
});

// 上传文件到 COS
function uploadFile(localPath, cosKey) {
  return new Promise((resolve, reject) => {
    cos.putObject({
      Bucket: CONFIG.BUCKET_NAME,
      Region: CONFIG.REGION,
      Key: cosKey,
      Body: fs.createReadStream(localPath),
      ContentType: getContentType(localPath)
    }, (err, data) => {
      if (err) {
        console.error(`❌ 上传失败: ${cosKey}`, err.message);
        reject(err);
      } else {
        console.log(`✅ 上传成功: ${cosKey}`);
        resolve(data);
      }
    });
  });
}

// 递归上传目录
async function uploadDir(localDir, cosPrefix = '') {
  const files = fs.readdirSync(localDir);
  const uploadPromises = [];
  
  for (const file of files) {
    const localPath = path.join(localDir, file);
    const cosKey = cosPrefix ? `${cosPrefix}/${file}` : file;
    
    if (fs.statSync(localPath).isDirectory()) {
      // 递归上传子目录
      await uploadDir(localPath, cosKey);
    } else {
      // 上传文件
      uploadPromises.push(uploadFile(localPath, cosKey));
    }
  }
  
  await Promise.all(uploadPromises);
}

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

// 配置存储桶静态网站
function configureStaticWebsite() {
  return new Promise((resolve, reject) => {
    cos.putBucketWebsite({
      Bucket: CONFIG.BUCKET_NAME,
      Region: CONFIG.REGION,
      WebsiteConfiguration: {
        IndexDocument: {
          Suffix: 'index.html'
        },
        ErrorDocument: {
          Key: 'index.html'
        }
      }
    }, (err, data) => {
      if (err) {
        console.error('❌ 静态网站配置失败:', err.message);
        reject(err);
      } else {
        console.log('✅ 静态网站配置成功');
        resolve(data);
      }
    });
  });
}

// 主函数
async function main() {
  console.log('🚀 开始部署到腾讯云 COS...\n');
  console.log(`存储桶: ${CONFIG.BUCKET_NAME}`);
  console.log(`地域: ${CONFIG.REGION}`);
  console.log(`本地目录: ${CONFIG.DIST_DIR}\n`);
  
  // 检查本地目录是否存在
  if (!fs.existsSync(CONFIG.DIST_DIR)) {
    console.error(`❌ 错误: 目录 ${CONFIG.DIST_DIR} 不存在！`);
    console.log('请先运行 npm run build 构建项目');
    process.exit(1);
  }
  
  try {
    // 配置静态网站
    console.log('📋 步骤 1/2: 配置静态网站...');
    await configureStaticWebsite();
    console.log('');
    
    // 上传文件
    console.log('📤 步骤 2/2: 上传文件...');
    await uploadDir(CONFIG.DIST_DIR, CONFIG.COS_PREFIX);
    console.log('');
    
    // 部署完成
    console.log('✨ 部署完成！\n');
    console.log('访问地址：');
    console.log(`  首页: https://${CONFIG.BUCKET_NAME}.cos.${CONFIG.REGION}.myqcloud.com/index.html`);
    console.log(`  待我配货: https://${CONFIG.BUCKET_NAME}.cos.${CONFIG.REGION}.myqcloud.com/pages/pending-distribution.html`);
    console.log(`  我的配货单: https://${CONFIG.BUCKET_NAME}.cos.${CONFIG.REGION}.myqcloud.com/pages/my-distribution-order.html`);
    console.log('\n💡 提示：');
    console.log('  1. 如果无法访问，请检查存储桶权限是否为「公有读私有写」');
    console.log('  2. 建议配置 CDN 加速以获得更好的访问速度');
    console.log('  3. 如需绑定自定义域名，请访问腾讯云 CDN 控制台');
    
  } catch (error) {
    console.error('\n❌ 部署失败:', error.message);
    process.exit(1);
  }
}

// 运行部署
main();
