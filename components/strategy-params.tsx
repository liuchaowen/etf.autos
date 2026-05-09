import React from 'react';
import { StrategyParams, StrategyResult } from '@/types';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StrategyParamsProps {
    params: StrategyParams;
    result: StrategyResult | null;
    onChange: (params: StrategyParams) => void;
    onSave?: () => void;
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
        min: 4,
        max: 14,
        step: 1,
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
export function StrategyParamsSection({ params, result, onChange, onSave }: StrategyParamsProps) {
    const { toast } = useToast();

    const handleChange = (key: keyof StrategyParams, value: number | boolean) => {
        onChange({ ...params, [key]: value });
    };

    const handleSliderChange = (key: keyof StrategyParams, config: typeof SLIDER_CONFIG.initial_capital, index: number) => {
        const value = config.min + index * config.step;
        handleChange(key, value);
    };

    // 保存参数到本地缓存
    const handleSave = () => {
        if (onSave) {
            onSave();
            toast({
                title: '保存成功!',
                description: '策略参数已保存到本地',
            });
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
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">网格参数</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium hover:text-white text-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 rounded transition-colors"
                        title="保存到本地,不同周期保存一份参数。"
                    >
                        <Save className="w-4 h-4" />
                    </button>
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