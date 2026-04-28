import React from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { ChartIcon } from '@/components/icons';

interface HeaderProps {
    /** 当前激活的页面 */
    activePage: 'valuation' | 'backtest' | 'about';
    /** 右侧额外内容（如 ETF 选择器） */
    rightContent?: React.ReactNode;
}

export function Header({ activePage, rightContent }: HeaderProps) {
    return (
        <header className="bg-white dark:bg-gray-800 border-b border-[#dddddd] dark:border-gray-700 sticky top-0 z-50 transition-colors">
            <div className="mx-auto px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    {/* 左侧：Logo */}
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <span className="text-sm font-semibold text-[#222222] dark:text-white">ETF</span>
                    </Link>

                    {/* 中间：导航链接 - tri-tab 风格 */}
                    <div className="flex items-center gap-6">
                        {activePage === 'valuation' ? (
                            <span className="relative text-sm font-medium text-[#222222] dark:text-white pb-2 border-b-2 border-[#222222] dark:border-white">
                                估值
                            </span>
                        ) : (
                            <Link
                                href="/"
                                className="relative text-sm font-medium text-[#6a6a6a] dark:text-gray-400 hover:text-[#222222] dark:hover:text-white transition-colors pb-2"
                            >
                                估值
                            </Link>
                        )}

                        {activePage === 'backtest' ? (
                            <span className="relative text-sm font-medium text-[#222222] dark:text-white pb-2 border-b-2 border-[#222222] dark:border-white">
                                网格策略
                            </span>
                        ) : (
                            <Link
                                href="/strategy"
                                className="relative text-sm font-medium text-[#6a6a6a] dark:text-gray-400 hover:text-[#222222] dark:hover:text-white transition-colors pb-2"
                            >
                                网格策略
                            </Link>
                        )}

                        {activePage === 'about' ? (
                            <span className="relative text-sm font-medium text-[#222222] dark:text-white pb-2 border-b-2 border-[#222222] dark:border-white">
                                关于
                            </span>
                        ) : (
                            <Link
                                href="/about"
                                className="relative text-sm font-medium text-[#6a6a6a] dark:text-gray-400 hover:text-[#222222] dark:hover:text-white transition-colors pb-2"
                            >
                                关于
                            </Link>
                        )}
                    </div>

                    {/* 右侧：额外内容 + 主题切换 */}
                    <div className="flex items-center gap-3">
                        {rightContent}
                        <ThemeToggle />
                    </div>
                </div>
            </div>
        </header>
    );
}