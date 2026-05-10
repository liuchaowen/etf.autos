/**
 * 登录按钮组件
 */

import React from 'react';
import { useRouter } from 'next/router';
import { LogIn } from 'lucide-react';
import { useAuth, isGitHubConfigured } from '@/lib/auth/use-auth';
import { Button } from '@/components/ui/button';

// GitHub SVG Icon
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

interface LoginButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

/**
 * 登录按钮
 */
export function LoginButton({
  variant = 'outline',
  size = 'default',
  className = 'h-8 py-1 px-2'
}: LoginButtonProps) {
  const router = useRouter();
  const { isLoggedIn, isLoading, user } = useAuth();

  // 未配置 GitHub Client ID
  if (!isGitHubConfigured()) {
    return null;
  }

  // 加载中
  if (isLoading) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <LogIn className="w-4 h-4 mr-2" />
        加载中...
      </Button>
    );
  }

  // 已登录，不显示登录按钮（由 UserMenu 组件处理）
  if (isLoggedIn && user) {
    return null;
  }

  // 未登录，显示登录按钮
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => router.push('/auth/login')}
    >
      <GitHubIcon className="w-4 h-4 mr-2" />
      登录
    </Button>
  );
}