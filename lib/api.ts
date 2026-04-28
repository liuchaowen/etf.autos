import { StrategyResult, StrategyParams, FundItem, HistoryItem } from '@/types';
import { backtestGridStrategy } from './gridStrategy';

// 市场的ETF列表
export const ETF_LIST: FundItem[] = [
  { fund_code: '588000', abbr: '科创50', type: 'ETF', pinyin: 'KC50ETF' },
  { fund_code: '510300', abbr: '沪深300', type: 'ETF', pinyin: 'HS300ETF' },
];

// 行业的ETF列表
export const IND_ETF_LIST: FundItem[] = [
  { fund_code: '518880', abbr: '黄金ETF', type: 'ETF', pinyin: 'HJETF' },
  { fund_code: '512010', abbr: '医药ETF', type: 'ETF', pinyin: 'YYETF' },
];

// 导入本地JSON数据
import data588000 from '@/data/588000.json';
import data510300 from '@/data/510300.json';

// 数据映射
const dataMap: Record<string, HistoryItem[]> = {
  '588000': data588000 as HistoryItem[],
  '510300': data510300 as HistoryItem[],
};

/**
 * 获取基金历史数据（从本地JSON）
 */
export function fetchFundHistory(code: string, limit: number = 0, years: number = 0): HistoryItem[] {
  const allData = dataMap[code] || [];
  
  if (limit > 0) {
    return allData.slice(-limit);
  }
  
  if (years > 0) {
    const now = Date.now();
    const cutoff = now - years * 365 * 24 * 60 * 60 * 1000;
    return allData.filter(item => item.x >= cutoff);
  }
  
  return allData;
}

/**
 * 获取网格策略数据（前端计算）
 * @param code ETF代码
 * @param params 策略参数
 * @param years 时间周期（年），0表示全部历史数据
 */
export function fetchGridStrategy(
  code: string,
  params: Partial<StrategyParams> = {},
  years: number = 0
): StrategyResult {
  // 获取历史数据（根据时间周期过滤）
  const historyData = fetchFundHistory(code, 0, years);
  
  if (historyData.length === 0) {
    return {
      code,
      config: {
        initial_capital: params.initial_capital || 10000,
        grid_width: 0.03,
        num_grids: params.num_grids || 15,
        grid_investment_percent: params.grid_investment_percent || 5,
        use_volatility_adjustment: params.use_volatility_adjustment ?? true
      },
      signals: { buy_signals: [], sell_signals: [] },
      metrics: {
        total_return: 0,
        annualized_return: 0,
        max_drawdown: 0,
        sharpe_ratio: 0,
        win_rate: 0,
        total_trades: 0,
        profit_trades: 0,
        loss_trades: 0,
        final_value: params.initial_capital || 10000,
        initial_value: params.initial_capital || 10000,
        avg_trade_cycle: 0
      },
      trades: []
    };
  }
  
  // 执行策略回测
  const result = backtestGridStrategy(historyData, params);
  result.code = code;
  
  return result;
}

/**
 * 格式化百分比
 */
export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(2)}%`;
}

/**
 * 格式化货币
 */
export function formatCurrency(value: number): string {
  return `¥${value.toFixed(2)}`;
}

/**
 * 计算波动率（年化标准差）
 * @param historyData 历史数据
 * @param tradingDaysPerYear 每年交易日数，默认250
 * @returns 年化波动率
 */
export function calculateVolatility(historyData: HistoryItem[], tradingDaysPerYear: number = 250): number {
  if (!historyData || historyData.length < 2) return 0;

  // 按时间排序
  const sortedData = [...historyData].sort((a, b) => a.x - b.x);
  const prices = sortedData.map(item => item.y);

  // 计算日收益率
  const dailyReturns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const returnRate = (prices[i] - prices[i - 1]) / prices[i - 1];
    dailyReturns.push(returnRate);
  }

  if (dailyReturns.length === 0) return 0;

  // 计算平均收益率
  const meanReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;

  // 计算标准差
  const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / dailyReturns.length;
  const dailyStd = Math.sqrt(variance);

  // 年化波动率 = 日标准差 * sqrt(交易日数)
  const annualizedVolatility = dailyStd * Math.sqrt(tradingDaysPerYear);

  return annualizedVolatility;
}

/**
 * 计算年化收益率
 * @param historyData 历史数据
 * @returns 年化收益率
 */
export function calculateAnnualizedReturn(historyData: HistoryItem[]): number {
  if (!historyData || historyData.length < 2) return 0;

  // 按时间排序
  const sortedData = [...historyData].sort((a, b) => a.x - b.x);
  
  const startPrice = sortedData[0].y;
  const endPrice = sortedData[sortedData.length - 1].y;
  const startTime = sortedData[0].x;
  const endTime = sortedData[sortedData.length - 1].x;

  if (startPrice <= 0) return 0;

  // 计算总收益率
  const totalReturn = (endPrice - startPrice) / startPrice;

  // 计算持有年数
  const holdingDays = (endTime - startTime) / (1000 * 60 * 60 * 24);
  const holdingYears = holdingDays / 365;

  if (holdingYears <= 0) return 0;

  // 年化收益率 = (1 + 总收益率)^(1/年数) - 1
  const annualizedReturn = Math.pow(1 + totalReturn, 1 / holdingYears) - 1;

  return annualizedReturn;
}

/**
 * 获取ETF估值数据
 * @param code ETF代码
 * @param years 时间周期（年），0表示全部历史数据
 */
export function fetchValuationData(code: string, years: number = 0): {
  volatility: number;
  annualizedReturn: number;
  historyData: HistoryItem[];
} {
  const historyData = fetchFundHistory(code, 0, years);
  
  const volatility = calculateVolatility(historyData);
  const annualizedReturn = calculateAnnualizedReturn(historyData);

  return {
    volatility,
    annualizedReturn,
    historyData,
  };
}