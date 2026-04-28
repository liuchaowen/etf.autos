import React from 'react';
import { LineChart } from '@/components/ui/chart';
import { ChartDataItem, FundItem } from '@/types';

// 时间范围选项
const TIME_RANGE_OPTIONS = [
    { label: '上市以来', value: 0 },
    { label: '近10年', value: 10 },
    { label: '近5年', value: 5 },
    { label: '近2年', value: 2 },
    { label: '近1年', value: 1 },
    { label: '近6个月', value: 0.5 },
    { label: '近3个月', value: 0.25 },
];

interface PriceChartProps {
    chartData: ChartDataItem[];
    selectedFund?: FundItem;
    selectedYears: number;
    onYearsChange: (years: number) => void;
    title?: string;
    showLegend?: boolean;
    height?: string;
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
}: PriceChartProps) {
    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-colors">
            {/* 标题和时间范围选择 */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {title || selectedFund?.abbr || '净值'}
                </h3>
                {/* 时间范围选择tab */}
                <div className="flex items-center gap-1 flex-wrap">
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
                <div style={{ height }}>
                    <LineChart
                        data={chartData}
                        showGrid={true}
                        showXAxis={true}
                        showYAxis={true}
                        lineWidth={1}
                        title={title || selectedFund?.abbr || '净值'}
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
                        <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                        净值走势
                    </span>
                </div>
            )}
        </div>
    );
}