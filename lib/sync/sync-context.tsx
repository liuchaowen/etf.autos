/**
 * 同步上下文
 * 提供全局的同步状态管理
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SyncStatus, SyncContextValue } from './types';
import { getSyncManager } from './sync-manager';
import { useAuth } from '@/lib/auth/use-auth';
import { FAVORITES_CHANGE_EVENT } from '@/lib/favorites';
import { STRATEGY_PARAMS_CHANGE_EVENT, STRATEGY_CODE_CHANGE_EVENT } from '@/pages/strategy';

// 创建上下文
const SyncContext = createContext<SyncContextValue | null>(null);

// Provider Props
interface SyncProviderProps {
    children: React.ReactNode;
}

// 初始状态
const initialState: SyncContextValue = {
    status: 'idle',
    lastSyncTime: null,
    error: null,
    isSyncing: false,
    sync: async () => { },
    upload: async () => { },
    download: async () => { },
    clearError: () => { },
};

// 自动上传延迟时间（毫秒）
const AUTO_UPLOAD_DELAY = 3000;
// 成功状态自动恢复时间（毫秒）
const SUCCESS_STATUS_TIMEOUT = 3000;

/**
 * 同步 Provider 组件
 */
export function SyncProvider({ children }: SyncProviderProps) {
    const { isLoggedIn, token } = useAuth();
    const [status, setStatus] = useState<SyncStatus>('idle');
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // 自动上传定时器引用
    const autoUploadTimerRef = useRef<NodeJS.Timeout | null>(null);
    // 成功状态恢复定时器引用
    const successTimerRef = useRef<NodeJS.Timeout | null>(null);

    const syncManager = getSyncManager();

    // 清除所有定时器
    const clearAllTimers = useCallback(() => {
        if (autoUploadTimerRef.current) {
            clearTimeout(autoUploadTimerRef.current);
            autoUploadTimerRef.current = null;
        }
        if (successTimerRef.current) {
            clearTimeout(successTimerRef.current);
            successTimerRef.current = null;
        }
    }, []);

    // 当 token 变化时，更新同步管理器
    useEffect(() => {
        if (token) {
            syncManager.setToken(token);
        } else {
            syncManager.clearToken();
        }
    }, [token, syncManager]);

    // 初始化：读取上次同步时间
    useEffect(() => {
        const time = syncManager.getLastSyncTime();
        setLastSyncTime(time);
    }, [syncManager]);

    // 仅上传 - 提前定义，供其他 useEffect 使用
    const upload = useCallback(async () => {
        if (!isLoggedIn) {
            setError('请先登录');
            return;
        }

        // 清除成功状态定时器
        if (successTimerRef.current) {
            clearTimeout(successTimerRef.current);
            successTimerRef.current = null;
        }

        setStatus('syncing');
        setError(null);

        try {
            await syncManager.upload();
            const time = syncManager.getLastSyncTime();
            setLastSyncTime(time);
            setStatus('success');
        } catch (err) {
            const message = err instanceof Error ? err.message : '上传失败';
            setError(message);
            setStatus('error');
        }
    }, [isLoggedIn, syncManager]);

    // 执行完整同步
    const sync = useCallback(async () => {
        if (!isLoggedIn) {
            setError('请先登录');
            return;
        }

        // 清除成功状态定时器
        if (successTimerRef.current) {
            clearTimeout(successTimerRef.current);
            successTimerRef.current = null;
        }

        setStatus('syncing');
        setError(null);

        try {
            await syncManager.sync();
            const time = syncManager.getLastSyncTime();
            setLastSyncTime(time);
            setStatus('success');
        } catch (err) {
            const message = err instanceof Error ? err.message : '同步失败';
            setError(message);
            setStatus('error');
        }
    }, [isLoggedIn, syncManager]);

    // 登录时自动同步一次
    useEffect(() => {
        if (isLoggedIn && token) {
            // 延迟执行，避免阻塞页面加载
            const timer = setTimeout(() => {
                sync().catch(console.error);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isLoggedIn, token, sync]);

    // 成功状态自动恢复到 idle
    useEffect(() => {
        if (status === 'success') {
            successTimerRef.current = setTimeout(() => {
                setStatus('idle');
                setError(null);
            }, SUCCESS_STATUS_TIMEOUT);

            return () => {
                if (successTimerRef.current) {
                    clearTimeout(successTimerRef.current);
                    successTimerRef.current = null;
                }
            };
        }
    }, [status]);

    // 监听数据变化，自动触发上传
    useEffect(() => {
        if (!isLoggedIn) return;

        // 处理数据变化的函数
        const handleDataChange = () => {
            // 清除之前的定时器
            if (autoUploadTimerRef.current) {
                clearTimeout(autoUploadTimerRef.current);
            }

            // 延迟上传，避免频繁触发
            autoUploadTimerRef.current = setTimeout(() => {
                upload().catch(console.error);
            }, AUTO_UPLOAD_DELAY);
        };

        // 监听收藏变化事件
        window.addEventListener(FAVORITES_CHANGE_EVENT, handleDataChange);

        // 监听策略参数变化事件
        window.addEventListener(STRATEGY_PARAMS_CHANGE_EVENT, handleDataChange);

        // 监听策略代码变化事件
        window.addEventListener(STRATEGY_CODE_CHANGE_EVENT, handleDataChange);

        // 监听 storage 事件（跨标签页的策略参数变化）
        const handleStorageChange = (e: StorageEvent) => {
            // 只关注策略参数相关的变化
            if (e.key && (e.key.startsWith('strategy_params_') || e.key === 'strategy_code_cache')) {
                handleDataChange();
            }
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener(FAVORITES_CHANGE_EVENT, handleDataChange);
            window.removeEventListener(STRATEGY_PARAMS_CHANGE_EVENT, handleDataChange);
            window.removeEventListener(STRATEGY_CODE_CHANGE_EVENT, handleDataChange);
            window.removeEventListener('storage', handleStorageChange);
            if (autoUploadTimerRef.current) {
                clearTimeout(autoUploadTimerRef.current);
                autoUploadTimerRef.current = null;
            }
        };
    }, [isLoggedIn, upload]);

    // 组件卸载时清理
    useEffect(() => {
        return () => {
            clearAllTimers();
        };
    }, [clearAllTimers]);

    // 仅下载
    const download = useCallback(async () => {
        if (!isLoggedIn) {
            setError('请先登录');
            return;
        }

        // 清除成功状态定时器
        if (successTimerRef.current) {
            clearTimeout(successTimerRef.current);
            successTimerRef.current = null;
        }

        setStatus('syncing');
        setError(null);

        try {
            await syncManager.download();
            const time = syncManager.getLastSyncTime();
            setLastSyncTime(time);
            setStatus('success');
        } catch (err) {
            const message = err instanceof Error ? err.message : '下载失败';
            setError(message);
            setStatus('error');
        }
    }, [isLoggedIn, syncManager]);

    // 清除错误
    const clearError = useCallback(() => {
        setError(null);
        setStatus('idle');
    }, []);

    const contextValue = useMemo<SyncContextValue>(() => ({
        status,
        lastSyncTime,
        error,
        isSyncing: status === 'syncing',
        sync,
        upload,
        download,
        clearError,
    }), [status, lastSyncTime, error, sync, upload, download, clearError]);

    return (
        <SyncContext.Provider value={contextValue}>
            {children}
        </SyncContext.Provider>
    );
}

/**
 * 获取同步上下文
 */
export function useSync(): SyncContextValue {
    const context = useContext(SyncContext);
    if (!context) {
        throw new Error('useSync 必须在 SyncProvider 内使用');
    }
    return context;
}