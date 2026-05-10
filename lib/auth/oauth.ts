/**
 * GitHub OAuth 认证实现
 * 适用于 Vercel 部署，使用标准 OAuth 流程
 */

import { GitHubUser, AUTH_STORAGE_KEYS } from './types';

// GitHub OAuth 配置
const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '';
const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_OAUTH_BASE = 'https://github.com/login';

// Token 有效期（毫秒）
const TOKEN_VALIDITY_PERIOD = 30 * 24 * 60 * 60 * 1000; // 30天

/**
 * 检查是否配置了 GitHub Client ID
 */
export function isGitHubConfigured(): boolean {
  return Boolean(GITHUB_CLIENT_ID);
}

/**
 * 获取 GitHub Client ID
 */
export function getGitHubClientId(): string {
  return GITHUB_CLIENT_ID;
}

/**
 * 生成登录 URL
 */
export function getLoginUrl(redirectUri: string): string {
  if (!GITHUB_CLIENT_ID) {
    throw new Error('GitHub Client ID 未配置');
  }

  const state = crypto.randomUUID(); // 防CSRF
  sessionStorage.setItem('oauth_state', state);

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'gist', // 只请求 gist 权限
    state,
    allow_signup: 'true',
  });

  return `${GITHUB_OAUTH_BASE}/oauth/authorize?${params.toString()}`;
}

/**
 * 用 code 换取 token（通过 API 端点）
 */
export async function exchangeCodeForToken(code: string, state: string): Promise<{ token: string; user: GitHubUser }> {
  const response = await fetch('/api/auth/callback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, state }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || error.error || '认证失败');
  }

  const data = await response.json();
  return {
    token: data.access_token,
    user: data.user,
  };
}

/**
 * 获取 GitHub 用户信息
 */
export async function fetchGitHubUser(token: string): Promise<GitHubUser> {
  const response = await fetch(`${GITHUB_API_BASE}/user`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Token 无效或已过期');
    }
    throw new Error(`获取用户信息失败: ${response.status}`);
  }

  return response.json();
}

/**
 * 保存认证信息到本地存储
 */
export function saveAuthToStorage(token: string, user: GitHubUser): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, token);
  localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
  localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN_EXPIRY, 
    (Date.now() + TOKEN_VALIDITY_PERIOD).toString()
  );
}

/**
 * 从本地存储读取认证信息
 */
export function loadAuthFromStorage(): { token: string | null; user: GitHubUser | null } {
  if (typeof window === 'undefined') {
    return { token: null, user: null };
  }

  try {
    const token = localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
    const userJson = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
    const expiry = localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN_EXPIRY);

    // 检查是否过期
    if (expiry && parseInt(expiry) < Date.now()) {
      clearAuthFromStorage();
      return { token: null, user: null };
    }

    const user = userJson ? JSON.parse(userJson) : null;

    return { token, user };
  } catch {
    clearAuthFromStorage();
    return { token: null, user: null };
  }
}

/**
 * 清除本地存储的认证信息
 */
export function clearAuthFromStorage(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
  localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
  localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN_EXPIRY);
}

/**
 * 验证 Token 是否有效
 */
export async function validateToken(token: string): Promise<boolean> {
  try {
    await fetchGitHubUser(token);
    return true;
  } catch {
    return false;
  }
}