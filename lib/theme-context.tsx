import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 根据中国上海时区的时间判断应该使用的主题
// 早上 6:00 到晚上 18:00 使用 light 主题
// 晚上 18:00 到早上 6:00 使用 dark 主题
function getThemeByShanghaiTime(): Theme {
    const now = new Date();
    // 获取上海时区的时间（UTC+8）
    const shanghaiHour = (now.getUTCHours() + 8) % 24;
    // 6:00 - 18:00 为白天，使用 light 主题
    return shanghaiHour >= 6 && shanghaiHour < 18 ? 'light' : 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('light');
    const isInitialized = useRef(false);

    // 初始化时从 localStorage 读取主题或根据时间自动选择（仅在客户端）
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
            setThemeState(savedTheme);
            // 立即应用 DOM class
            if (savedTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        } else {
            // 没有保存的主题时，根据上海时区时间自动选择
            const autoTheme = getThemeByShanghaiTime();
            setThemeState(autoTheme);
            if (autoTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
        // 标记初始化完成
        isInitialized.current = true;
    }, []);

    // 当主题变化时，更新 DOM 和 localStorage
    useEffect(() => {
        // 只有在初始化完成后才更新，避免在首次渲染时覆盖 localStorage
        if (!isInitialized.current) return;

        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setThemeState(prev => prev === 'light' ? 'dark' : 'light');
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        // 在 SSR 时返回默认值，而不是抛出错误
        return { theme: 'light' as Theme, toggleTheme: () => { }, setTheme: (_theme: Theme) => { } };
    }
    return context;
}