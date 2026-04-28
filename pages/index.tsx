import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { ThemeToggle } from '@/components/theme-toggle';
import { ChartIcon, ChevronDownIcon } from '@/components/icons';
import { StrategyParamsSection } from '@/components/strategy-params';
import { StrategyMetricsSection } from '@/components/strategy-metrics';
import { TradeTable } from '@/components/trade-table';
import { ChartSection } from '@/components/chart-section';
import { fetchGridStrategy, fetchFundHistory, ETF_LIST } from '@/lib/api';
import { StrategyResult, StrategyParams, HistoryItem, ChartDataItem, TradeSignal, FundItem } from '@/types';

export default function GridStrategyPage() {
  const [selectedCode, setSelectedCode] = useState<string>('588000');
  const [strategyResult, setStrategyResult] = useState<StrategyResult | null>(null);
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedYears, setSelectedYears] = useState<number>(1);

  // 策略参数
  const [strategyParams, setStrategyParams] = useState<StrategyParams>({
    initial_capital: 10000,
    grid_width: 0,
    num_grids: 15,
    shares_per_grid: 500,
    use_volatility_adjustment: true,
  });

  // 加载策略数据（同步计算）
  const loadStrategyData = useCallback((code: string, years: number = 0) => {
    if (!code) return;
    setLoading(true);
    setError(null);
    try {
      // 获取历史数据用于图表
      const histData = fetchFundHistory(code, 0, years);
      setHistoryData(histData);

      // 计算策略结果
      const params = {
        ...strategyParams,
        grid_width: strategyParams.grid_width > 0 ? strategyParams.grid_width : undefined,
      };
      const result = fetchGridStrategy(code, params);
      setStrategyResult(result);
    } catch (err: any) {
      setError(err.message || '数据获取失败');
    } finally {
      setLoading(false);
    }
  }, [strategyParams]);

  useEffect(() => {
    if (selectedCode) {
      loadStrategyData(selectedCode, selectedYears);
    }
  }, [selectedCode, selectedYears, loadStrategyData]);

  // 为图表准备数据
  const chartData = useMemo((): ChartDataItem[] => {
    if (!historyData || historyData.length === 0) return [];

    const sortedData = [...historyData].sort((a, b) => a.x - b.x);

    return sortedData.map(item => {
      const date = new Date(item.x);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const time = `${year}-${month}-${day}`;

      return {
        time: time,
        value: item.y,
      };
    });
  }, [historyData]);

  // 买卖信号
  const buySignals = useMemo((): TradeSignal[] => {
    if (!strategyResult?.signals?.buy_signals) return [];
    const signals = strategyResult.signals.buy_signals;
    // 过滤掉最早时间点的买入信号
    if (signals.length === 0) return [];
    const sortedSignals = [...signals].sort((a, b) => a.time.localeCompare(b.time));
    const earliestTime = sortedSignals[0].time;
    return signals.filter(signal => signal.time !== earliestTime);
  }, [strategyResult]);

  const sellSignals = useMemo((): TradeSignal[] => {
    if (!strategyResult?.signals?.sell_signals) return [];
    return strategyResult.signals.sell_signals;
  }, [strategyResult]);

  const selectedFund = useMemo<FundItem | undefined>(
    () => ETF_LIST.find(item => item.fund_code === selectedCode),
    [selectedCode]
  );

  return (
    <>
      <Head>
        <title>网格交易策略 — 回测分析</title>
        <meta name="description" content="网格交易策略回测工具，自动计算网格宽度，生成买卖信号，计算收益率、回撤率、夏普值等指标" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-airbnb transition-colors">
        {/* 顶部导航栏 */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors">
          <div className="mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* 左侧：标题 */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 flex items-center justify-center">
                  <ChartIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </div>
                <div>
                  <h1 className="text-sm font-medium text-gray-900 dark:text-white">网格交易策略</h1>
                </div>
              </div>

              {/* 右侧：ETF选择和主题切换 */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={selectedCode}
                    onChange={e => setSelectedCode(e.target.value)}
                    className="appearance-none bg-gray-900 text-white px-3 py-1.5 pr-8 text-xs cursor-pointer focus:outline-none min-w-[140px]"
                  >
                    {ETF_LIST.map(etf => (
                      <option key={etf.fund_code} value={etf.fund_code}>
                        {etf.abbr} ({etf.fund_code})
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="absolute w-4 h-4 right-2 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* 主内容区 */}
        <main className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {error && (
            <div className="mb-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 text-xs rounded">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-2 border-gray-200 dark:border-gray-700 border-t-blue-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">正在计算策略...</p>
              </div>
            </div>
          ) : strategyResult ? (
            <div className="space-y-6">
              {/* 策略参数配置 */}
              <StrategyParamsSection
                params={strategyParams}
                result={strategyResult}
                onChange={setStrategyParams}
              />

              {/* 两栏布局：图表 + 指标 */}
              <div className="flex flex-col xl:flex-row gap-6">
                {/* 左侧：走势图 */}
                <div className="w-full xl:w-1/2">
                  <ChartSection
                    chartData={chartData}
                    buySignals={buySignals}
                    sellSignals={sellSignals}
                    selectedFund={selectedFund}
                    selectedYears={selectedYears}
                    onYearsChange={setSelectedYears}
                  />
                </div>

                {/* 右侧：策略指标 */}
                <div className="w-full xl:w-1/2">
                  <StrategyMetricsSection result={strategyResult} />
                </div>
              </div>

              {/* 交易记录列表 */}
              <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-colors">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">交易记录</h3>
                <TradeTable trades={strategyResult.trades} />
              </section>

              {/* 数据来源说明 */}
              <div className="text-center text-xs text-gray-400 dark:text-gray-500 pt-4">
                数据来源：本地JSON数据 · 策略回测仅供学习研究，不构成投资建议
              </div>
            </div>
          ) : (
            <div className="text-center py-32">
              <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <ChartIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">请选择ETF开始策略回测</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}