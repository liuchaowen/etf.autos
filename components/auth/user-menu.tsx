/**
 * 用户菜单组件
 * 显示用户头像和下拉菜单
 */

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { LogOut, User, ExternalLink, Settings, ChevronDown } from 'lucide-react';
import { useAuth, isGitHubConfigured } from '@/lib/auth/use-auth';
import { useSync } from '@/lib/sync/sync-context';
import { cn } from '@/lib/utils';

interface UserMenuProps {
  className?: string;
}

/**
 * 用户菜单
 */
export function UserMenu({ className = '' }: UserMenuProps) {
  const router = useRouter();
  const { isLoggedIn, isLoading, user, logout } = useAuth();
  const { sync, isSyncing } = useSync();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 未配置 GitHub Client ID
  if (!isGitHubConfigured()) {
    return null;
  }

  // 加载中
  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
      </div>
    );
  }

  // 未登录
  if (!isLoggedIn || !user) {
    return null;
  }

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 处理登出
  const handleLogout = () => {
    setIsOpen(false);
    logout();
    router.push('/');
  };

  // 处理同步
  const handleSync = () => {
    setIsOpen(false);
    sync();
  };

  // 打开 GitHub Profile
  const openGitHubProfile = () => {
    setIsOpen(false);
    window.open(user.html_url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div ref={menuRef} className={cn('relative', className)}>
      {/* 触发按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted transition-colors"
      >
        <img
          src={user.avatar_url}
          alt={user.name || user.login}
          className="w-8 h-8 rounded-full"
        />
        <ChevronDown className={cn(
          'w-4 h-4 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-popover border rounded-lg shadow-lg z-50">
          {/* 用户信息 */}
          <div className="px-3 py-2 border-b">
            <p className="font-medium text-sm">{user.name || user.login}</p>
            <p className="text-xs text-muted-foreground">@{user.login}</p>
          </div>

          {/* 菜单项 */}
          <div className="py-1">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors',
                isSyncing && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Settings className="w-4 h-4" />
              {isSyncing ? '同步中...' : '立即同步'}
            </button>

            <button
              onClick={openGitHubProfile}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              <User className="w-4 h-4" />
              GitHub Profile
              <ExternalLink className="w-3 h-3 ml-auto" />
            </button>
          </div>

          {/* 登出 */}
          <div className="border-t py-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              退出登录
            </button>
          </div>
        </div>
      )}
    </div>
  );
}