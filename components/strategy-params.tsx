import React from 'react';
import { StrategyParams, StrategyResult } from '@/types';
import { SettingsIcon } from './icons';

interface StrategyParamsProps {
    params: StrategyParams;
    result: StrategyResult | null;
    onChange: (params: StrategyParams) => void;
}

/**
 * 策略参数配置组件
 */
export function StrategyParamsSection({ params, result, onChange }: StrategyParamsProps) {
    const handleChange = (key: keyof StrategyParams, value: number | boolean) => {
        onChange({ ...params, [key]: value });
    };

    return (
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-colors">
            <div className="flex items-center gap-2 mb-4">
                <SettingsIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">策略参数</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">初始资金</label>
                    <input
                        type="number"
                        value={params.initial_capital}
                        onChange={e => handleChange('initial_capital', Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                        网格宽度 ({result?.config ? (result.config.grid_width * 100).toFixed(1) : '0.0'}%)
                    </label>
                    <input
                        type="number"
                        step="0.1"
                        value={params.grid_width > 0 ? params.grid_width * 100 : ''}
                        onChange={e => handleChange('grid_width', Number((Number(e.target.value) / 100).toFixed(1)))}
                        placeholder="自动"
                        className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">网格层数</label>
                    <input
                        type="number"
                        min="1"
                        max="20"
                        value={params.num_grids}
                        onChange={e => handleChange('num_grids', Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">每格股数</label>
                    <input
                        type="number"
                        min="10"
                        step="100"
                        value={params.shares_per_grid}
                        onChange={e => handleChange('shares_per_grid', Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </div>
            </div>
        </section>
    );
}