/**
 * 天天基金数据类型定义
 */
/**
 * 基金实时数据
 */
interface FundRealtime {
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
interface FundHistoryItem {
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
interface FundListItem {
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
interface TtfundsConfig {
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
declare const DEFAULT_CONFIG: TtfundsConfig;

/**
 * 天天基金配置模块
 */

/**
 * 配置天天基金库
 * @param options 配置选项
 * @returns 当前配置
 */
declare function configure(options: Partial<TtfundsConfig>): TtfundsConfig;
/**
 * 获取当前配置
 * @returns 当前配置
 */
declare function getConfig(): TtfundsConfig;
/**
 * 重置为默认配置
 * @returns 默认配置
 */
declare function resetConfig(): TtfundsConfig;

/**
 * 天天基金数据获取模块
 */

/**
 * 获取基金实时净值数据
 * @param code 基金代码
 * @returns 实时数据或 null
 */
declare function getFundRealtime(code: string): Promise<FundRealtime | null>;
/**
 * 获取基金历史净值数据
 * @param code 基金代码
 * @returns 历史数据数组或 null
 */
declare function getFundHistory(code: string): Promise<FundHistoryItem[] | null>;
/**
 * 获取全量基金列表
 * @returns 基金列表数组或 null
 */
declare function getFundList(): Promise<FundListItem[] | null>;
/**
 * 批量获取基金实时净值数据
 * @param codes 基金代码数组
 * @param concurrency 并发数 (默认使用配置中的 maxWorkersRealtime)
 * @returns 基金代码到实时数据的映射
 */
declare function batchGetFundRealtime(codes: string[], concurrency?: number): Promise<Record<string, FundRealtime | null>>;
/**
 * 批量获取基金历史净值数据
 * @param codes 基金代码数组
 * @param concurrency 并发数 (默认使用配置中的 maxWorkersHistory)
 * @returns 基金代码到历史数据的映射
 */
declare function batchGetFundHistory(codes: string[], concurrency?: number): Promise<Record<string, FundHistoryItem[] | null>>;

export { DEFAULT_CONFIG, type FundHistoryItem, type FundListItem, type FundRealtime, type TtfundsConfig, batchGetFundHistory, batchGetFundRealtime, configure, getConfig, getFundHistory, getFundList, getFundRealtime, resetConfig };
