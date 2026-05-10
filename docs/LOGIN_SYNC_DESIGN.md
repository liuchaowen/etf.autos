# 登录同步数据方案设计

## 📊 当前数据存储情况

项目目前使用 `localStorage` 存储以下数据：

| 存储键                           | 内容              | 文件位置             |
| -------------------------------- | ----------------- | -------------------- |
| `etf_favorites`                  | 收藏的ETF列表     | `lib/favorites.ts`   |
| `strategy_params_{code}_{years}` | 每个ETF的策略参数 | `pages/strategy.tsx` |
| `strategy_code_cache`            | 当前选中的ETF代码 | `pages/strategy.tsx` |

---

## 🎯 推荐方案：GitHub OAuth + GitHub Gist

### 为什么选择这个方案？

| 特性             | GitHub OAuth + Gist | Firebase         | Supabase         |
| ---------------- | ------------------- | ---------------- | ---------------- |
| 完全免费         | ✅                   | ❌ (有限额)       | ❌ (有限额)       |
| 无需后端         | ✅                   | ✅                | ✅                |
| 数据掌控权       | ✅ 用户自己的Gist    | ❌ 托管在Firebase | ❌ 托管在Supabase |
| GitHub Pages兼容 | ✅ 完美              | ✅                | ✅                |
| 国内访问         | ⚠️ 需代理            | ⚠️ 需代理         | ⚠️ 需代理         |

---

## 🏗️ 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    用户浏览器 (Client)                        │
├─────────────────────────────────────────────────────────────┤
│  1. 点击"GitHub登录"                                          │
│  2. 跳转 GitHub OAuth 授权页                                  │
│  3. 用户授权后回调到你的页面 (带 code)                          │
│  4. 前端用 code 换取 access_token                             │
│  5. 用 access_token 读写用户私有 Gist                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    GitHub API                                │
├─────────────────────────────────────────────────────────────┤
│  • OAuth App (注册在 GitHub)                                 │
│  • Gist API (存储用户数据)                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 实现步骤

### 第一步：创建 GitHub OAuth App

1. 进入 GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
2. 填写信息：
   - **Application name**: `ETF Autos`
   - **Homepage URL**: `https://yourusername.github.io/etf.autos/`
   - **Authorization callback URL**: `https://yourusername.github.io/etf.autos/auth/callback`
3. 获取 `Client ID` 和 `Client Secret`

### 第二步：数据结构设计

用户私有 Gist 中的数据格式：

```json
{
  "description": "ETF Autos 用户数据同步",
  "files": {
    "etf-autos-data.json": {
      "content": {
        "version": "1.0",
        "updatedAt": "2024-01-15T10:30:00Z",
        "favorites": [
          {
            "fund_code": "588000",
            "abbr": "科创50ETF",
            "type": "index",
            "pinyin": "kc50"
          }
        ],
        "strategyParams": {
          "588000_0.5": {
            "initial_capital": 50000,
            "grid_width": 0.025,
            "num_grids": 14,
            "grid_investment_percent": 10,
            "use_volatility_adjustment": true
          }
        },
        "lastSelectedCode": "588000"
      }
    }
  }
}
```

### 第三步：核心代码结构

```
lib/
├── auth/
│   ├── github-oauth.ts      # OAuth 认证逻辑
│   ├── auth-context.tsx     # React Context 提供登录状态
│   └── use-auth.ts          # 自定义 Hook
├── sync/
│   ├── gist-service.ts      # Gist API 封装
│   ├── sync-manager.ts      # 同步管理器（合并本地/远程数据）
│   └── use-sync.ts          # 同步 Hook
```

### 第四步：关键代码示例

#### OAuth 认证流程

```typescript
// lib/auth/github-oauth.ts
const CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI;

// 生成登录URL
export function getLoginUrl(): string {
  const state = crypto.randomUUID(); // 防CSRF
  sessionStorage.setItem('oauth_state', state);
  
  const params = new URLSearchParams({
    client_id: CLIENT_ID!,
    redirect_uri: REDIRECT_URI!,
    scope: 'gist', // 只需要 gist 权限
    state,
  });
  
  return `https://github.com/login/oauth/authorize?${params}`;
}

// 用 code 换取 token（需要代理服务）
export async function exchangeCodeForToken(code: string): Promise<string> {
  // 注意：这里需要一个代理服务，因为 GitHub token 端点不支持 CORS
  // 方案A：使用 GitHub 官方设备流（推荐）
  // 方案B：使用 Cloudflare Workers / Vercel Edge Functions 代理
}
```

#### Gist 服务

```typescript
// lib/sync/gist-service.ts
const GIST_ID_KEY = 'etf_autos_gist_id';
const GIST_FILENAME = 'etf-autos-data.json';

export class GistService {
  private token: string;
  
  constructor(token: string) {
    this.token = token;
  }
  
  // 获取或创建用户数据 Gist
  async getOrCreateGist(): Promise<string> {
    let gistId = localStorage.getItem(GIST_ID_KEY);
    
    if (gistId) {
      return gistId;
    }
    
    // 搜索现有 Gist
    const gists = await fetch('https://api.github.com/gists', {
      headers: { Authorization: `token ${this.token}` }
    }).then(r => r.json());
    
    const existing = gists.find((g: any) => g.files[GIST_FILENAME]);
    if (existing) {
      localStorage.setItem(GIST_ID_KEY, existing.id);
      return existing.id;
    }
    
    // 创建新 Gist
    const newGist = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: { Authorization: `token ${this.token}` },
      body: JSON.stringify({
        description: 'ETF Autos 用户数据',
        public: false,
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify({ version: '1.0', favorites: [], strategyParams: {} })
          }
        }
      })
    }).then(r => r.json());
    
    localStorage.setItem(GIST_ID_KEY, newGist.id);
    return newGist.id;
  }
  
  // 读取数据
  async readData(): Promise<UserData> {
    const gistId = await this.getOrCreateGist();
    const gist = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: { Authorization: `token ${this.token}` }
    }).then(r => r.json());
    
    return JSON.parse(gist.files[GIST_FILENAME].content);
  }
  
  // 写入数据
  async writeData(data: UserData): Promise<void> {
    const gistId = await this.getOrCreateGist();
    await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: { Authorization: `token ${this.token}` },
      body: JSON.stringify({
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify({ ...data, updatedAt: new Date().toISOString() })
          }
        }
      })
    });
  }
}
```

---

## ⚠️ 重要问题：OAuth Token 获取

GitHub OAuth 的 `access_token` 端点 **不支持 CORS**，纯静态站点无法直接获取 token。有以下解决方案：

### 方案A：GitHub Device Flow（推荐）

适合纯静态部署，无需后端代理：

```
1. 用户点击登录
2. 前端请求 device_code（支持CORS）
3. 显示验证码，用户打开 github.com/login/device 输入
4. 前端轮询获取 access_token
```

**优点**：
- 完全无后端
- 部署简单

**缺点**：
- 用户需要手动输入验证码
- 体验稍差

**实现示例**：

```typescript
// lib/auth/device-flow.ts
const CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID!;

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

interface TokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

// 步骤1：获取设备码
export async function initiateDeviceFlow(): Promise<DeviceCodeResponse> {
  const response = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ client_id: CLIENT_ID, scope: 'gist' })
  });
  
  return response.json();
}

// 步骤2：轮询获取token
export async function pollForToken(deviceCode: string, interval: number): Promise<string> {
  while (true) {
    await new Promise(resolve => setTimeout(resolve, interval * 1000));
    
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
      })
    });
    
    const data: TokenResponse = await response.json();
    
    if (data.access_token) {
      return data.access_token;
    }
    
    if (data.error === 'authorization_pending') {
      continue; // 继续等待
    }
    
    if (data.error === 'expired_token') {
      throw new Error('验证码已过期，请重新登录');
    }
    
    throw new Error(data.error_description || '登录失败');
  }
}
```

### 方案B：Cloudflare Workers 代理

免费额度充足，部署简单：

```javascript
// worker.js
const CLIENT_ID = 'your_client_id';
const CLIENT_SECRET = 'your_client_secret';

export default {
  async fetch(request) {
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': 'https://yourusername.github.io',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }
    
    const { code } = await request.json();
    
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
      }),
    });
    
    const data = await response.text();
    
    return new Response(data, {
      headers: {
        'Access-Control-Allow-Origin': 'https://yourusername.github.io',
        'Content-Type': 'application/json',
      }
    });
  }
}
```

**优点**：
- 一键登录，体验好
- 标准 OAuth 流程

**缺点**：
- 需要额外配置 Cloudflare Workers
- Client Secret 需要安全存储

### 方案C：Vercel Edge Functions

如果你愿意将项目部署到 Vercel，可以使用 Edge Functions 作为代理：

```typescript
// api/auth/callback.ts
import { NextRequest, NextResponse } from 'next/server';

export const config = { runtime: 'edge' };

export default async function handler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  
  const data = await response.json();
  
  // 重定向回前端，带 token
  return NextResponse.redirect(
    new URL(`/auth/success?token=${data.access_token}`, request.url)
  );
}
```

---

## 🎨 UI/UX 设计建议

### Header 组件设计

```
┌─────────────────────────────────────────┐
│  Header                                  │
│  ┌───────────────────────────────────┐  │
│  │ ETF Autos    [登录] [同步▼]        │  │
│  └───────────────────────────────────┘  │
│                                          │
│  登录后：                                │
│  ┌───────────────────────────────────┐  │
│  │ ETF Autos    [头像▼] [同步状态]    │  │
│  │               ├─ 立即同步          │  │
│  │               ├─ 查看云端数据      │  │
│  │               └─ 退出登录          │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### 同步状态指示

- 🟢 已同步 - 本地与云端一致
- 🟡 同步中... - 正在上传/下载
- 🔴 未同步 - 需要手动同步
- ⚪ 未登录 - 点击登录

### 登录弹窗设计（Device Flow）

```
┌─────────────────────────────────────────┐
│  GitHub 登录                         ✕  │
├─────────────────────────────────────────┤
│                                          │
│  请在浏览器中打开：                       │
│  ┌─────────────────────────────────┐    │
│  │  https://github.com/login/device │    │
│  └─────────────────────────────────┘    │
│                                          │
│  输入验证码：                             │
│  ┌─────────────────────────────────┐    │
│  │         1234-ABCD                │    │
│  └─────────────────────────────────┘    │
│                                          │
│  [复制验证码]  [打开授权页面]             │
│                                          │
│  等待授权中...                           │
│                                          │
└─────────────────────────────────────────┘
```

---

## 📋 实现清单

| 序号 | 任务                                      | 优先级 | 状态 |
| ---- | ----------------------------------------- | ------ | ---- |
| 1    | 创建 GitHub OAuth App                     | 高     | ⬜    |
| 2    | 选择 Token 获取方案（Device Flow 或代理） | 高     | ⬜    |
| 3    | 实现 `lib/auth/` 认证模块                 | 高     | ⬜    |
| 4    | 实现 `lib/sync/` 同步模块                 | 高     | ⬜    |
| 5    | 创建 `pages/auth/callback.tsx` 回调页     | 高     | ⬜    |
| 6    | 修改 Header 组件添加登录按钮              | 中     | ⬜    |
| 7    | 实现数据合并策略（本地 vs 远程冲突处理）  | 中     | ⬜    |
| 8    | 添加自动同步（页面加载/数据变更时）       | 低     | ⬜    |
| 9    | 添加同步状态 UI 反馈                      | 低     | ⬜    |

---

## 🔄 同步策略选项

### 选项1：手动同步
- 用户点击"同步"按钮触发
- 简单可控
- 用户明确知道何时同步

### 选项2：自动同步
- 每次数据变更自动上传
- 页面加载时自动下载
- 无感知，但可能频繁请求

### 选项3：混合同步
- 登录时自动同步一次
- 提供手动同步按钮
- 数据变更时本地标记，定时批量同步

---

## 🔀 冲突处理策略

### 策略1：时间戳优先
- 比较 `updatedAt` 时间戳
- 以最新的为准
- 简单但可能丢失数据

### 策略2：合并数据
- 收藏列表：取并集
- 策略参数：以最新为准
- 复杂但数据完整

### 策略3：用户选择
- 检测冲突时弹窗
- 让用户选择保留哪个版本
- 最安全但体验稍差

---

## 📁 文件结构预览

```
lib/
├── auth/
│   ├── github-oauth.ts      # OAuth 认证核心逻辑
│   ├── device-flow.ts       # Device Flow 实现（可选）
│   ├── auth-context.tsx     # React Context
│   └── use-auth.ts          # 自定义 Hook
├── sync/
│   ├── gist-service.ts      # Gist API 封装
│   ├── sync-manager.ts      # 同步管理器
│   ├── types.ts             # 类型定义
│   └── use-sync.ts          # 同步 Hook
├── favorites.ts             # 现有文件，需修改以支持同步
└── gridStrategy.ts          # 现有文件

pages/
├── auth/
│   ├── callback.tsx         # OAuth 回调页（方案B/C）
│   └── device.tsx           # Device Flow 登录页（方案A）
└── ...

components/
├── auth/
│   ├── login-button.tsx     # 登录按钮
│   ├── sync-status.tsx      # 同步状态指示器
│   └── user-menu.tsx        # 用户菜单
└── header.tsx               # 现有文件，需修改
```

---

## ✅ 已实现

本方案已完整实现，采用以下配置：

1. **Token 获取方案**：Device Flow（完全无后端）
2. **同步时机**：混合模式（登录时自动同步 + 手动同步按钮）
3. **冲突处理**：时间戳优先

### 文件结构

```
lib/
├── auth/
│   ├── types.ts              # 认证类型定义
│   ├── device-flow.ts        # Device Flow 实现
│   ├── auth-context.tsx      # React Context
│   └── use-auth.ts           # 导出 Hook
├── sync/
│   ├── types.ts              # 同步类型定义
│   ├── gist-service.ts       # Gist API 封装
│   ├── sync-manager.ts       # 同步管理器
│   └── sync-context.tsx      # React Context
components/
├── auth/
│   ├── login-button.tsx      # 登录按钮
│   ├── sync-status.tsx       # 同步状态指示器
│   └── user-menu.tsx         # 用户菜单
pages/
├── auth/
│   └── login.tsx             # 登录页面
└── _app.tsx                  # 已集成 Provider
```

---

## 🚀 使用说明

### 1. 创建 GitHub OAuth App

1. 进入 GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
2. 填写信息：
   - **Application name**: `ETF Autos`
   - **Homepage URL**: `https://yourusername.github.io/etf.autos/`
   - **Authorization callback URL**: 不需要（Device Flow 无回调）
3. 获取 `Client ID`

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

编辑 `.env.local`，填写你的 GitHub Client ID：

```
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_actual_client_id
```

### 3. 本地测试

```bash
npm run dev
```

访问 http://localhost:3000/auth/login 测试登录流程。

### 4. 部署到 GitHub Pages

确保在 GitHub 仓库设置中添加 Secrets：
- `NEXT_PUBLIC_GITHUB_CLIENT_ID`: 你的 Client ID

---

## 📝 注意事项

1. **Device Flow 限制**：用户需要手动输入验证码，体验稍差但完全无后端
2. **Gist 权限**：只请求 `gist` 权限，数据存储在用户私有 Gist 中
3. **数据安全**：用户可随时在 GitHub 中查看或删除同步的数据
4. **国内访问**：GitHub API 可能需要代理访问
