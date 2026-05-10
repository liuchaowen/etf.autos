/**
 * 同步状态组件
 * 显示同步状态和操作按钮
 */

import React from 'react';
import { Cloud, CloudOff, CloudUpload, CloudDownload, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useSync } from '@/lib/sync/sync-context';
import { useAuth } from '@/lib/auth/use-auth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SyncStatusProps {
    showButtons?: boolean;
    compact?: boolean;
    className?: string;
}

/**
 * 同步状态指示器
 */
export function SyncStatus({
    showButtons = true,
    compact = false,
    className = ''
}: SyncStatusProps) {
    const { isLoggedIn } = useAuth();
    const { status, lastSyncTime, error, isSyncing, sync, upload, download, clearError } = useSync();

    // 未登录
    if (!isLoggedIn) {
        return (
            <div className={cn('flex items-center gap-2 text-muted-foreground', className)}>
                <CloudOff className="w-4 h-4" />
                {!compact && <span className="text-sm">未登录</span>}
            </div>
        );
    }

    // 同步中
    if (isSyncing) {
        return (
            <div className={cn('flex items-center gap-2', className)}>
                <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                {!compact && <span className="text-sm text-blue-500">同步中...</span>}
            </div>
        );
    }

    // 错误状态
    if (status === 'error' && error) {
        return (
            <div className={cn('flex items-center gap-2', className)}>
                <AlertCircle className="w-4 h-4 text-red-500" />
                {!compact && (
                    <span className="text-sm text-red-500" title={error}>
                        同步失败
                    </span>
                )}
                {showButtons && !compact && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearError}
                        className="h-6 px-2"
                    >
                        清除
                    </Button>
                )}
            </div>
        );
    }

    // 成功状态（短暂显示后恢复到 idle）
    if (status === 'success') {
        return (
            <div className={cn('flex items-center gap-2', className)}>
                <Check className="w-4 h-4 text-green-500" />
                {!compact && (
                    <span className="text-sm text-green-500">
                        同步完成
                    </span>
                )}
                {showButtons && (
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={sync}
                            disabled={isSyncing}
                            className="h-6 px-2"
                            title="立即同步"
                        >
                            <RefreshCw className={cn('w-3 h-3', isSyncing && 'animate-spin')} />
                        </Button>
                        {!compact && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={upload}
                                    disabled={isSyncing}
                                    className="h-6 px-2"
                                    title="上传本地数据"
                                >
                                    <CloudUpload className="w-3 h-3" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={download}
                                    disabled={isSyncing}
                                    className="h-6 px-2"
                                    title="下载云端数据"
                                >
                                    <CloudDownload className="w-3 h-3" />
                                </Button>
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // 空闲状态 - 显示上次同步时间
    const formatLastSyncTime = (time: string | null) => {
        if (!time) return '从未同步';
        const date = new Date(time);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return '刚刚';
        if (diffMins < 60) return `${diffMins}分钟前`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}小时前`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}天前`;
    };

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <Cloud className="w-4 h-4 text-muted-foreground" />
            {!compact && (
                <span className="text-sm text-muted-foreground" title={lastSyncTime || ''}>
                    已同步 · {formatLastSyncTime(lastSyncTime)}
                </span>
            )}
            {showButtons && (
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={sync}
                        disabled={isSyncing}
                        className="h-6 px-2"
                        title="立即同步"
                    >
                        <RefreshCw className={cn('w-3 h-3', isSyncing && 'animate-spin')} />
                    </Button>
                    {!compact && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={upload}
                                disabled={isSyncing}
                                className="h-6 px-2"
                                title="上传本地数据"
                            >
                                <CloudUpload className="w-3 h-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={download}
                                disabled={isSyncing}
                                className="h-6 px-2"
                                title="下载云端数据"
                            >
                                <CloudDownload className="w-3 h-3" />
                            </Button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}