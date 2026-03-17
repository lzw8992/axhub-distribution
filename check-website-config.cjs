/**
 * 检查 COS 静态网站配置
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

async function checkWebsiteConfig() {
  return new Promise((resolve, reject) => {
    cos.getBucketWebsite({
      Bucket: CONFIG.BUCKET_NAME,
      Region: CONFIG.REGION
    }, (err, data) => {
      if (err) {
        console.error('❌ 获取静态网站配置失败:', err.message);
        reject(err);
      } else {
        console.log('📋 静态网站配置:');
        console.log('   IndexDocument:', data.WebsiteConfiguration?.IndexDocument?.Suffix);
        console.log('   ErrorDocument:', data.WebsiteConfiguration?.ErrorDocument?.Key);
        resolve(data);
      }
    });
  });
}

async function checkBucketACL() {
  return new Promise((resolve, reject) => {
    cos.getBucketAcl({
      Bucket: CONFIG.BUCKET_NAME,
      Region: CONFIG.REGION
    }, (err, data) => {
      if (err) {
        console.error('❌ 获取权限配置失败:', err.message);
        reject(err);
      } else {
        console.log('\n🔐 存储桶权限:');
        console.log('   ACL:', data.ACL);
        console.log('   Grants:', JSON.stringify(data.Grants, null, 2));
        resolve(data);
      }
    });
  });
}

async function main() {
  console.log('🔍 检查 COS 配置...\n');
  
  try {
    await checkWebsiteConfig();
    await checkBucketACL();
    
    console.log('\n✅ 配置检查完成');
    console.log('\n💡 静态网站访问地址:');
    console.log(`   https://${CONFIG.BUCKET_NAME}.cos-website.${CONFIG.REGION}.myqcloud.com/pages/pending-distribution.html`);
  } catch (error) {
    console.error('\n❌ 检查失败:', error.message);
  }
}

main();
