# 部署到 GitHub Pages 指南

## 方法：使用 GitHub Actions 自动部署（推荐）

### 步骤 1：创建 GitHub 仓库

1. 访问 https://github.com/new
2. 输入仓库名称：`axhub-distribution`
3. 选择 **Public**（公开仓库）
4. 点击 **Create repository**

### 步骤 2：上传代码到 GitHub

在本地项目目录运行以下命令：

```bash
# 进入项目目录
cd /Users/zhiwei.liu/Documents/trae_projects/mkdir-my-project/axhub-project

# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 提交代码
git commit -m "Initial commit"

# 关联远程仓库（替换为您的用户名）
git remote add origin https://github.com/您的用户名/axhub-distribution.git

# 推送到 GitHub
git push -u origin main
```

### 步骤 3：启用 GitHub Pages

1. 打开您的 GitHub 仓库页面
2. 点击 **Settings**（设置）
3. 左侧菜单点击 **Pages**
4. **Source** 选择 **GitHub Actions**
5. 保存设置

### 步骤 4：触发部署

1. 在仓库页面点击 **Actions** 标签
2. 点击 **Deploy to GitHub Pages** 工作流
3. 点击 **Run workflow** 手动触发部署

或者推送代码会自动触发部署：

```bash
git push
```

### 步骤 5：访问网站

部署完成后，访问地址为：

```
https://您的用户名.github.io/axhub-distribution/
```

例如：
- 首页：https://您的用户名.github.io/axhub-distribution/
- 待我配货：https://您的用户名.github.io/axhub-distribution/pages/pending-distribution.html
- 我的配货单：https://您的用户名.github.io/axhub-distribution/pages/my-distribution-order.html

---

## 方法：手动部署（更简单）

如果不想使用 GitHub Actions，可以手动部署：

### 步骤 1：创建仓库

同上

### 步骤 2：上传 dist 目录

1. 在 GitHub 仓库页面点击 **Add file** → **Upload files**
2. 上传 `dist` 目录中的所有文件
3. 提交更改

### 步骤 3：启用 Pages

1. Settings → Pages
2. Source 选择 **Deploy from a branch**
3. Branch 选择 **main** / **root**
4. 保存

---

## 更新网站

当您修改代码后，需要重新构建并推送：

```bash
# 构建项目
npm run build

# 确保 dist 目录已更新
# 然后提交并推送
git add .
git commit -m "Update website"
git push
```

GitHub Actions 会自动重新部署。

---

## 常见问题

### Q: 页面显示 404？
- 等待 1-2 分钟，GitHub Pages 部署需要时间
- 检查仓库是否为 Public
- 检查是否正确启用了 Pages

### Q: 如何绑定自定义域名？
1. Settings → Pages → Custom domain
2. 输入您的域名（如：www.example.com）
3. 在域名服务商处添加 CNAME 记录指向 `您的用户名.github.io`

### Q: 网站更新后没有变化？
- 清除浏览器缓存
- 检查 GitHub Actions 是否成功运行
- 等待 1-2 分钟让 CDN 刷新
