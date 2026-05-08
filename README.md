# ETF Autos - ETF 估值工具

一个基于 Next.js 的 ETF 估值分析工具，帮助投资者分析和追踪 ETF 的估值数据。

## 功能特性

- 📊 **估值分析** - 查看 ETF 的波动率和年化收益率
- 📈 **净值走势图** - 可视化展示 ETF 净值历史走势
- ⭐ **收藏功能** - 收藏关注的 ETF，快速访问
- 🔍 **搜索功能** - 快速搜索和筛选 ETF
- 🌓 **深色模式** - 支持明暗主题切换

## 技术栈

- **框架**: Next.js 14
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **图表**: Recharts + Lightweight Charts
- **UI 组件**: 自定义组件 + shadcn/ui

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
├── components/          # React 组件
│   ├── ui/             # 基础 UI 组件
│   ├── chart-section.tsx
│   ├── price-chart.tsx
│   └── ...
├── pages/              # Next.js 页面
│   ├── api/           # API 路由
│   ├── index.tsx      # 首页
│   └── ...
├── lib/                # 工具函数和 API
├── types/              # TypeScript 类型定义
├── public/             # 静态资源
│   └── data/          # 数据文件
└── styles/             # 全局样式
```

## 页面说明

- **首页** (`/`) - ETF 估值分析主页面
- **策略** (`/strategy`) - 投资策略相关
- **关于** (`/about`) - 关于页面
- **留言板** (`/guestbook`) - 用户留言

## 设计参考

设计系统参考了 Airbnb 的设计风格，详见 [DESIGN.md](./DESIGN.md)。

## 许可证

MIT