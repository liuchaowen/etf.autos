# ttfunds-ts

天天基金数据获取 TypeScript 库，支持 Next.js 和前端直接调用。

## 安装

```bash
npm install ttfunds-ts
# 或
yarn add ttfunds-ts
# 或
pnpm add ttfunds-ts
```

## 使用方法

### 基本使用

```typescript
import {
  getFundRealtime,
  getFundHistory,
  getFundList,
  batchGetFundRealtime,
  batchGetFundHistory,
  configure
} from 'ttfunds-ts';

// 配置 (可选)
configure({
  timeout: 15000,      // 请求超时时间 (毫秒)
  retries: 3,          // 重试次数
  maxWorkersRealtime: 5, // 批量获取实时数据并发数
  maxWorkersHistory: 3,  // 批量获取历史数据并发数
});

// 获取单只基金实时净值
const realtime = await getFundRealtime('001186');
console.log(realtime);
// {
//   fundcode: '001186',
//   name: '富国文体健康股票A',
//   jzrq: '2025-04-28',
//   dwjz: 1.234,
//   gsz: 1.245,
//   gszzl: 0.89,
//   gztime: '2025-04-29 15:00'
// }

// 获取单只基金历史净值
const history = await getFundHistory('001186');
console.log(history);
// [
//   { x: 1714300800, y: 1.234, equityReturn: 0.5, unitMoney: null, cumulative: 1.567 },
//   ...
// ]

// 获取全量基金列表
const list = await getFundList();
console.log(list?.slice(0, 5));
// [
//   { fund_code: '000001', abbr: 'HXCZHH', name: '华夏成长混合', type: '混合型', pinyin: 'huaxiachengzhanghunhe' },
//   ...
// ]

// 批量获取实时净值
const realtimeBatch = await batchGetFundRealtime(['001186', '000001', '110022']);

// 批量获取历史净值
const historyBatch = await batchGetFundHistory(['001186', '000001', '110022']);
```

### Next.js API 路由示例

创建 API 路由文件 `app/api/fund/realtime/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getFundRealtime } from 'ttfunds-ts';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: '缺少基金代码参数 code' }, { status: 400 });
  }

  try {
    const data = await getFundRealtime(code);
    if (!data) {
      return NextResponse.json({ error: '获取数据失败' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
```

创建 API 路由文件 `app/api/fund/history/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getFundHistory } from 'ttfunds-ts';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: '缺少基金代码参数 code' }, { status: 400 });
  }

  try {
    const data = await getFundHistory(code);
    if (!data) {
      return NextResponse.json({ error: '获取数据失败' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
```

创建 API 路由文件 `app/api/fund/list/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getFundList } from 'ttfunds-ts';

export async function GET() {
  try {
    const data = await getFundList();
    if (!data) {
      return NextResponse.json({ error: '获取数据失败' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
```

### 前端直接调用

由于天天基金 API 支持 CORS，你也可以在前端直接调用:

```typescript
import { getFundRealtime } from 'ttfunds-ts';

// 在 React 组件中使用
async function fetchFundData() {
  const data = await getFundRealtime('001186');
  return data;
}
```

## API 文档

### `getFundRealtime(code: string)`

获取单只基金实时净值数据。

**参数:**
- `code`: 6位基金代码

**返回:**
```typescript
interface FundRealtime {
  fundcode: string;  // 基金代码
  name: string;      // 基金名称
  jzrq: string;     // 净值日期
  dwjz: number;     // 单位净值
  gsz: number;      // 估算净值
  gszzl: number;    // 估算涨跌幅
  gztime: string;   // 估值时间
}
```

### `getFundHistory(code: string)`

获取单只基金历史净值数据。

**参数:**
- `code`: 6位基金代码

**返回:**
```typescript
interface FundHistoryItem {
  x: number;           // 时间戳
  y: number;           // 单位净值
  equityReturn: number | null;  // 日回报率
  unitMoney: string | null;     // 单位货币
  cumulative: number | null;    // 累计净值
}
```

### `getFundList()`

获取全量基金列表。

**返回:**
```typescript
interface FundListItem {
  fund_code: string;  // 基金代码
  abbr: string;       // 基金简称
  name: string;       // 基金全称
  type: string;       // 基金类型
  pinyin: string;     // 拼音全拼
}
```

### `batchGetFundRealtime(codes: string[], concurrency?: number)`

批量获取多只基金实时净值数据。

### `batchGetFundHistory(codes: string[], concurrency?: number)`

批量获取多只基金历史净值数据。

### `configure(options: Partial<TtfundsConfig>)`

配置库参数。

## 开发

```bash
# 安装依赖
npm install

# 构建
npm run build

# 类型检查
npm run typecheck
```

## License

MIT