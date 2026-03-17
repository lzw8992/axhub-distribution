/**
 * 测试不同 URL 访问
 */

const https = require('https');

const urls = [
  'https://axhub-distribution-1300989594.cos.ap-shanghai.myqcloud.com/pages/pending-distribution.html',
  'https://axhub-distribution-1300989594.cos-website.ap-shanghai.myqcloud.com/pages/pending-distribution.html'
];

async function testUrl(url) {
  return new Promise((resolve) => {
    console.log('🔍 测试 URL:', url);
    
    https.get(url, (res) => {
      console.log('  状态码:', res.statusCode);
      console.log('  Content-Type:', res.headers['content-type']);
      console.log('  Content-Disposition:', res.headers['content-disposition']);
      console.log('');
      resolve();
    }).on('error', (err) => {
      console.error('  请求失败:', err.message);
      console.log('');
      resolve();
    });
  });
}

async function main() {
  for (const url of urls) {
    await testUrl(url);
  }
}

main();
