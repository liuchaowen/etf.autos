/**
 * 认证模块类型定义
 */

// GitHub 用户信息
export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  html_url: string;
}

// 认证状态
export interface AuthState {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: GitHubUser | null;
  token: string | null;
  error: string | null;
}

// Device Flow 响应
export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

// Token 响应
export interface TokenResponse {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
  error_uri?: string;
}

// 认证上下文值
export interface AuthContextValue extends AuthState {
  login: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// 本地存储键
export const AUTH_STORAGE_KEYS = {
  TOKEN: 'etf_autos_github_token',
  USER: 'etf_autos_github_user',
  TOKEN_EXPIRY: 'etf_autos_token_expiry',
} as const;