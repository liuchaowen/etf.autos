import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { Header } from '@/components/header';
import { ChartIcon } from '@/components/icons';
import { StrategyParamsSection } from '@/components/strategy-params';
import { StrategyMetricsSection } from '@/components/strategy-metrics';
import { TradeTable } from '@/components/trade-table';
import { ChartSection } from '@/components/chart-section';
import { FooterDisclaimer } from '@/components/footer-disclaimer';
import { FundSearch } from '@/components/FundSearch';
import { fetchGridStrategy, fetchFundHistory, ETF_LIST } from '@/lib/api';
import { StrategyResult, StrategyParams, HistoryItem, ChartDataItem, TradeSignal, FundItem } from '@/types';

// localStorage 缓存键名
const STRATEGY_PARAMS_CACHE_KEY = 'strategy_params_cache';
const STRATEGY_CODE_CACHE_KEY = 'strategy_code_cache';

// 默认策略参数
const DEFAULT_STRATEGY_PARAMS: StrategyParams = {
    initial_capital: 50000,
    grid_width: 0.025,
    num_grids: 20,
    grid_investment_percent: 10,  // 默认每格投资5%的资金
    use_volatility_adjustment: true,
};

// 从 localStorage 读取缓存的参数
function loadCachedParams(): StrategyParams {
    if (typeof window === 'undefined') return DEFAULT_STRATEGY_PARAMS;

    try {
        const cached = localStorage.getItem(STRATEGY_PARAMS_CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached) as StrategyParams;
            // 验证缓存数据是否有效
            if (
                typeof parsed.initial_capital === 'number' &&
                typeof parsed.grid_width === 'number' &&
                typeof parsed.num_grids === 'number' &&
                typeof parsed.grid_investment_percent === 'number' &&
                typeof parsed.use_volatility_adjustment === 'boolean'
            ) {
                return parsed;
            }
        }
    } catch {
        // 解析失败，使用默认值
    }
    return DEFAULT_STRATEGY_PARAMS;
}

// 从 localStorage 读取缓存的ETF代码
function loadCachedCode(): string {
    if (typeof window === 'undefined') return '588000';

    try {
        const cached = localStorage.getItem(STRATEGY_CODE_CACHE_KEY);
        if (cached) {
            // 验证缓存数据是否有效
            if (ETF_LIST.some(item => item.fund_code === cached)) {
                return cached;
            }
        }
    } catch {
        // 读取失败，使用默认值
    }
    return '588000';
}

export default function GridStrategyPage() {
    const [selectedCode, setSelectedCode] = useState<string>('588000');
    const [selectedFund, setSelectedFund] = useState<FundItem | undefined>(undefined);
    const [strategyResult, setStrategyResult] = useState<StrategyResult | null>(null);
    const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedYears, setSelectedYears] = useState<number>(2);
    const [initialized, setInitialized] = useState(false);

    // 策略参数 - 从缓存加载
    const [strategyParams, setStrategyParams] = useState<StrategyParams>(loadCachedParams);

    // 初始化：从缓存读取ETF代码
    useEffect(() => {
        if (!initialized) {
            const cachedCode = loadCachedCode();
            setSelectedCode(cachedCode);
            // 如果缓存的代码在 ETF_LIST 中，设置对应的基金信息
            const fund = ETF_LIST.find(item => item.fund_code === cachedCode);
            if (fund) {
                setSelectedFund(fund);
            }
            setInitialized(true);
        }
    }, [initialized]);

    // 当选择ETF时，保存到缓存
    const handleFundSelect = useCallback((fund: FundItem) => {
        setSelectedCode(fund.fund_code);
        setSelectedFund(fund);
        // 保存到 localStorage
        try {
            localStorage.setItem(STRATEGY_CODE_CACHE_KEY, fund.fund_code);
        } catch {
            // 保存失败时忽略
        }
    }, []);

    // 加载策略数据（异步获取）
    const loadStrategyData = useCallback(async (code: string, years: number = 0) => {
        if (!code) return;
        setLoading(true);
        setError(null);
        try {
            // 获取历史数据用于图表
            const histData = await fetchFundHistory(code, 0, years);
            setHistoryData(histData);

            // 计算策略结果（根据选定的时间周期进行回测）
            const params = {
                ...strategyParams,
                grid_width: strategyParams.grid_width > 0 ? strategyParams.grid_width : undefined,
            };
            const result = await fetchGridStrategy(code, params, years);
            setStrategyResult(result);
        } catch (err: any) {
            setError(err.message || '数据获取失败');
        } finally {
            setLoading(false);
        }
    }, [strategyParams]);

    useEffect(() => {
        if (initialized && selectedCode) {
            loadStrategyData(selectedCode, selectedYears);
        }
    }, [selectedCode, selectedYears, loadStrategyData, initialized]);

    // 当参数变化时，保存到 localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STRATEGY_PARAMS_CACHE_KEY, JSON.stringify(strategyParams));
        } catch {
            // 保存失败时忽略
        }
    }, [strategyParams]);

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

    return (
        <>
            <Head>
                <title>策略 — ETF</title>
                <meta name="description" content="网格交易策略回测工具，自动计算网格宽度，生成买卖信号，计算收益率、回撤率、夏普值等指标" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </Head>

            <div className="min-h-screen bg-white dark:bg-gray-900 font-airbnb transition-colors">
                {/* 顶部导航栏 */}
                <Header
                    activePage="backtest"
                    rightContent={
                        <div className="flex items-center gap-3">
                            <FundSearch
                                onSelect={handleFundSelect}
                                placeholder="搜索基金..."
                            />
                        </div>
                    }
                />

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
                            <FooterDisclaimer />
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