# Vercel 部署指南

本项目已配置为支持 Vercel 部署，Vercel 原生支持 Next.js API 路由，无需额外配置即可使用订阅功能。

## 快速部署

### 方法一：通过 Vercel 网站（推荐）

1. **连接 GitHub 仓库**
   - 访问 [Vercel](https://vercel.com)
   - 使用 GitHub 账号登录
   - 点击 "Add New Project"
   - 选择 `etf.autos` 仓库

2. **配置环境变量**
   
   在 Vercel 项目设置中添加以下环境变量：

   | 变量名         | 值              | 说明                         |
   | -------------- | --------------- | ---------------------------- |
   | `GITHUB_TOKEN` | `ghp_xxxx`      | GitHub Personal Access Token |
   | `GITHUB_OWNER` | `your-username` | GitHub 用户名                |
   | `GITHUB_REPO`  | `etf.autos`     | 仓库名称                     |

3. **部署**
   - 点击 "Deploy" 按钮
   - 等待构建完成

### 方法二：通过 Vercel CLI

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署项目**
   ```bash
   # 在项目根目录执行
   vercel
   ```

4. **设置环境变量**
   ```bash
   # 设置 GitHub Token（敏感信息）
   vercel env add GITHUB_TOKEN
   
   # 设置其他环境变量
   vercel env add GITHUB_OWNER
   vercel env add GITHUB_REPO
   ```

5. **生产部署**
   ```bash
   vercel --prod
   ```

## 创建 GitHub Personal Access Token

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 选择权限：
   - `repo`（完整仓库访问权限）
4. 生成并保存 Token
5. 将 Token 添加到 Vercel 环境变量 `GITHUB_TOKEN`

## 环境变量说明

| 变量名         | 必需 | 说明                                           |
| -------------- | ---- | ---------------------------------------------- |
| `GITHUB_TOKEN` | ✅    | GitHub Personal Access Token，用于读写订阅数据 |
| `GITHUB_OWNER` | ✅    | GitHub 仓库所有者用户名                        |
| `GITHUB_REPO`  | ✅    | GitHub 仓库名称                                |

## 订阅数据存储

订阅数据存储在 GitHub 仓库的 `data/subscribers.json` 文件中，通过 GitHub API 进行读写。

## 自定义域名

1. 在 Vercel 项目设置中点击 "Domains"
2. 添加你的自定义域名（如 `etf.autos`）
3. 按照提示配置 DNS 记录

## 费用说明

Vercel 免费套餐包括：
- 100GB 带宽/月
- 无限次部署
- 自动 SSL 证书
- Serverless Functions（API 路由）

对于个人项目完全足够。

## 常见问题

### API 返回 500 错误

1. 检查环境变量是否正确设置
2. 确认 GitHub Token 有效且有 `repo` 权限
3. 查看 Vercel 部署日志

### 订阅数据未保存

1. 确认 `GITHUB_OWNER` 和 `GITHUB_REPO` 配置正确
2. 确认 GitHub Token 有仓库写入权限
3. 检查 Vercel 函数日志

### 本地开发

```bash
# 安装依赖
npm install

# 创建 .env.local 文件
GITHUB_TOKEN=your-token
GITHUB_OWNER=your-username
GITHUB_REPO=etf.autos

# 启动开发服务器
npm run dev
```

## 迁移说明

如果你之前使用 GitHub Pages 部署，迁移到 Vercel 后：

1. ✅ API 路由 (`pages/api/*`) 将正常工作
2. ✅ 订阅功能将正常工作
3. ✅ 所有页面路由保持不变
4. ⚠️ 需要更新 DNS 配置指向 Vercel