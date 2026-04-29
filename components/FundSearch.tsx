import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SearchIcon } from './icons';
import { ETF_LIST } from '@/lib/api';

// 基金数据类型
interface FundItem {
    fund_code: string;
    abbr: string;
    name: string;
    type: string;
    pinyin: string;
}

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

    // 过滤搜索结果
    const filteredFunds = useMemo(() => {
        // 没有输入时返回ETF_LIST作为默认展示
        if (!query.trim()) {
            return ETF_LIST;
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
            if (fund.name.toLowerCase().includes(queryLower)) {
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
    }, [query, funds]);

    // 处理选择
    const handleSelect = (fund: FundItem) => {
        onSelect(fund);
        setQuery('');
        setIsOpen(false);
        inputRef.current?.blur();
    };

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

    return (
        <div className="relative">
            {/* 搜索输入框 */}
            <div className="relative">
                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
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
                    className="w-48 pl-8 pr-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-[8px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                />
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
                                    热门ETF基金
                                </li>
                            )}
                            {filteredFunds.map((fund, index) => (
                                <li
                                    key={fund.fund_code}
                                    onClick={() => handleSelect(fund)}
                                    className={`px-3 py-2 cursor-pointer transition-colors ${index === highlightedIndex
                                        ? 'bg-blue-50 dark:bg-blue-900/30'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="font-medium text-sm text-gray-900 dark:text-white">
                                                {fund.fund_code}
                                            </span>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                                {fund.name}
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[100px] self-center">
                                            {fund.type}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}