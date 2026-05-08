import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { ETF_LIST } from '@/lib/api';
import { getFavorites, toggleFavorite, isFavorite, FAVORITES_CHANGE_EVENT } from '@/lib/favorites';
import { FundItem } from '@/types';

interface ETFListPanelProps {
    selectedCode: string;
    onSelectCode: (fund: FundItem) => void;
}

/**
 * ETF标的列表面板
 * 包含热门ETF列表和用户收藏ETF列表
 */
export function ETFListPanel({ selectedCode, onSelectCode }: ETFListPanelProps) {
    const [favorites, setFavorites] = useState<FundItem[]>([]);
    const [activeTab, setActiveTab] = useState<'hot' | 'favorites'>('hot');

    // 加载收藏列表
    useEffect(() => {
        setFavorites(getFavorites());
    }, []);

    // 监听收藏变化（包括同一页面内的变化）
    useEffect(() => {
        const handleFavoritesChange = (e: CustomEvent<{ favorites: FundItem[] }>) => {
            setFavorites(e.detail.favorites);
        };

        // 监听自定义事件（同一页面内的变化）
        window.addEventListener(FAVORITES_CHANGE_EVENT, handleFavoritesChange as EventListener);
        // 监听 storage 事件（其他标签页的变化）
        const handleStorageChange = () => {
            setFavorites(getFavorites());
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener(FAVORITES_CHANGE_EVENT, handleFavoritesChange as EventListener);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // 处理收藏切换
    const handleToggleFavorite = (e: React.MouseEvent, fund: FundItem) => {
        e.stopPropagation(); // 阻止事件冒泡，避免触发选择
        const newFavorites = toggleFavorite(fund);
        setFavorites(newFavorites);
    };

    // 检查是否收藏
    const checkIsFavorite = (fundCode: string) => {
        return favorites.some(item => item.fund_code === fundCode);
    };

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden h-full flex flex-col">
            {/* 标签页切换 */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('hot')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'hot'
                        ? 'text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-gray-900/20 border-b-2 border-gray-600 dark:border-gray-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    热门ETF
                </button>
                <button
                    onClick={() => setActiveTab('favorites')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'favorites'
                        ? 'text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-gray-900/20 border-b-2 border-gray-600 dark:border-gray-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    我的收藏
                    {favorites.length > 0 && (
                        <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded-full">
                            {favorites.length}
                        </span>
                    )}
                </button>
            </div>

            {/* 列表内容 */}
            <div className="flex-1 overflow-y-auto scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {activeTab === 'hot' ? (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {ETF_LIST.map((fund) => (
                            <div
                                key={fund.fund_code}
                                onClick={() => onSelectCode(fund)}
                                className={`px-4 py-3 cursor-pointer transition-colors ${selectedCode === fund.fund_code
                                    ? 'bg-blue-50 dark:bg-blue-900/20'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                                                {fund.fund_code}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate mt-0.5">
                                            {fund.name}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                            {fund.type}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => handleToggleFavorite(e, fund)}
                                        className="ml-2 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                        title={checkIsFavorite(fund.fund_code) ? '取消收藏' : '添加收藏'}
                                    >
                                        <Star
                                            className={`w-4 h-4 transition-colors ${checkIsFavorite(fund.fund_code)
                                                ? 'text-yellow-400 fill-yellow-400'
                                                : 'text-gray-300 dark:text-gray-500'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {favorites.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                                <Star className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">暂无收藏</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    点击热门ETF列表中的星标添加收藏
                                </p>
                            </div>
                        ) : (
                            favorites.map((fund) => (
                                <div
                                    key={fund.fund_code}
                                    onClick={() => onSelectCode(fund)}
                                    className={`px-4 py-3 cursor-pointer transition-colors ${selectedCode === fund.fund_code
                                        ? 'bg-blue-50 dark:bg-blue-900/20'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                                                    {fund.fund_code}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate mt-0.5">
                                                {fund.name}
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                                {fund.type}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => handleToggleFavorite(e, fund)}
                                            className="ml-2 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                            title="取消收藏"
                                        >
                                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}