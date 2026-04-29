/**
 * 天天基金数据获取模块
 */

import { FundRealtime, FundHistoryItem, FundListItem } from './types';
import { getConfig } from './config';

// CORS 代理服务
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
];

// 当前使用的代理索引
let currentProxyIndex = 0;

/**
 * 获取当前 CORS 代理
 */
function getCorsProxy(): string {
  return CORS_PROXIES[currentProxyIndex];
}

/**
 * 切换到下一个 CORS 代理
 */
function switchProxy(): void {
  currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
}

/**
 * 添加 CORS 代理到 URL
 */
function addCorsProxy(url: string): string {
  const proxy = getCorsProxy();
  return proxy + encodeURIComponent(url);
}

// API 基础 URL
const BASE_URL = 'https://fund.eastmoney.com/pingzhongdata/{}.js';
const REALTIME_URL = 'https://fundgz.1234567.com.cn/js/{}.js';
const FUND_LIST_URL = 'https://fund.eastmoney.com/js/fundcode_search.js';

/**
 * 从东财基金 JS 中提取指定变量的值
 * @param text JS 文本
 * @param key 变量名
 * @returns 提取的值字符串
 */
function extractJsValue(text: string, key: string): string | null {
  const start = text.indexOf(key);
  if (start === -1) return null;

  // 找到等号后的第一个非空白字符
  let idx = text.indexOf('=', start);
  if (idx === -1) return null;
  idx += 1;

  while (idx < text.length && text[idx].trim() === '') {
    idx += 1;
  }

  if (idx >= text.length) return null;

  const opening = text[idx];
  const pairs: Record<string, string> = { '[': ']', '{': '}', '(': ')' };

  if (!(opening in pairs)) {
    // 处理字符串/简单值，直到分号结束
    let end = text.indexOf(';', idx);
    if (end === -1) end = text.length;
    return text.slice(idx, end).trim();
  }

  const closing = pairs[opening];
  let depth = 0;
  let inString = false;
  let stringQuote = '';
  let escape = false;

  for (let i = idx; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === stringQuote) {
        inString = false;
      }
      continue;
    }

    if (ch === "'" || ch === '"') {
      inString = true;
      stringQuote = ch;
      continue;
    }

    if (ch === opening) {
      depth += 1;
    } else if (ch === closing) {
      depth -= 1;
      if (depth === 0) {
        return text.slice(idx, i + 1);
      }
    }
  }

  return null;
}

/**
 * 带重试和 CORS 代理的 fetch 请求
 * @param url 请求 URL
 * @returns 响应文本
 */
async function fetchWithRetry(url: string): Promise<string | null> {
  const { timeout, retries } = getConfig();

  // 尝试每个 CORS 代理
  for (let proxyAttempt = 0; proxyAttempt < CORS_PROXIES.length; proxyAttempt++) {
    const proxyUrl = addCorsProxy(url);
    
    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(proxyUrl, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          return await response.text();
        }
      } catch (error) {
        // 最后一次重试失败，切换到下一个代理
        if (i === retries - 1) {
          console.error(`Fetch failed for ${proxyUrl}:`, error);
          switchProxy();
          break;
        }
        // 等待 1 秒后重试
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  return null;
}

/**
 * 获取基金实时净值数据
 * @param code 基金代码
 * @returns 实时数据或 null
 */
export async function getFundRealtime(code: string): Promise<FundRealtime | null> {
  const url = REALTIME_URL.replace('{}', code);
  const text = await fetchWithRetry(url);

  if (!text) return null;

  try {
    // 数据格式类似 jsonpgz({...});
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) return null;

    const dataStr = text.slice(start, end + 1);
    const data = JSON.parse(dataStr) as FundRealtime;
    return data;
  } catch (error) {
    console.error(`Error parsing realtime data for ${code}:`, error);
    return null;
  }
}

/**
 * 历史净值数据原始项
 */
interface HistoryRawItem {
  x: number;
  y: number;
  equityReturn?: number | null;
  unitMoney?: string | null;
}

/**
 * 累计净值原始项
 */
interface CumulativeRawItem {
  0: number; // timestamp
  1: number; // cumulative
}

/**
 * 获取基金历史净值数据
 * @param code 基金代码
 * @returns 历史数据数组或 null
 */
export async function getFundHistory(code: string): Promise<FundHistoryItem[] | null> {
  const url = BASE_URL.replace('{}', code);
  const text = await fetchWithRetry(url);

  if (!text) return null;

  try {
    // 提取单位净值趋势数据
    const networthRaw = extractJsValue(text, 'Data_netWorthTrend');
    if (!networthRaw) {
      throw new Error('Data_netWorthTrend not found');
    }

    const networthData = JSON.parse(networthRaw) as HistoryRawItem[];

    // 提取累计净值趋势数据
    const cumRaw = extractJsValue(text, 'Data_ACWorthTrend');
    if (!cumRaw) {
      throw new Error('Data_ACWorthTrend not found');
    }

    // 累计净值数据使用单引号，需要替换为双引号
    const cumData = JSON.parse(cumRaw.replace(/'/g, '"')) as CumulativeRawItem[];

    // 创建累计净值映射
    const cumulativeMap = new Map<number, number>();
    cumData.forEach((item) => {
      cumulativeMap.set(item[0], item[1]);
    });

    // 合并数据
    const result: FundHistoryItem[] = networthData.map((item) => ({
      x: item.x,
      y: item.y,
      equityReturn: item.equityReturn ?? null,
      unitMoney: item.unitMoney ?? null,
      cumulative: cumulativeMap.get(item.x) ?? null,
    }));

    return result;
  } catch (error) {
    console.error(`Error processing history data for ${code}:`, error);
    return null;
  }
}

/**
 * 获取全量基金列表
 * @returns 基金列表数组或 null
 */
export async function getFundList(): Promise<FundListItem[] | null> {
  const text = await fetchWithRetry(FUND_LIST_URL);

  if (!text) return null;

  try {
    // 数据格式类似 var r = [...];
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start === -1 || end === -1) return null;

    const jsonStr = text.slice(start, end + 1);
    const rawData = JSON.parse(jsonStr) as string[][];

    const data: FundListItem[] = rawData.map((item) => ({
      fund_code: item[0],
      abbr: item[1],
      name: item[2],
      type: item[3],
      pinyin: item[4],
    }));

    return data;
  } catch (error) {
    console.error('Error processing fund list:', error);
    return null;
  }
}

/**
 * 批量获取基金实时净值数据
 * @param codes 基金代码数组
 * @param concurrency 并发数 (默认使用配置中的 maxWorkersRealtime)
 * @returns 基金代码到实时数据的映射
 */
export async function batchGetFundRealtime(
  codes: string[],
  concurrency?: number
): Promise<Record<string, FundRealtime | null>> {
  const { maxWorkersRealtime } = getConfig();
  const limit = concurrency ?? maxWorkersRealtime;

  const results: Record<string, FundRealtime | null> = {};

  // 分批并发执行
  for (let i = 0; i < codes.length; i += limit) {
    const batch = codes.slice(i, i + limit);
    const batchResults = await Promise.all(
      batch.map(async (code) => ({
        code,
        data: await getFundRealtime(code),
      }))
    );

    batchResults.forEach(({ code, data }) => {
      results[code] = data;
    });
  }

  return results;
}

/**
 * 批量获取基金历史净值数据
 * @param codes 基金代码数组
 * @param concurrency 并发数 (默认使用配置中的 maxWorkersHistory)
 * @returns 基金代码到历史数据的映射
 */
export async function batchGetFundHistory(
  codes: string[],
  concurrency?: number
): Promise<Record<string, FundHistoryItem[] | null>> {
  const { maxWorkersHistory } = getConfig();
  const limit = concurrency ?? maxWorkersHistory;

  const results: Record<string, FundHistoryItem[] | null> = {};

  // 分批并发执行
  for (let i = 0; i < codes.length; i += limit) {
    const batch = codes.slice(i, i + limit);
    const batchResults = await Promise.all(
      batch.map(async (code) => ({
        code,
        data: await getFundHistory(code),
      }))
    );

    batchResults.forEach(({ code, data }) => {
      results[code] = data;
    });
  }

  return results;
}