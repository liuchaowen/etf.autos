import React, { useState, useEffect } from 'react';
import { LineChart } from '@/components/ui/chart';
import { Star } from 'lucide-react';
import { isFavorite as checkIsFavorite, toggleFavorite } from '@/lib/favorites';
import { ChartDataItem, FundItem } from '@/types';

// 默认时间范围选项
const DEFAULT_TIME_RANGE_OPTIONS = [
    { label: '上市以来', value: 0 },
    { label: '近10年', value: 10 },
    { label: '近5年', value: 5 },
    { label: '近2年', value: 2 },
    { label: '近1年', value: 1 },
    { label: '近6个月', value: 0.5 },
];

interface TimeRangeOption {
    label: string;
    value: number;
}

interface PriceChartProps {
    chartData: ChartDataItem[];
    selectedFund?: FundItem;
    selectedYears: number;
    onYearsChange: (years: number) => void;
    title?: string;
    showLegend?: boolean;
    height?: string;
    timeRangeOptions?: TimeRangeOption[];
}

/**
 * 通用价格走势图组件
 * 可用于估值页面和策略页面
 */
export function PriceChart({
    chartData,
    selectedFund,
    selectedYears,
    onYearsChange,
    title,
    showLegend = false,
    height = '400px',
    timeRangeOptions,
}: PriceChartProps) {
    const options = timeRangeOptions || DEFAULT_TIME_RANGE_OPTIONS;
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
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-colors">
            {/* 标题和时间范围选择 */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {title || selectedFund?.name || '净值'}
                    </h3>
                    {selectedFund && (
                        <button
                            onClick={handleFavoriteClick}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title={isFav ? '取消收藏' : '添加收藏'}
                        >
                            {isFav ? (
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            ) : (
                                <Star className="w-4 h-4 text-gray-400 hover:text-yellow-500" />
                            )}
                        </button>
                    )}
                </div>
                {/* 时间范围选择tab */}
                <div className="flex items-center gap-1 flex-wrap">
                    {options.map((option) => (
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
                <div style={{ height }}>
                    <LineChart
                        data={chartData}
                        showGrid={true}
                        showXAxis={true}
                        showYAxis={true}
                        lineWidth={1}
                        title={title || selectedFund?.name || '净值'}
                        className="h-full"
                    />
                </div>
            ) : (
                <div style={{ height }} className="flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs">
                    暂无历史数据
                </div>
            )}

            {showLegend && (
                <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-gray-900 rounded-full"></span>
                        净值走势
                    </span>
                </div>
            )}
        </div>
    );
}