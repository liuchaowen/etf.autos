/**
 * 网格交易策略模块
 * 根据波动率自动计算网格宽度，生成买卖信号，计算策略指标
 */

import { StrategyResult, StrategyParams, HistoryItem, TradeSignal, TradeRecord, StrategyMetrics } from '@/types';

interface Trade {
  date: string;
  type: 'buy' | 'sell';
  price: number;
  market_price: number;
  shares: number;
  amount: number;
  grid_level: number;
}

interface PositionStatus {
  holding_value: number;
  holding_shares: number;
  holding_grids: number;
  available_cash: number;
  total_value: number;
}

interface PriceRange {
  min: number;
  max: number;
  mean: number;
  median: number;
  percentile_low: number;
  percentile_high: number;
  std: number;
  range: number;
}

/**
 * 计算平均真实波幅(ATR)
 */
function calculateATR(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) {
    period = Math.max(1, prices.length - 1);
  }

  const trueRanges: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const tr = Math.abs(prices[i] - prices[i - 1]);
    trueRanges.push(tr);
  }

  if (trueRanges.length === 0) return 0;

  // 简单移动平均
  const atr = trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period;
  return atr;
}

/**
 * 根据ATR计算网格宽度
 */
function calculateGridWidthFromATR(
  atr: number,
  currentPrice: number,
  multiplier: number = 1.5,
  minWidth: number = 0.02,
  maxWidth: number = 0.08
): number {
  if (currentPrice <= 0 || atr <= 0) {
    return minWidth;
  }

  // 计算ATR占价格的百分比
  const atrPercent = atr / currentPrice;

  // 应用乘数得到网格宽度
  let gridWidth = atrPercent * multiplier;

  // 限制在合理范围内
  gridWidth = Math.max(minWidth, Math.min(maxWidth, gridWidth));

  return gridWidth;
}

/**
 * 分析历史价格区间
 */
function analyzePriceRange(
  prices: number[],
  percentileLow: number = 10,
  percentileHigh: number = 90
): PriceRange {
  if (!prices || prices.length === 0) {
    return {
      min: 0, max: 0, mean: 0, median: 0,
      percentile_low: 0, percentile_high: 0,
      std: 0, range: 0
    };
  }

  const sortedPrices = [...prices].sort((a, b) => a - b);
  const n = sortedPrices.length;

  // 基本统计
  const minPrice = sortedPrices[0];
  const maxPrice = sortedPrices[n - 1];
  const meanPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const medianPrice = sortedPrices[Math.floor(n / 2)];

  // 百分位数
  let lowIdx = Math.floor(n * percentileLow / 100);
  let highIdx = Math.floor(n * percentileHigh / 100) - 1;
  lowIdx = Math.max(0, lowIdx);
  highIdx = Math.min(n - 1, highIdx);

  const percentileLowPrice = sortedPrices[lowIdx];
  const percentileHighPrice = sortedPrices[highIdx];

  // 标准差
  const variance = prices.reduce((sum, p) => sum + Math.pow(p - meanPrice, 2), 0) / prices.length;
  const stdPrice = variance > 0 ? Math.sqrt(variance) : 0;

  return {
    min: minPrice,
    max: maxPrice,
    mean: meanPrice,
    median: medianPrice,
    percentile_low: percentileLowPrice,
    percentile_high: percentileHighPrice,
    std: stdPrice,
    range: maxPrice - minPrice
  };
}

/**
 * 计算最优基准价格
 */
function calculateOptimalBasePrice(prices: number[], method: string = 'median'): number {
  if (!prices || prices.length === 0) return 0;

  const sortedPrices = [...prices].sort((a, b) => a - b);
  const n = sortedPrices.length;

  if (method === 'median') {
    return sortedPrices[Math.floor(n / 2)];
  } else if (method === 'mean') {
    return prices.reduce((a, b) => a + b, 0) / prices.length;
  } else if (method === 'percentile_mid') {
    const lowIdx = Math.floor(n * 0.25);
    const highIdx = Math.floor(n * 0.75);
    const midPrices = sortedPrices.slice(lowIdx, highIdx + 1);
    return midPrices.length > 0 ? midPrices.reduce((a, b) => a + b, 0) / midPrices.length : sortedPrices[Math.floor(n / 2)];
  } else {
    return sortedPrices[Math.floor(n / 2)];
  }
}

/**
 * 生成网格买卖价格水平
 */
function generateGridLevels(
  basePrice: number,
  gridWidth: number,
  numGrids: number = 10,
  priceRange: PriceRange | null = null,
  adaptive: boolean = true
): [number[], number[]] {
  const buyLevels: number[] = [];
  const sellLevels: number[] = [];

  if (adaptive && priceRange) {
    // 自适应网格
    const low = priceRange.percentile_low;
    const high = priceRange.percentile_high;

    // 计算基准价格在区间中的相对位置
    let relativePosition = 0.5;
    if (high > low) {
      relativePosition = (basePrice - low) / (high - low);
      relativePosition = Math.max(0, Math.min(1, relativePosition));
    }

    // 根据相对位置分配买卖网格数量
    let numBuyGrids = Math.floor(numGrids * (1 - relativePosition) * 1.5) + 1;
    let numSellGrids = Math.floor(numGrids * relativePosition * 1.5) + 1;

    numBuyGrids = Math.max(2, Math.min(numGrids, numBuyGrids));
    numSellGrids = Math.max(2, Math.min(numGrids, numSellGrids));

    // 生成买入网格
    for (let i = 1; i <= numBuyGrids; i++) {
      let buyPrice = basePrice * (1 - gridWidth * i);
      if (priceRange.min > 0) {
        buyPrice = Math.max(buyPrice, priceRange.min * 0.95);
      }
      buyLevels.push(buyPrice);
    }

    // 生成卖出网格
    for (let i = 1; i <= numSellGrids; i++) {
      let sellPrice = basePrice * (1 + gridWidth * i);
      if (priceRange.max > 0) {
        sellPrice = Math.min(sellPrice, priceRange.max * 1.05);
      }
      sellLevels.push(sellPrice);
    }
  } else {
    // 传统对称网格
    for (let i = 1; i <= numGrids; i++) {
      buyLevels.push(basePrice * (1 - gridWidth * i));
      sellLevels.push(basePrice * (1 + gridWidth * i));
    }
  }

  return [buyLevels, sellLevels];
}

/**
 * 时间戳转日期字符串
 */
function timestampToDate(ts: number): string {
  if (ts === 0) return '';
  // 时间戳可能是毫秒或秒
  if (ts > 10000000000) {
    ts = Math.floor(ts / 1000);
  }
  const date = new Date(ts * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 回测网格交易策略
 */
export function backtestGridStrategy(
  historyData: HistoryItem[],
  params: Partial<StrategyParams> = {}
): StrategyResult {
  const {
    initial_capital = 10000,
    grid_width = 0,
    num_grids = 15,
    shares_per_grid = 500,
    use_volatility_adjustment = true
  } = params;

  const atrPeriod = 14;
  const atrMultiplier = 1.5;
  const minGridWidth = 0.02;
  const maxGridWidth = 0.08;
  const useAdaptiveGrid = true;
  const basePriceMethod = 'median';

  if (!historyData || historyData.length < 2) {
    return createEmptyResult(initial_capital);
  }

  // 按时间戳排序
  const sortedData = [...historyData].sort((a, b) => a.x - b.x);

  // 提取价格序列
  const prices = sortedData.map(item => item.y);
  const dates = sortedData.map(item => timestampToDate(item.x));

  // 分析价格区间
  const priceRange = analyzePriceRange(prices);

  // 计算基准价格
  const basePrice = calculateOptimalBasePrice(prices, basePriceMethod);

  // 确定网格宽度
  let actualGridWidth = grid_width;
  if (actualGridWidth === 0 || actualGridWidth === undefined) {
    if (use_volatility_adjustment) {
      const atr = calculateATR(prices, atrPeriod);
      actualGridWidth = calculateGridWidthFromATR(
        atr,
        basePrice,
        atrMultiplier,
        minGridWidth,
        maxGridWidth
      );
    } else {
      if (priceRange.range > 0 && basePrice > 0) {
        const suggestedWidth = priceRange.std / basePrice;
        actualGridWidth = Math.max(minGridWidth, Math.min(maxGridWidth, suggestedWidth));
      } else {
        actualGridWidth = 0.03;
      }
    }
  }

  // 生成网格水平
  const [buyLevels, sellLevels] = generateGridLevels(
    basePrice,
    actualGridWidth,
    num_grids,
    priceRange,
    useAdaptiveGrid
  );

  // 初始化状态
  let cash = initial_capital;
  let shares = 0;
  const trades: Trade[] = [];
  const portfolioValues: number[] = [];
  const dailyReturns: number[] = [];

  // 网格状态跟踪
  const buyGridStatus = new Array(buyLevels.length).fill(false);

  // 遍历历史数据
  for (let i = 0; i < sortedData.length; i++) {
    const price = prices[i];
    const date = dates[i];

    if (price <= 0) continue;

    // 检查买入信号
    for (let levelIdx = 0; levelIdx < buyLevels.length; levelIdx++) {
      const buyPrice = buyLevels[levelIdx];
      if (!buyGridStatus[levelIdx] && price <= buyPrice && cash >= buyPrice * shares_per_grid) {
        const cost = buyPrice * shares_per_grid;
        cash -= cost;
        shares += shares_per_grid;
        buyGridStatus[levelIdx] = true;

        trades.push({
          date,
          type: 'buy',
          price: buyPrice,
          market_price: price,
          shares: shares_per_grid,
          amount: cost,
          grid_level: levelIdx + 1
        });
      }
    }

    // 检查卖出信号
    if (shares >= shares_per_grid) {
      const boughtGrids = buyGridStatus
        .map((status, idx) => ({ status, idx, price: buyLevels[idx] }))
        .filter(item => item.status)
        .sort((a, b) => b.price - a.price);

      for (const { idx: buyIdx, price: correspondingBuyPrice } of boughtGrids) {
        let sold = false;
        for (let levelIdx = sellLevels.length - 1; levelIdx >= 0; levelIdx--) {
          const sellPrice = sellLevels[levelIdx];

          if (price >= sellPrice) {
            const minProfitThreshold = actualGridWidth * 0.1;
            if (sellPrice >= correspondingBuyPrice * (1 + minProfitThreshold)) {
              const revenue = sellPrice * shares_per_grid;
              cash += revenue;
              shares -= shares_per_grid;
              buyGridStatus[buyIdx] = false;

              trades.push({
                date,
                type: 'sell',
                price: sellPrice,
                market_price: price,
                shares: shares_per_grid,
                amount: revenue,
                grid_level: levelIdx + 1
              });
              sold = true;
              break;
            }
          }
        }
        if (sold) break;
      }
    }

    // 记录组合价值
    const portfolioValue = cash + shares * price;
    portfolioValues.push(portfolioValue);

    // 计算日收益率
    if (i > 0 && portfolioValues[i - 1] > 0) {
      const dailyReturn = (portfolioValue - portfolioValues[i - 1]) / portfolioValues[i - 1];
      dailyReturns.push(dailyReturn);
    }
  }

  // 最终价值
  const finalPrice = prices[prices.length - 1] || 0;
  const finalValue = cash + shares * finalPrice;

  // 计算策略指标
  const totalReturn = (finalValue - initial_capital) / initial_capital;

  // 年化收益率
  let annualizedReturn = 0;
  if (dates.length > 1) {
    const days = dates.length;
    const years = days / 252;
    if (years > 0) {
      annualizedReturn = Math.pow(1 + totalReturn, 1 / years) - 1;
    }
  }

  // 最大回撤
  let maxDrawdown = 0;
  let peak = portfolioValues[0] || initial_capital;
  for (const value of portfolioValues) {
    if (value > peak) peak = value;
    const drawdown = (peak - value) / peak;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  // 夏普比率
  let sharpeRatio = 0;
  if (dailyReturns.length > 1) {
    const meanReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / dailyReturns.length;
    const stdReturn = variance > 0 ? Math.sqrt(variance) : 0;

    if (stdReturn > 0) {
      const riskFreeRate = 0.03 / 252;
      const excessReturn = meanReturn - riskFreeRate;
      sharpeRatio = (excessReturn / stdReturn) * Math.sqrt(252);
    }
  }

  // 计算胜率
  let profitTrades = 0;
  let lossTrades = 0;
  const pendingBuys: Map<number, Trade> = new Map();
  const buySellPairs: [Trade, Trade][] = [];

  for (const trade of trades) {
    if (trade.type === 'buy') {
      pendingBuys.set(trade.grid_level, trade);
    } else if (trade.type === 'sell' && pendingBuys.has(trade.grid_level)) {
      const buyTrade = pendingBuys.get(trade.grid_level)!;
      pendingBuys.delete(trade.grid_level);
      buySellPairs.push([buyTrade, trade]);
    }
  }

  for (const [buyTrade, sellTrade] of buySellPairs) {
    const profit = (sellTrade.price - buyTrade.price) * sellTrade.shares;
    if (profit > 0) {
      profitTrades++;
    } else {
      lossTrades++;
    }
  }

  const totalTrades = profitTrades + lossTrades;
  const winRate = totalTrades > 0 ? profitTrades / totalTrades : 0;

  // 计算平均交易周期
  let avgTradeCycle = 0;
  if (trades.length > 1) {
    const tradeDates = trades
      .map(t => new Date(t.date))
      .sort((a, b) => a.getTime() - b.getTime());
    
    let totalDays = 0;
    for (let i = 1; i < tradeDates.length; i++) {
      const daysDiff = Math.floor((tradeDates[i].getTime() - tradeDates[i - 1].getTime()) / (1000 * 60 * 60 * 24));
      totalDays += daysDiff;
    }
    avgTradeCycle = totalDays / (trades.length - 1);
  }

  // 最终持仓状态
  const finalHoldingGrids = buyGridStatus.filter(status => status).length;

  const metrics: StrategyMetrics = {
    total_return: totalReturn,
    annualized_return: annualizedReturn,
    max_drawdown: maxDrawdown,
    sharpe_ratio: sharpeRatio,
    win_rate: winRate,
    total_trades: trades.length,
    profit_trades: profitTrades,
    loss_trades: lossTrades,
    final_value: finalValue,
    initial_value: initial_capital,
    avg_trade_cycle: avgTradeCycle,
    holding_value: shares * finalPrice,
    holding_shares: shares,
    holding_grids: finalHoldingGrids,
    available_cash: cash
  };

  // 生成买卖信号
  const buySignals: TradeSignal[] = [];
  const sellSignals: TradeSignal[] = [];

  for (const trade of trades) {
    const signal: TradeSignal = {
      time: trade.date,
      price: trade.market_price,
      shares: trade.shares,
      amount: trade.amount,
      grid_level: trade.grid_level
    };

    if (trade.type === 'buy') {
      buySignals.push(signal);
    } else {
      sellSignals.push(signal);
    }
  }

  // 转换交易记录格式
  const tradeRecords: TradeRecord[] = trades.map(t => ({
    date: t.date,
    type: t.type,
    price: t.price,
    shares: t.shares,
    amount: t.amount,
    grid_level: t.grid_level
  }));

  return {
    code: '',
    config: {
      initial_capital,
      grid_width: actualGridWidth,
      num_grids,
      shares_per_grid,
      use_volatility_adjustment
    },
    signals: {
      buy_signals: buySignals,
      sell_signals: sellSignals
    },
    metrics,
    trades: tradeRecords
  };
}

function createEmptyResult(initialCapital: number): StrategyResult {
  return {
    code: '',
    config: {
      initial_capital: initialCapital,
      grid_width: 0.03,
      num_grids: 15,
      shares_per_grid: 500,
      use_volatility_adjustment: true
    },
    signals: {
      buy_signals: [],
      sell_signals: []
    },
    metrics: {
      total_return: 0,
      annualized_return: 0,
      max_drawdown: 0,
      sharpe_ratio: 0,
      win_rate: 0,
      total_trades: 0,
      profit_trades: 0,
      loss_trades: 0,
      final_value: initialCapital,
      initial_value: initialCapital,
      avg_trade_cycle: 0
    },
    trades: []
  };
}