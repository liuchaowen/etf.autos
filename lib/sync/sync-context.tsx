/**
 * 同步上下文
 * 提供全局的同步状态管理
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { SyncStatus, SyncContextValue } from './types';
import { getSyncManager } from './sync-manager';
import { useAuth } from '@/lib/auth/use-auth';

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

/**
 * 同步 Provider 组件
 */
export function SyncProvider({ children }: SyncProviderProps) {
    const { isLoggedIn, token } = useAuth();
    const [status, setStatus] = useState<SyncStatus>('idle');
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const syncManager = getSyncManager();

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

    // 登录时自动同步一次
    useEffect(() => {
        if (isLoggedIn && token) {
            // 延迟执行，避免阻塞页面加载
            const timer = setTimeout(() => {
                sync().catch(console.error);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isLoggedIn, token]);

    // 执行完整同步
    const sync = useCallback(async () => {
        if (!isLoggedIn) {
            setError('请先登录');
            return;
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

    // 仅上传
    const upload = useCallback(async () => {
        if (!isLoggedIn) {
            setError('请先登录');
            return;
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

    // 仅下载
    const download = useCallback(async () => {
        if (!isLoggedIn) {
            setError('请先登录');
            return;
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