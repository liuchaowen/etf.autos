import React, { useEffect, useState } from 'react';
import { useTheme } from '@/lib/theme-context';

// 太阳图标 (亮色主题)
function SunIcon({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
        </svg>
    );
}

// 月亮图标 (暗色主题)
function MoonIcon({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
        </svg>
    );
}

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // 确保组件只在客户端渲染后才显示正确的主题状态
    useEffect(() => {
        setMounted(true);
    }, []);

    // 在 SSR 时显示默认状态，避免 hydration 不匹配
    if (!mounted) {
        return (
            <button
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors bg-gray-100 text-gray-700"
                title="切换主题"
            >
                <MoonIcon className="w-4 h-4" />
                <span>暗</span>
            </button>
        );
    }

    return (
        <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            title={theme === 'light' ? '切换到暗色主题' : '切换到亮色主题'}
        >
            {theme === 'light' ? (
                <>
                    <MoonIcon className="w-4 h-4" />
                </>
            ) : (
                <>
                    <SunIcon className="w-4 h-4" />
                </>
            )}
        </button>
    );
}