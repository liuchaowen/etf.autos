/**
 * useAuth Hook
 * 简化认证上下文的使用
 */

export { useAuth, useAuthInternal, AuthProvider } from './auth-context';
export type { AuthContextValue, AuthState, GitHubUser } from './types';
export { isGitHubConfigured, getGitHubClientId } from './device-flow';