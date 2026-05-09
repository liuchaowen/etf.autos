import React from 'react';
import { StrategyResult, TradeRecord } from '@/types';
import { formatPercent, formatCurrency } from '@/lib/api';
import { CircleHelp } from 'lucide-react';

interface StrategyMetricsProps {
    result: StrategyResult;
}

/**
 * 计算持仓信息
 */
function calculateHolding(trades: TradeRecord[]) {
    const buyTrades = trades.filter(t => t.type === 'buy');
    const sellTrades = trades.filter(t => t.type === 'sell');
    const holdingShares = buyTrades.reduce((sum, t) => sum + t.shares, 0) - sellTrades.reduce((sum, t) => sum + t.shares, 0);
    const holdingOrders = buyTrades.length - sellTrades.length;
    return { holdingShares, holdingOrders };
}

/**
 * 计算月平均交易次数
 */
function calculateMonthlyTrades(trades: TradeRecord[]): number {
    if (trades.length === 0) return 0;

    // 获取所有交易日期
    const dates = trades.map(t => new Date(t.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);

    // 计算时间跨度（毫秒转换为月）
    const diffTime = Math.abs(maxDate - minDate);
    const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44); // 平均每月天数

    // 如果时间跨度小于1个月，返回总交易次数
    if (diffMonths < 1) {
        return trades.length;
    }

    // 卖出交易次数
    const sellTrades = trades.filter(t => t.type === 'sell');
    return sellTrades.length / diffMonths;
}

/**
 * 策略指标组件
 */
export function StrategyMetricsSection({ result }: StrategyMetricsProps) {
    const { holdingShares, holdingOrders } = calculateHolding(result.trades);
    const monthlyTrades = calculateMonthlyTrades(result.trades);
    const sellTrades = result.trades.filter(t => t.type === 'sell').length;
    const { metrics } = result;

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 xl:h-full xl:flex xl:flex-col transition-colors">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">策略指标</h3>

            {/* 核心指标 */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-900 dark:bg-gray-700 rounded-lg p-4 text-white">
                    <span className="text-xs text-gray-400 block mb-1">总收益率</span>
                    <p className={`text-2xl font-medium ${metrics.total_return >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {formatPercent(metrics.total_return)}
                    </p>
                </div>
                <div className="bg-gray-900 dark:bg-gray-700 rounded-lg p-4 text-white">
                    <span className="text-xs text-gray-400 block mb-1">年化收益率</span>
                    <p className={`text-2xl font-medium ${metrics.annualized_return >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {formatPercent(metrics.annualized_return)}
                    </p>
                </div>
            </div>

            {/* 详细指标 */}
            <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="border border-gray-200 dark:border-gray-600 rounded p-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">最大回撤</span>
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">
                        {formatPercent(metrics.max_drawdown)}
                    </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-600 rounded p-3">
                    <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">夏普比率</span>
                        <div className="relative group">
                            <CircleHelp className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 cursor-help" />
                            <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-64">
                                <div className="font-medium mb-1">夏普比率（Sharpe Ratio）</div>
                                <div className="text-gray-500 dark:text-gray-400 space-y-1">
                                    <p>衡量单位风险所获得的超额回报。</p>
                                    <p className="font-medium text-gray-700 dark:text-gray-300">评判标准：</p>
                                    <p>• &lt;1：一般，回报与风险不成比例</p>
                                    <p>• 1-2：良好，投资性价比合理</p>
                                    <p>• &gt;2：非常优秀，在合理风险下获取了极高收益</p>
                                    <p className="font-medium text-gray-700 dark:text-gray-300 mt-1">详细分析：</p>
                                    <p>长期稳定的夏普比率大于2.0被认为是非常值得投资的优秀标的。</p>
                                    <p className="text-gray-400 dark:text-gray-500 mt-1">注：夏普比率基于过去数据，在市场极端行情下可能失效。</p>
                                </div>
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-white dark:bg-gray-700 border-r border-b border-gray-200 dark:border-gray-600"></div>
                            </div>
                        </div>
                    </div>
                    <p className={`text-sm font-medium ${metrics.sharpe_ratio >= 2 ? 'text-red-600 dark:text-red-400' : metrics.sharpe_ratio >= 1 ? 'text-pink-500 dark:text-pink-400' : metrics.sharpe_ratio >= 0 ? 'text-gray-700 dark:text-gray-300' : 'text-green-600 dark:text-green-400'}`}>
                        {metrics.sharpe_ratio.toFixed(2)}
                    </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-600 rounded p-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">交易单数</span>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {sellTrades} 单
                    </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-600 rounded p-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">盈亏</span>
                    <p className={`text-sm font-medium ${metrics.final_value - metrics.initial_value >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {formatCurrency(metrics.final_value - metrics.initial_value)}
                    </p>
                </div>
            </div>

            {/* 交易统计 */}
            <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="border border-gray-200 dark:border-gray-600 rounded p-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">总交易次数</span>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{metrics.total_trades}</p>
                </div>
                <div className="border border-gray-200 dark:border-gray-600 rounded p-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">月平均交易次数</span>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {monthlyTrades.toFixed(1)} 次
                    </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-600 rounded p-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">月平均持仓资金占比</span>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {metrics.avg_holding_ratio !== undefined
                            ? formatPercent(metrics.avg_holding_ratio)
                            : '-'}
                    </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-600 rounded p-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">平均交易周期</span>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {metrics.avg_trade_cycle !== undefined && metrics.avg_trade_cycle !== null && metrics.total_trades > 1
                            ? metrics.avg_trade_cycle.toFixed(1) + ' 天'
                            : '-'}
                    </p>
                </div>
            </div>

            {/* 持仓情况 */}
            <div className="grid grid-cols-4 gap-3">
                <div className="border border-gray-200 dark:border-gray-600 rounded p-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">持仓股数</span>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {holdingShares}
                    </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-600 rounded p-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">持仓单数</span>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {holdingOrders} 单
                    </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-600 rounded p-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">初始资金</span>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(metrics.initial_value)}</p>
                </div>
                <div className="border border-gray-200 dark:border-gray-600 rounded p-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">最终价值</span>
                    <p className={`text-sm font-medium ${metrics.final_value >= metrics.initial_value ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {formatCurrency(metrics.final_value)}
                    </p>
                </div>
            </div>
        </div>
    );
}