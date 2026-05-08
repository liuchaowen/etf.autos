import React, { useState, useEffect } from 'react';
import { LineChart } from '@/components/ui/chart';
import { Star, Activity } from 'lucide-react';
import { isFavorite as checkIsFavorite, toggleFavorite } from '@/lib/favorites';
import { TradeSignal, ChartDataItem, FundItem } from '@/types';
import Link from 'next/link';

// 时间范围选项
const TIME_RANGE_OPTIONS = [
    { label: '上市以来', value: 0 },
    { label: '近10年', value: 10 },
    { label: '近5年', value: 5 },
    { label: '近2年', value: 2 },
    { label: '近1年', value: 1 },
    { label: '近6个月', value: 0.5 },
];

interface ChartSectionProps {
    chartData: ChartDataItem[];
    buySignals: TradeSignal[];
    sellSignals: TradeSignal[];
    selectedFund: FundItem | undefined;
    selectedYears: number;
    onYearsChange: (years: number) => void;
}

/**
 * 图表区域组件
 */
export function ChartSection({
    chartData,
    buySignals,
    sellSignals,
    selectedFund,
    selectedYears,
    onYearsChange,
}: ChartSectionProps) {
    const [isFav, setIsFav] = useState(false);

    // 当选中基金变化时，检查收藏状态
    useEffect(() => {
        if (selectedFund) {
            setIsFav(checkIsFavorite(selectedFund.fund_code));
        }
    }, [selectedFund]);

    // 处理收藏点击
    const handleFavoriteClick = () => {
        if (selectedFund) {
            toggleFavorite(selectedFund);
            setIsFav(!isFav);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 xl:h-full xl:flex xl:flex-col transition-colors">
            {/* 标题和时间范围选择 */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedFund?.name || '净值'}
                    </h3>
                    {selectedFund && (
                        <button
                            onClick={handleFavoriteClick}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                            title={isFav ? '取消收藏' : '添加收藏'}
                        >
                            {isFav ? (
                                <Star className="w-4 h-4 text-gray-400 fill-gray-400" />
                            ) : (
                                <Star className="w-4 h-4 text-gray-400 dark:text-gray-400 hover:text-gray-400" />
                            )}
                        </button>
                    )}
                    {selectedFund && (
                        <Link
                            href={`/?code=${selectedFund.fund_code}`}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-500 rounded transition-colors"
                            title="查看估值分析"
                        >
                            <Activity className="w-4 h-4 text-gray-900 dark:text-gray-400 hover:text-gray-500" />
                        </Link>
                    )}
                </div>
                {/* 时间范围选择tab */}
                <div className="flex items-center gap-1">
                    {TIME_RANGE_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => onYearsChange(option.value)}
                            className={`px-2 py-1 text-xs rounded transition-colors ${selectedYears === option.value
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {chartData.length > 0 ? (
                <div className="h-[400px] xl:flex-1">
                    <LineChart
                        data={chartData}
                        showGrid={true}
                        showXAxis={true}
                        showYAxis={true}
                        lineWidth={1}
                        title={selectedFund?.name || '净值'}
                        buySignals={buySignals}
                        sellSignals={sellSignals}
                        className="h-full"
                    />
                </div>
            ) : (
                <div className="h-[400px] xl:flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs">
                    暂无历史数据
                </div>
            )}

            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    买入
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    卖出
                </span>
            </div>
        </div>
    );
}