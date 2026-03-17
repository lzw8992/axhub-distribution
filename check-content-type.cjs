/**
 * 检查 COS 文件 Content-Type
 */

const COS = require('cos-nodejs-sdk-v5');

const CONFIG = {
  SECRET_ID: process.env.TENCENT_SECRET_ID,
  SECRET_KEY: process.env.TENCENT_SECRET_KEY,
  BUCKET_NAME: process.env.TENCENT_BUCKET || 'axhub-distribution-1300989594',
  REGION: process.env.TENCENT_REGION || 'ap-shanghai'
};

const cos = new COS({
  SecretId: CONFIG.SECRET_ID,
  SecretKey: CONFIG.SECRET_KEY
});

async function checkFile(key) {
  return new Promise((resolve, reject) => {
    cos.headObject({
      Bucket: CONFIG.BUCKET_NAME,
      Region: CONFIG.REGION,
      Key: key
    }, (err, data) => {
      if (err) {
        console.error(`❌ 检查失败: ${key}`, err.message);
        reject(err);
      } else {
        console.log(`📄 ${key}`);
        console.log(`   Content-Type: ${data.headers['content-type']}`);
        console.log(`   Content-Length: ${data.headers['content-length']}`);
        console.log('');
        resolve(data);
      }
    });
  });
}

async function main() {
  console.log('🔍 检查 COS 文件 Content-Type...\n');
  
  try {
    await checkFile('pages/pending-distribution.html');
    await checkFile('pages/my-distribution-order.html');
  } catch (error) {
    console.error('\n❌ 检查失败:', error.message);
    process.exit(1);
  }
}

main();
