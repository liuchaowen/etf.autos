import React, { useState, useMemo } from 'react';
import { TradeRecord } from '@/types';
import { formatCurrency } from '@/lib/api';

const PAGE_SIZE = 10;

interface TradeTableProps {
    trades: TradeRecord[];
}

/**
 * 交易记录表格组件
 */
export function TradeTable({ trades }: TradeTableProps) {
    const [currentPage, setCurrentPage] = useState(1);

    // 按日期倒序排列
    const sortedTrades = useMemo(() => {
        return [...trades].sort((a, b) => b.date.localeCompare(a.date));
    }, [trades]);

    // 计算总页数
    const totalPages = Math.ceil(sortedTrades.length / PAGE_SIZE);

    // 获取当前页的数据
    const paginatedTrades = useMemo(() => {
        const startIndex = (currentPage - 1) * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        return sortedTrades.slice(startIndex, endIndex);
    }, [sortedTrades, currentPage]);

    // 计算当前页数据的起始序号
    const startIndex = (currentPage - 1) * PAGE_SIZE;

    // 上一页
    const handlePrevPage = () => {
        setCurrentPage(prev => Math.max(1, prev - 1));
    };

    // 下一页
    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(totalPages, prev + 1));
    };

    if (trades.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-xs">
                在当前参数下未产生交易记录
            </div>
        );
    }

    return (
        <div>
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">序号</th>
                            <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">日期</th>
                            <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">类型</th>
                            <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">价格</th>
                            <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">股数</th>
                            <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">金额</th>
                            <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">网格层</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedTrades.map((trade, index) => (
                            <tr key={startIndex + index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="py-2 px-3 text-gray-900 dark:text-white">{sortedTrades.length - (startIndex + index)}</td>
                                <td className="py-2 px-3 text-gray-900 dark:text-white">{trade.date}</td>
                                <td className="py-2 px-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${trade.type === 'buy' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'}`}>
                                        {trade.type === 'buy' ? '买入' : '卖出'}
                                    </span>
                                </td>
                                <td className="py-2 px-3 text-gray-900 dark:text-white">{trade.price.toFixed(4)}</td>
                                <td className="py-2 px-3 text-gray-900 dark:text-white">{trade.shares}</td>
                                <td className="py-2 px-3 text-gray-900 dark:text-white">{formatCurrency(trade.amount)}</td>
                                <td className="py-2 px-3 text-gray-900 dark:text-white">第{trade.grid_level}格</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 分页控制 */}
            <div className="flex items-center justify-between mt-4 px-3">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                    共 {sortedTrades.length} 条记录，第 {currentPage}/{totalPages} 页
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        上一页
                    </button>
                    <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        下一页
                    </button>
                </div>
            </div>
        </div>
    );
}