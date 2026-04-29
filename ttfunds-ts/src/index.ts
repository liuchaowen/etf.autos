/**
 * 天天基金 TypeScript 库
 * 用于获取天天基金数据的 TypeScript/JavaScript 库
 * 
 * @example
 * ```typescript
 * import { getFundRealtime, getFundHistory, getFundList } from 'ttfunds-ts';
 * 
 * // 获取实时净值
 * const realtime = await getFundRealtime('001186');
 * 
 * // 获取历史净值
 * const history = await getFundHistory('001186');
 * 
 * // 获取基金列表
 * const list = await getFundList();
 * ```
 */

// 导出类型
export type {
  FundRealtime,
  FundHistoryItem,
  FundListItem,
  TtfundsConfig,
} from './types';

export { DEFAULT_CONFIG } from './types';

// 导出配置函数
export { configure, getConfig, resetConfig } from './config';

// 导出数据获取函数
export {
  getFundRealtime,
  getFundHistory,
  getFundList,
  batchGetFundRealtime,
  batchGetFundHistory,
} from './fetcher';