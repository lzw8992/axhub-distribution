# Ant Design 项目概览

> 提取日期：2026-02-27
> 来源：https://ant-design.antgroup.com/components/overview-cn/

---

## 基本信息

| 项目 | 内容 |
|------|------|
| **项目名称** | Ant Design |
| **官方网站** | https://ant-design.antgroup.com |
| **GitHub** | https://github.com/ant-design/ant-design |
| **开发团队** | 蚂蚁集团体验技术部 |
| **技术栈** | React + TypeScript |
| **当前版本** | 5.x |
| **组件数量** | 66 个 |
| **开源协议** | MIT |

---

## 项目简介

Ant Design 是蚂蚁集团推出的一款用于研发企业级中后台产品设计体系的 React UI 组件库。第一个公开版本发布于 2015 年，是国内较早的企业级 UI 组件库之一。

### 设计价值观

基于**『确定』**和**『自然』**的设计价值观，通过模块化的解决方案，降低冗余的生产成本，让设计者专注于更好的用户体验。

### 核心特性

1. **企业级设计** - 面向企业级中后台产品的设计体系
2. **高质量组件** - 66+ 个精心设计的 React 组件
3. **TypeScript 支持** - 完整的 TypeScript 类型定义
4. **国际化支持** - 内置 60+ 种语言包
5. **主题定制** - 灵活的设计变量和主题定制能力
6. **无障碍访问** - 遵循 WCAG 2.0 标准

---

## 设计风格

### 主色调

| 颜色 | 色值 | 用途 |
|------|------|------|
| 主色 | `#1677FF` | 主要操作、链接、高亮 |
| 成功色 | `#52C41A` | 成功状态、正向反馈 |
| 警告色 | `#FAAD14` | 警告状态、注意事项 |
| 错误色 | `#FF4D4F` | 错误状态、危险操作 |
| 信息色 | `#1677FF` | 信息提示、中性状态 |

### 字体规范

- **字体族**：`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial`
- **基础字号**：14px
- **行高**：1.5715（约 22px）

### 间距系统

基于 4px 的栅格系统：
- `xxs`: 4px
- `xs`: 8px
- `sm`: 12px
- `md`: 16px
- `lg`: 24px
- `xl`: 32px
- `xxl`: 48px

### 圆角规范

- `xs`: 2px
- `sm`: 4px
- `default`: 6px
- `lg`: 8px

---

## 组件分类

| 分类 | 数量 | 说明 |
|------|------|------|
| 通用组件 | 3 | Button、Icon、Typography 等基础元素 |
| 布局组件 | 4 | Grid、Layout、Space 等页面结构组件 |
| 导航组件 | 6 | Menu、Breadcrumb、Pagination 等导航元素 |
| 数据录入 | 18 | Form、Input、Select 等表单组件 |
| 数据展示 | 20 | Table、List、Card 等数据展示组件 |
| 反馈组件 | 9 | Modal、Message、Spin 等反馈元素 |
| 其他组件 | 6 | ConfigProvider、BackTop 等辅助组件 |

---

## 相关资源

### 官方资源

- **设计原则**：https://ant-design.antgroup.com/docs/spec/introduce-cn
- **设计模式**：https://ant-design.antgroup.com/docs/pattern/overview-cn
- **设计资源**：https://ant-design.antgroup.com/docs/resources-cn
- **更新日志**：https://ant-design.antgroup.com/changelog-cn

### 生态产品

| 产品 | 说明 |
|------|------|
| Ant Design X | AI 组件库 |
| Ant Design Charts | 图表组件库 |
| Ant Design Pro | 开箱即用的中后台前端解决方案 |
| Pro Components | 高级业务组件 |
| Ant Design Mobile | 移动端组件库 |
| Ant Design Mini | 小程序组件库 |
| Ant Design Web3 | Web3 组件库 |
| AntV | 数据可视化解决方案 |

---

## 使用建议

### 适用场景

- 企业级中后台管理系统
- 数据密集型应用
- 表单复杂的业务系统
- 需要统一设计规范的产品

### 优势

1. 成熟稳定，社区活跃
2. 文档完善，示例丰富
3. 企业级设计规范
4. 持续更新维护
5. 国际化支持完善

### 注意事项

- 适合中后台产品，不适合 C 端消费级应用
- 组件体积较大，需要按需加载
- 样式定制需要一定的学习成本

---

## 资产文件清单

本次提取生成的资产文件：

| 文件 | 路径 | 说明 |
|------|------|------|
| 组件文档 | `assets/docs/ant-design-components.md` | 完整的组件列表和说明 |
| 组件数据库 | `assets/database/ant-design-components.json` | 结构化组件数据 |
| 项目概览 | `assets/docs/ant-design-overview.md` | 项目整体介绍 |
| 设计主题 | `src/themes/antd-new/designToken.json` | Ant Design 设计变量 |
