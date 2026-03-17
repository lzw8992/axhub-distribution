/**
 * 测试 URL 访问
 */

const https = require('https');

const url = 'https://axhub-distribution-1300989594.cos-website.ap-shanghai.myqcloud.com/pages/pending-distribution.html';

console.log('🔍 测试访问 URL:', url);
console.log('');

https.get(url, (res) => {
  console.log('状态码:', res.statusCode);
  console.log('响应头:');
  console.log('  Content-Type:', res.headers['content-type']);
  console.log('  Content-Disposition:', res.headers['content-disposition']);
  console.log('  Content-Length:', res.headers['content-length']);
  console.log('');
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('响应体前 500 字符:');
    console.log(data.substring(0, 500));
  });
}).on('error', (err) => {
  console.error('请求失败:', err.message);
});
