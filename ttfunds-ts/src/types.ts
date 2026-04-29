/**
 * 天天基金数据类型定义
 */

/**
 * 基金实时数据
 */
export interface FundRealtime {
  /** 基金代码 */
  fundcode: string;
  /** 基金名称 */
  name: string;
  /** 净值日期 (YYYY-MM-DD) */
  jzrq: string;
  /** 单位净值 */
  dwjz: number;
  /** 估算净值 */
  gsz: number;
  /** 估算涨跌幅 (百分比) */
  gszzl: number;
  /** 估值时间 (YYYY-MM-DD HH:MM) */
  gztime: string;
}

/**
 * 历史净值数据项
 */
export interface FundHistoryItem {
  /** 时间戳 */
  x: number;
  /** 单位净值 */
  y: number;
  /** 日回报率 (百分比) */
  equityReturn: number | null;
  /** 单位货币 */
  unitMoney: string | null;
  /** 累计净值 */
  cumulative: number | null;
}

/**
 * 基金列表项
 */
export interface FundListItem {
  /** 基金代码 */
  fund_code: string;
  /** 基金简称 */
  abbr: string;
  /** 基金全称 */
  name: string;
  /** 基金类型 */
  type: string;
  /** 拼音全拼 */
  pinyin: string;
}

/**
 * 配置选项
 */
export interface TtfundsConfig {
  /** 请求超时时间 (毫秒) */
  timeout: number;
  /** 重试次数 */
  retries: number;
  /** 并发获取实时数据的最大工作线程数 */
  maxWorkersRealtime: number;
  /** 并发获取历史数据的最大工作线程数 */
  maxWorkersHistory: number;
}

/**
 * 默认配置
 */
export const DEFAULT_CONFIG: TtfundsConfig = {
  timeout: 10000,
  retries: 3,
  maxWorkersRealtime: 5,
  maxWorkersHistory: 3,
};