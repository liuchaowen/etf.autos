import React from 'react';
import { StrategyResult, TradeRecord } from '@/types';
import { formatPercent, formatCurrency } from '@/lib/api';

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
 * 策略指标组件
 */
export function StrategyMetricsSection({ result }: StrategyMetricsProps) {
    const { holdingShares, holdingOrders } = calculateHolding(result.trades);
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
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="border border-gray-200 dark:border-gray-600 rounded p-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">最大回撤</span>
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">
                        {formatPercent(metrics.max_drawdown)}
                    </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-600 rounded p-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">夏普比率</span>
                    <p className={`text-sm font-medium ${metrics.sharpe_ratio >= 1 ? 'text-green-600 dark:text-green-400' : metrics.sharpe_ratio >= 0 ? 'text-gray-700 dark:text-gray-300' : 'text-red-600 dark:text-red-400'}`}>
                        {metrics.sharpe_ratio.toFixed(2)}
                    </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-600 rounded p-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">胜率</span>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatPercent(metrics.win_rate)}
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
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">盈利次数</span>
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">{metrics.profit_trades}</p>
                </div>
                <div className="border border-gray-200 dark:border-gray-600 rounded p-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">亏损次数</span>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">{metrics.loss_trades}</p>
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