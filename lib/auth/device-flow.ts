/**
 * GitHub Device Flow 认证实现
 * 适用于纯静态站点，无需后端代理
 */

import { DeviceCodeResponse, TokenResponse, GitHubUser, AUTH_STORAGE_KEYS } from './types';

// GitHub OAuth 配置 - 从环境变量读取
const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '';
const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_OAUTH_BASE = 'https://github.com/login';

// Token 有效期（毫秒）- GitHub Token 默认不过期，但我们设置一个本地过期时间用于刷新检查
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
 * 步骤1：发起 Device Flow，获取设备码
 */
export async function initiateDeviceFlow(): Promise<DeviceCodeResponse> {
  if (!GITHUB_CLIENT_ID) {
    throw new Error('GitHub Client ID 未配置，请设置 NEXT_PUBLIC_GITHUB_CLIENT_ID 环境变量');
  }

  // GitHub Device Flow API 需要 form-urlencoded 格式
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    scope: 'gist', // 只请求 gist 权限
  });

  try {
    const response = await fetch(`${GITHUB_OAUTH_BASE}/device/code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`获取设备码失败: ${response.status} ${errorText}`);
    }

    return response.json();
  } catch (error) {
    // 网络错误处理
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('无法连接到 GitHub，请检查网络连接或使用代理访问');
    }
    throw error;
  }
}

/**
 * 步骤2：轮询检查用户是否已授权
 * @param deviceCode 设备码
 * @param interval 轮询间隔（秒）
 * @param onStatusChange 状态变化回调
 * @returns access_token
 */
export async function pollForToken(
  deviceCode: string,
  interval: number = 5,
  onStatusChange?: (status: 'pending' | 'success' | 'error', message?: string) => void
): Promise<string> {
  if (!GITHUB_CLIENT_ID) {
    throw new Error('GitHub Client ID 未配置');
  }

  const maxAttempts = 60; // 最多尝试60次（5分钟）
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;
    
    // 等待指定间隔
    await new Promise(resolve => setTimeout(resolve, interval * 1000));

    onStatusChange?.('pending', `等待授权中... (${attempts}/${maxAttempts})`);

    // GitHub OAuth API 需要 form-urlencoded 格式
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      device_code: deviceCode,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    });

    const response = await fetch(`${GITHUB_OAUTH_BASE}/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      continue; // 网络错误，继续轮询
    }

    const data: TokenResponse = await response.json();

    // 成功获取 token
    if (data.access_token) {
      onStatusChange?.('success', '授权成功！');
      return data.access_token;
    }

    // 处理错误
    switch (data.error) {
      case 'authorization_pending':
        // 用户尚未授权，继续轮询
        continue;
      case 'slow_down':
        // 需要减慢轮询速度
        interval = Math.min(interval + 5, 15);
        continue;
      case 'expired_token':
        onStatusChange?.('error', '验证码已过期，请重新登录');
        throw new Error('验证码已过期，请重新登录');
      case 'access_denied':
        onStatusChange?.('error', '用户拒绝授权');
        throw new Error('用户拒绝授权');
      default:
        onStatusChange?.('error', data.error_description || '授权失败');
        throw new Error(data.error_description || data.error || '授权失败');
    }
  }

  throw new Error('授权超时，请重试');
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