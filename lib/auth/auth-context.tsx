/**
 * 认证上下文
 * 提供全局的登录状态管理
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { AuthState, AuthContextValue, GitHubUser } from './types';
import {
    loadAuthFromStorage,
    saveAuthToStorage,
    clearAuthFromStorage,
    fetchGitHubUser,
    validateToken,
    isGitHubConfigured,
} from './device-flow';

// 初始状态
const initialState: AuthState = {
    isLoggedIn: false,
    isLoading: true,
    user: null,
    token: null,
    error: null,
};

// 创建上下文
const AuthContext = createContext<AuthContextValue | null>(null);

// Provider Props
interface AuthProviderProps {
    children: React.ReactNode;
}

/**
 * 认证 Provider 组件
 */
export function AuthProvider({ children }: AuthProviderProps) {
    const [state, setState] = useState<AuthState>(initialState);

    // 初始化：从本地存储恢复登录状态
    useEffect(() => {
        const initAuth = async () => {
            if (!isGitHubConfigured()) {
                setState({
                    isLoggedIn: false,
                    isLoading: false,
                    user: null,
                    token: null,
                    error: null,
                });
                return;
            }

            const { token, user } = loadAuthFromStorage();

            if (!token || !user) {
                setState({
                    isLoggedIn: false,
                    isLoading: false,
                    user: null,
                    token: null,
                    error: null,
                });
                return;
            }

            // 验证 token 是否仍然有效
            const isValid = await validateToken(token);

            if (isValid) {
                setState({
                    isLoggedIn: true,
                    isLoading: false,
                    user,
                    token,
                    error: null,
                });
            } else {
                // Token 无效，清除本地存储
                clearAuthFromStorage();
                setState({
                    isLoggedIn: false,
                    isLoading: false,
                    user: null,
                    token: null,
                    error: '登录已过期，请重新登录',
                });
            }
        };

        initAuth();
    }, []);

    // 登录（由登录页面调用，设置 token 和用户信息）
    const login = useCallback(async () => {
        // 这个方法主要用于登录页面完成登录后调用
        // 实际的 Device Flow 登录流程在登录页面处理
        const { token, user } = loadAuthFromStorage();
        if (token && user) {
            setState({
                isLoggedIn: true,
                isLoading: false,
                user,
                token,
                error: null,
            });
        }
    }, []);

    // 登出
    const logout = useCallback(() => {
        clearAuthFromStorage();
        setState({
            isLoggedIn: false,
            isLoading: false,
            user: null,
            token: null,
            error: null,
        });
    }, []);

    // 刷新用户信息
    const refreshUser = useCallback(async () => {
        const { token } = loadAuthFromStorage();
        if (!token) {
            return;
        }

        try {
            const user = await fetchGitHubUser(token);
            saveAuthToStorage(token, user);
            setState(prev => ({
                ...prev,
                user,
            }));
        } catch (error) {
            console.error('刷新用户信息失败:', error);
        }
    }, []);

    // 设置认证信息（登录成功后调用）
    const setAuth = useCallback((token: string, user: GitHubUser) => {
        saveAuthToStorage(token, user);
        setState({
            isLoggedIn: true,
            isLoading: false,
            user,
            token,
            error: null,
        });
    }, []);

    // 设置错误
    const setError = useCallback((error: string | null) => {
        setState(prev => ({
            ...prev,
            error,
        }));
    }, []);

    // 设置加载状态
    const setLoading = useCallback((isLoading: boolean) => {
        setState(prev => ({
            ...prev,
            isLoading,
        }));
    }, []);

    const contextValue = useMemo<AuthContextValue>(() => ({
        ...state,
        login,
        logout,
        refreshUser,
    }), [state, login, logout, refreshUser]);

    // 导出内部方法供登录页面使用
    const internalMethods = useMemo(() => ({
        setAuth,
        setError,
        setLoading,
    }), [setAuth, setError, setLoading]);

    return (
        <AuthContext.Provider value={contextValue}>
            <AuthContextInternal.Provider value={internalMethods}>
                {children}
            </AuthContextInternal.Provider>
        </AuthContext.Provider>
    );
}

// 内部上下文，仅供登录页面使用
const AuthContextInternal = createContext<{
    setAuth: (token: string, user: GitHubUser) => void;
    setError: (error: string | null) => void;
    setLoading: (isLoading: boolean) => void;
} | null>(null);

/**
 * 获取认证上下文
 */
export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth 必须在 AuthProvider 内使用');
    }
    return context;
}

/**
 * 获取内部认证方法（仅供登录页面使用）
 */
export function useAuthInternal() {
    const context = useContext(AuthContextInternal);
    if (!context) {
        throw new Error('useAuthInternal 必须在 AuthProvider 内使用');
    }
    return context;
}