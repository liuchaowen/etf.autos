import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, Star, X } from 'lucide-react';
import { ETF_LIST } from '@/lib/api';
import { getFavorites, toggleFavorite, isFavorite as checkIsFavorite, FAVORITES_CHANGE_EVENT } from '@/lib/favorites';
import type { FundItem } from '@/types';

interface FundSearchProps {
    /** 选择基金时的回调 */
    onSelect: (fund: FundItem) => void;
    /** 占位符文本 */
    placeholder?: string;
}

/**
 * 获取拼音首字母
 * @param pinyin 完整拼音
 * @returns 首字母组合
 */
function getInitials(pinyin: string): string {
    if (!pinyin) return '';
    return pinyin.split('').filter((char) => {
        return char >= 'A' && char <= 'Z';
    }).join('');
}

// 全局缓存基金列表
let cachedFunds: FundItem[] | null = null;

/**
 * 基金搜索组件
 * 支持按代码、名称、拼音首字母搜索
 */
export function FundSearch({ onSelect, placeholder = '搜索基金代码或名称' }: FundSearchProps) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [funds, setFunds] = useState<FundItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [favorites, setFavorites] = useState<FundItem[]>([]);
    const [favoriteCodes, setFavoriteCodes] = useState<Set<string>>(new Set());
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 加载基金列表数据（只加载一次）
    useEffect(() => {
        const loadFunds = async () => {
            if (cachedFunds) {
                setFunds(cachedFunds);
                return;
            }

            setLoading(true);
            try {
                const response = await fetch('/data/list.json');
                if (!response.ok) {
                    throw new Error('加载基金列表失败');
                }
                const data = await response.json();
                cachedFunds = data;
                setFunds(data);
            } catch (error) {
                console.error('加载基金列表失败:', error);
            } finally {
                setLoading(false);
            }
        };
        loadFunds();
    }, []);

    // 加载收藏列表并监听变化
    useEffect(() => {
        const updateFavorites = (newFavorites?: FundItem[]) => {
            const loadedFavorites = newFavorites || getFavorites();
            setFavorites(loadedFavorites);
            setFavoriteCodes(new Set(loadedFavorites.map(f => f.fund_code)));
        };

        // 初始加载
        updateFavorites();

        // 监听收藏变化事件（同一页面内的变化）
        const handleFavoritesChange = (e: CustomEvent<{ favorites: FundItem[] }>) => {
            updateFavorites(e.detail.favorites);
        };
        window.addEventListener(FAVORITES_CHANGE_EVENT, handleFavoritesChange as EventListener);

        // 监听 storage 事件（其他标签页的变化）
        const handleStorageChange = () => {
            updateFavorites();
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener(FAVORITES_CHANGE_EVENT, handleFavoritesChange as EventListener);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // 当下拉框打开时，刷新收藏列表
    useEffect(() => {
        if (isOpen) {
            const loadedFavorites = getFavorites();
            setFavorites(loadedFavorites);
            setFavoriteCodes(new Set(loadedFavorites.map(f => f.fund_code)));
        }
    }, [isOpen]);

    // 过滤搜索结果
    const filteredFunds = useMemo(() => {
        // 没有输入时：有收藏显示收藏列表，无收藏显示热门ETF
        if (!query.trim()) {
            return favorites.length > 0 ? favorites : ETF_LIST;
        }

        const queryLower = query.toLowerCase();
        const results: FundItem[] = [];

        for (const fund of funds) {
            // 限制返回20条
            if (results.length >= 20) break;

            // 匹配代码
            if (fund.fund_code.toLowerCase().includes(queryLower)) {
                results.push(fund);
                continue;
            }

            // 匹配名称
            if (fund.name?.toLowerCase().includes(queryLower)) {
                results.push(fund);
                continue;
            }

            // 匹配缩写
            if (fund.abbr.toLowerCase().includes(queryLower)) {
                results.push(fund);
                continue;
            }

            // 匹配拼音首字母
            const initials = getInitials(fund.pinyin);
            if (initials.toLowerCase().includes(queryLower)) {
                results.push(fund);
                continue;
            }

            // 匹配完整拼音
            if (fund.pinyin.toLowerCase().includes(queryLower)) {
                results.push(fund);
                continue;
            }
        }

        return results;
    }, [query, funds, favorites]);

    // 处理选择
    const handleSelect = (fund: FundItem) => {
        onSelect(fund);
        setQuery('');
        setIsOpen(false);
        inputRef.current?.blur();
    };

    // 处理收藏点击
    const handleFavoriteClick = useCallback((e: React.MouseEvent, fund: FundItem) => {
        e.stopPropagation(); // 阻止触发选择
        const newFavorites = toggleFavorite(fund);
        setFavorites(newFavorites);
        setFavoriteCodes(new Set(newFavorites.map(f => f.fund_code)));
    }, []);

    // 键盘导航
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || filteredFunds.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < filteredFunds.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev > 0 ? prev - 1 : filteredFunds.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredFunds[highlightedIndex]) {
                    handleSelect(filteredFunds[highlightedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                inputRef.current?.blur();
                break;
        }
    };

    // 点击外部关闭
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                !inputRef.current?.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 重置高亮索引
    useEffect(() => {
        setHighlightedIndex(0);
    }, [filteredFunds]);

    // 判断是否为收藏列表
    const isShowingFavorites = !query.trim() && favorites.length > 0;
    const listTitle = isShowingFavorites ? '收藏ETF基金' : '热门ETF基金';

    // 清除输入
    const handleClear = () => {
        setQuery('');
        inputRef.current?.focus();
    };

    return (
        <div className="relative">
            {/* 搜索输入框 */}
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-48 pl-8 pr-8 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-[8px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                />
                {query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                        title="清除输入"
                    >
                        <X className="w-3 h-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                    </button>
                )}
            </div>

            {/* 下拉选项 */}
            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full right-0 mt-4 w-72 max-h-80 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
                >
                    {loading ? (
                        <div className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 text-center">
                            加载中...
                        </div>
                    ) : filteredFunds.length === 0 ? (
                        <div className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 text-center">
                            未找到匹配的基金
                        </div>
                    ) : (
                        <ul className="py-1">
                            {!query.trim() && (
                                <li className="px-3 py-1.5 text-xs text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700">
                                    {listTitle}
                                </li>
                            )}
                            {filteredFunds.map((fund, index) => {
                                const isFav = favoriteCodes.has(fund.fund_code);
                                return (
                                    <li
                                        key={fund.fund_code}
                                        onClick={() => handleSelect(fund)}
                                        className={`px-3 py-2 cursor-pointer transition-colors ${index === highlightedIndex
                                            ? 'bg-blue-50 dark:bg-blue-900/30'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <span className="font-medium text-sm text-gray-900 dark:text-white">
                                                    {fund.fund_code}
                                                </span>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                                    {fund.name || fund.abbr}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-2">
                                                <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[80px]">
                                                    {fund.type}
                                                </span>
                                                <button
                                                    onClick={(e) => handleFavoriteClick(e, fund)}
                                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors flex-shrink-0"
                                                    title={isFav ? '取消收藏' : '添加收藏'}
                                                >
                                                    {isFav ? (
                                                        <Star className="w-4 h-4 text-gray-500 fill-gray-500" />
                                                    ) : (
                                                        <Star className="w-4 h-4 text-gray-400 hover:text-gray-500" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}