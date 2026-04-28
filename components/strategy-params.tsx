import React, { useRef } from 'react';
import { StrategyParams, StrategyResult } from '@/types';
import { SettingsIcon } from './icons';

interface StrategyParamsProps {
    params: StrategyParams;
    result: StrategyResult | null;
    onChange: (params: StrategyParams) => void;
}

// 滑杆配置：定义每个参数的范围和10个均分点
const SLIDER_CONFIG = {
    initial_capital: {
        min: 10000,
        max: 100000,
        step: 10000,
        label: '初始资金',
        format: (v: number) => `${(v / 10000).toFixed(0)}万`,
    },
    grid_width: {
        min: 0,  // 1%
        max: 0.05,  // 5%
        step: 0.005,
        label: '网格宽度',
        format: (v: number) => `${(v * 100).toFixed(1)}%`,
    },
    num_grids: {
        min: 6,
        max: 26,
        step: 2,
        label: '网格层数',
        format: (v: number) => `${v}层`,
    },
    grid_investment_percent: {
        min: 0,     // 1%
        max: 10,    // 10%
        step: 1,
        label: '每格资金占比',
        format: (v: number) => `${v}%`,
    },
};

/**
 * 找到最接近的滑杆刻度值
 */
function findClosestStep(value: number, min: number, max: number, step: number): number {
    const steps = Math.round((value - min) / step);
    return min + steps * step;
}

/**
 * 计算滑杆的位置百分比
 */
function getSliderPercent(value: number, min: number, max: number): number {
    return ((value - min) / (max - min)) * 100;
}

/**
 * 策略参数配置组件
 */
export function StrategyParamsSection({ params, result, onChange }: StrategyParamsProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (key: keyof StrategyParams, value: number | boolean) => {
        onChange({ ...params, [key]: value });
    };

    const handleSliderChange = (key: keyof StrategyParams, config: typeof SLIDER_CONFIG.initial_capital, index: number) => {
        const value = config.min + index * config.step;
        handleChange(key, value);
    };

    // 导出参数为 JSON 文件
    const handleExport = () => {
        const data = JSON.stringify(params, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `strategy-params-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // 导入参数 JSON 文件
    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedParams = JSON.parse(e.target?.result as string) as StrategyParams;
                // 验证导入的参数是否有效
                if (
                    typeof importedParams.initial_capital === 'number' &&
                    typeof importedParams.grid_width === 'number' &&
                    typeof importedParams.num_grids === 'number' &&
                    typeof importedParams.grid_investment_percent === 'number' &&
                    typeof importedParams.use_volatility_adjustment === 'boolean'
                ) {
                    onChange(importedParams);
                } else {
                    alert('导入的参数格式不正确');
                }
            } catch {
                alert('导入失败，请检查文件格式');
            }
        };
        reader.readAsText(file);
        // 重置 input 以便可以再次选择同一文件
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const renderSlider = (
        key: keyof StrategyParams,
        config: typeof SLIDER_CONFIG.initial_capital
    ) => {
        const value = params[key] as number;
        const currentIndex = Math.round((value - config.min) / config.step);
        const percent = getSliderPercent(value, config.min, config.max);

        return (
            <div key={key} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                    <label className="text-xs text-gray-500 dark:text-gray-400">{config.label}</label>
                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                        {config.format(value)}
                    </span>
                </div>
                <div className="relative">
                    <input
                        type="range"
                        min={config.min}
                        max={config.max}
                        step={config.step}
                        value={value}
                        onChange={e => handleChange(key, Number(e.target.value))}
                        className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer slider-thumb"
                        style={{
                            background: `linear-gradient(to right, #374151 0%, #374151 ${percent}%, #e5e7eb ${percent}%, #e5e7eb 100%)`
                        }}
                    />
                    {/* 10个刻度点标记 */}
                    <div className="flex justify-between mt-1.5 px-0.5">
                        {Array.from({ length: 10 }, (_, i) => {
                            const stepValue = config.min + i * config.step;
                            const isActive = i <= currentIndex;
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => handleSliderChange(key, config, i)}
                                    className={`w-1 h-1 rounded-full transition-colors ${isActive
                                        ? 'bg-gray-700 dark:bg-gray-300'
                                        : 'bg-gray-300 dark:bg-gray-600'
                                        } hover:scale-150`}
                                    title={config.format(stepValue)}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-colors">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <SettingsIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">策略参数</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExport}
                        className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                        title="导出参数"
                    >
                        导出
                    </button>
                    <label className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded cursor-pointer transition-colors" title="导入参数">
                        导入
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            className="hidden"
                        />
                    </label>
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {renderSlider('initial_capital', SLIDER_CONFIG.initial_capital)}
                {renderSlider('grid_width', SLIDER_CONFIG.grid_width)}
                {renderSlider('num_grids', SLIDER_CONFIG.num_grids)}
                {renderSlider('grid_investment_percent', SLIDER_CONFIG.grid_investment_percent)}
            </div>
        </section>
    );
}