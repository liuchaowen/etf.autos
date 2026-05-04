// ──── 类型定义 ────

export interface FundItem {
  fund_code: string;
  abbr: string;
  name?: string;
  type: string;
  pinyin: string;
}

export interface TradeSignal {
  time: string;
  price: number;
  shares?: number;
  amount?: number;
  grid_level?: number;
}

export interface TradeRecord {
  date: string;
  type: 'buy' | 'sell';
  price: number;
  shares: number;
  amount: number;
  grid_level: number;
}

export interface StrategyMetrics {
  total_return: number;
  annualized_return: number;
  max_drawdown: number;
  sharpe_ratio: number;
  win_rate: number;
  total_trades: number;
  profit_trades: number;
  loss_trades: number;
  final_value: number;
  initial_value: number;
  avg_trade_cycle: number;
  holding_value?: number;
  holding_shares?: number;
  holding_grids?: number;
  available_cash?: number;
}

export interface StrategyResult {
  code: string;
  config: {
    initial_capital: number;
    grid_width: number;
    num_grids: number;
    grid_investment_percent: number;  // 每格投资占初始资金的百分比
    use_volatility_adjustment: boolean;
  };
  signals: {
    buy_signals: TradeSignal[];
    sell_signals: TradeSignal[];
  };
  metrics: StrategyMetrics;
  trades: TradeRecord[];
}

export interface HistoryItem {
  x: number;
  y: number;
  date?: string;
  nav?: number;
}

export interface StrategyParams {
  initial_capital: number;
  grid_width: number;
  num_grids: number;
  grid_investment_percent: number;  // 每格投资占初始资金的百分比
  use_volatility_adjustment: boolean;
}

export interface ChartDataItem {
  time: string;
  value: number;
}

// 扩展 Window 接口以支持 Waline 实例
declare global {
  interface Window {
    walineInstance?: {
      destroy?: () => void;
    } | null;
  }
}