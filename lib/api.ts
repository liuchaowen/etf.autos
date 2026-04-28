import { StrategyResult, StrategyParams, FundItem, HistoryItem } from '@/types';
import { backtestGridStrategy } from './gridStrategy';

// 市场的ETF列表
export const ETF_LIST: FundItem[] = [
  { fund_code: '588000', abbr: '科创50', type: 'ETF', pinyin: 'KC50ETF' },
  { fund_code: '510300', abbr: '沪深300', type: 'ETF', pinyin: 'HS300ETF' },
  { fund_code: '159951', abbr: '创业板', type: 'ETF', pinyin: 'CYBETF' },
];

// 行业的ETF列表
export const IND_ETF_LIST: FundItem[] = [
  { fund_code: '518880', abbr: '黄金ETF', type: 'ETF', pinyin: 'HJETF' },
  { fund_code: '512010', abbr: '医药ETF', type: 'ETF', pinyin: 'YYETF' },
];

// 导入本地JSON数据
import data588000 from '@/data/588000.json';
import data510300 from '@/data/510300.json';
import data159951 from '@/data/159951.json';

// 数据映射
const dataMap: Record<string, HistoryItem[]> = {
  '588000': data588000 as HistoryItem[],
  '510300': data510300 as HistoryItem[],
  '159951': data159951 as HistoryItem[],
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
 */
export function fetchGridStrategy(
  code: string,
  params: Partial<StrategyParams> = {}
): StrategyResult {
  // 获取历史数据
  const historyData = fetchFundHistory(code);
  
  if (historyData.length === 0) {
    return {
      code,
      config: {
        initial_capital: params.initial_capital || 10000,
        grid_width: 0.03,
        num_grids: params.num_grids || 15,
        shares_per_grid: params.shares_per_grid || 500,
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