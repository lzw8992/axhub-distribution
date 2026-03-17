# 部署到腾讯云指南

## 方案一：腾讯云对象存储 COS + CDN（推荐）

### 1. 创建 COS 存储桶

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 进入「对象存储 COS」控制台
3. 点击「存储桶列表」→「创建存储桶」
4. 配置信息：
   - **名称**：axhub-distribution（自定义，全局唯一）
   - **地域**：选择离用户最近的地域（如：广州、上海、北京）
   - **访问权限**：公有读私有写
   - **服务端加密**：不加密

### 2. 开启静态网站托管

1. 进入存储桶详情页
2. 点击「基础配置」→「静态网站」
3. 开启静态网站功能
4. 配置：
   - **索引文档**：index.html
   - **错误文档**：index.html（因为是单页应用）

### 3. 上传文件

#### 方式 A：使用腾讯云 COSBrowser 客户端（推荐）

1. 下载 [COSBrowser](https://console.cloud.tencent.com/cos5/cosbrowser)
2. 登录后选择刚才创建的存储桶
3. 将 `dist` 目录下的所有文件拖拽上传到根目录

#### 方式 B：使用命令行工具

```bash
# 安装腾讯云 CLI
npm install -g @cloudbase/cli

# 登录腾讯云
cloudbase login

# 上传文件（替换为你的存储桶名称和地域）
coscli cp -r ./dist cos://axhub-distribution-125xxxxxx/ -e cos.ap-guangzhou.myqcloud.com
```

### 4. 配置 CDN 加速（可选但推荐）

1. 进入「内容分发网络 CDN」控制台
2. 点击「域名管理」→「添加域名」
3. 配置：
   - **域名**：your-domain.com（或腾讯云提供的默认域名）
   - **源站类型**：COS源
   - **选择存储桶**：选择刚才创建的存储桶
4. 等待域名审核通过（约5-10分钟）

### 5. 访问网站

- **临时域名**：https://axhub-distribution.cos.ap-guangzhou.myqcloud.com/index.html
- **CDN加速域名**：https://your-domain.com（配置CDN后）

---

## 方案二：腾讯云云开发 CloudBase（更简单）

### 1. 安装 CloudBase CLI

```bash
npm install -g @cloudbase/cli
```

### 2. 登录并初始化

```bash
cloudbase login
cloudbase init
```

### 3. 部署

```bash
cloudbase hosting deploy ./dist -e your-env-id
```

---

## 方案三：腾讯云轻量应用服务器

适合需要后端服务的场景，如果只是静态网站，推荐方案一。

---

## 重要页面链接

构建完成后，主要页面链接如下：

- **待我配货**：https://your-domain.com/pages/pending-distribution.html
- **我的配货单**：https://your-domain.com/pages/my-distribution-order.html

---

## 注意事项

1. **路由问题**：因为是单页应用，刷新页面可能会出现404，需要在COS静态网站配置中设置错误文档指向index.html

2. **跨域问题**：如果后续需要调用API，需要在COS中配置跨域访问（CORS）

3. **缓存问题**：更新代码后，CDN可能会有缓存，可以在CDN控制台刷新缓存

4. **成本估算**：
   - COS存储：约0.15元/GB/月
   - CDN流量：约0.21元/GB
   - 每月1000次访问约需1-5元

---

## 快速部署脚本

创建 `deploy.sh` 文件：

```bash
#!/bin/bash

# 配置
BUCKET_NAME="your-bucket-name"
REGION="ap-guangzhou"
SECRET_ID="your-secret-id"
SECRET_KEY="your-secret-key"

# 构建
npm run build

# 上传到 COS
node -e "
const COS = require('cos-nodejs-sdk-v5');
const fs = require('fs');
const path = require('path');

const cos = new COS({
  SecretId: '$SECRET_ID',
  SecretKey: '$SECRET_KEY'
});

function uploadDir(dir, prefix = '') {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const key = prefix + file;
    if (fs.statSync(filePath).isDirectory()) {
      uploadDir(filePath, key + '/');
    } else {
      cos.putObject({
        Bucket: '$BUCKET_NAME',
        Region: '$REGION',
        Key: key,
        Body: fs.createReadStream(filePath),
      }, (err, data) => {
        if (err) console.error('上传失败:', key, err);
        else console.log('上传成功:', key);
      });
    }
  });
}

uploadDir('./dist');
"

echo "部署完成！"
```

运行：
```bash
chmod +x deploy.sh
./deploy.sh
```
