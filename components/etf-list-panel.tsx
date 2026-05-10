import React, { useState, useEffect, useRef } from 'react';
import { Star, GripVertical } from 'lucide-react';
import { ETF_LIST } from '@/lib/api';
import { getFavorites, toggleFavorite, isFavorite, FAVORITES_CHANGE_EVENT, reorderFavorites } from '@/lib/favorites';
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

    // 拖拽相关状态
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

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

    // 长按开始（触摸设备）
    const handleTouchStart = (e: React.TouchEvent, index: number) => {
        const touch = e.touches[0];
        touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };

        longPressTimerRef.current = setTimeout(() => {
            setIsDragging(true);
            setDraggedIndex(index);
            // 触觉反馈
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        }, 500); // 500ms 长按触发拖拽
    };

    // 触摸移动
    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || draggedIndex === null) return;

        const touch = e.touches[0];

        // 检测移动距离，如果移动太大则取消长按
        if (touchStartPosRef.current) {
            const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
            const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);
            if (dx > 10 || dy > 10) {
                if (longPressTimerRef.current) {
                    clearTimeout(longPressTimerRef.current);
                    longPressTimerRef.current = null;
                }
            }
        }

        // 获取触摸位置下的元素
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (element) {
            const dragItem = element.closest('[data-drag-index]');
            if (dragItem) {
                const newIndex = parseInt(dragItem.getAttribute('data-drag-index') || '0', 10);
                if (newIndex !== dragOverIndex) {
                    setDragOverIndex(newIndex);
                }
            }
        }
    };

    // 触摸结束
    const handleTouchEnd = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }

        if (isDragging && draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
            const newFavorites = reorderFavorites(draggedIndex, dragOverIndex);
            setFavorites(newFavorites);
        }

        setIsDragging(false);
        setDraggedIndex(null);
        setDragOverIndex(null);
        touchStartPosRef.current = null;
    };

    // 鼠标拖拽开始
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
    };

    // 拖拽经过
    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverIndex(index);
    };

    // 拖拽离开
    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    // 放置
    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== dropIndex) {
            const newFavorites = reorderFavorites(draggedIndex, dropIndex);
            setFavorites(newFavorites);
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    // 拖拽结束
    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
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
                                        className="ml-2 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors"
                                        title={checkIsFavorite(fund.fund_code) ? '取消收藏' : '添加收藏'}
                                    >
                                        <Star
                                            className={`w-4 h-4 transition-colors ${checkIsFavorite(fund.fund_code)
                                                ? 'text-gray-500 fill-gray-500'
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
                            favorites.map((fund, index) => (
                                <div
                                    key={fund.fund_code}
                                    data-drag-index={index}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, index)}
                                    onDragEnd={handleDragEnd}
                                    onTouchStart={(e) => handleTouchStart(e, index)}
                                    onTouchMove={handleTouchMove}
                                    onTouchEnd={handleTouchEnd}
                                    className={`px-4 py-3 cursor-pointer transition-all select-none ${isDragging && draggedIndex === index
                                            ? 'opacity-50 scale-95 bg-gray-100 dark:bg-gray-700'
                                            : isDragging && dragOverIndex === index
                                                ? 'border-t-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : selectedCode === fund.fund_code
                                                    ? 'bg-blue-50 dark:bg-blue-900/20'
                                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center flex-1 min-w-0">
                                            <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600 mr-2 flex-shrink-0 cursor-grab active:cursor-grabbing" />
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
                                        </div>
                                        <button
                                            onClick={(e) => handleToggleFavorite(e, fund)}
                                            className="ml-2 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            title="取消收藏"
                                        >
                                            <Star className="w-4 h-4 text-gray-700 fill-gray-700" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* 拖拽提示 */}
            {activeTab === 'favorites' && favorites.length > 0 && (
                <div className="px-4 py-2 text-xs text-gray-400 dark:text-gray-500 text-center border-t border-gray-200 dark:border-gray-700">
                    长按或拖拽 GripVertical 图标可排序
                </div>
            )}
        </div>
    );
}