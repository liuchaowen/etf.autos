/**
 * GitHub OAuth 回调页面
 * 处理授权后的 code 交换
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { exchangeCodeForToken } from '@/lib/auth/oauth';
import { useAuthInternal, isGitHubConfigured } from '@/lib/auth/use-auth';
import { Header } from '@/components/header';
import { FooterDisclaimer } from '@/components/footer-disclaimer';

export default function AuthCallbackPage() {
    const router = useRouter();
    const { setAuth, setError } = useAuthInternal();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState<string>('');

    useEffect(() => {
        const handleCallback = async () => {
            if (!isGitHubConfigured()) {
                setErrorMessage('GitHub OAuth 未配置');
                setStatus('error');
                return;
            }

            const { code, state } = router.query;

            if (!code || typeof code !== 'string') {
                setErrorMessage('缺少授权码');
                setStatus('error');
                return;
            }

            // 验证 state
            const savedState = sessionStorage.getItem('oauth_state');
            if (state && savedState && state !== savedState) {
                setErrorMessage('状态验证失败，可能存在 CSRF 攻击');
                setStatus('error');
                return;
            }

            try {
                const { token, user } = await exchangeCodeForToken(code, state as string);
                setAuth(token, user);
                setStatus('success');

                // 清除临时数据
                sessionStorage.removeItem('oauth_state');

                // 跳转到首页
                setTimeout(() => {
                    router.push('/');
                }, 1500);
            } catch (error) {
                const message = error instanceof Error ? error.message : '认证失败';
                setErrorMessage(message);
                setError(message);
                setStatus('error');
            }
        };

        // 等待 router ready
        if (router.isReady) {
            handleCallback();
        }
    }, [router, setAuth, setError]);

    return (
        <div className="min-h-screen flex flex-col">
            <Head>
                <title>认证回调 - ETF Autos</title>
            </Head>
            <Header activePage="valuation" />

            <main className="flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                    {status === 'loading' && (
                        <>
                            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
                            <h1 className="text-xl font-bold">正在处理登录...</h1>
                            <p className="text-muted-foreground mt-2">请稍候</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <Check className="w-8 h-8 text-green-600" />
                            </div>
                            <h1 className="text-xl font-bold text-green-600">登录成功！</h1>
                            <p className="text-muted-foreground mt-2">正在跳转到首页...</p>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <h1 className="text-xl font-bold text-red-500">登录失败</h1>
                            <p className="text-muted-foreground mt-2">{errorMessage}</p>
                            <button
                                onClick={() => router.push('/auth/login')}
                                className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                            >
                                重新登录
                            </button>
                        </>
                    )}
                </div>
            </main>

            <FooterDisclaimer />
        </div>
    );
}