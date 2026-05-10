/**
 * GitHub Device Flow 登录页面
 */

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ExternalLink, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';
import { initiateDeviceFlow, pollForToken, fetchGitHubUser } from '@/lib/auth/device-flow';
import { useAuthInternal, isGitHubConfigured, getGitHubClientId } from '@/lib/auth/use-auth';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { FooterDisclaimer } from '@/components/footer-disclaimer';

// GitHub SVG Icon
function GitHubIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
    );
}

// 登录状态
type LoginState = 'init' | 'waiting' | 'success' | 'error';

export default function LoginPage() {
    const router = useRouter();
    const { setAuth, setError, setLoading } = useAuthInternal();

    // 状态
    const [loginState, setLoginState] = useState<LoginState>('init');
    const [userCode, setUserCode] = useState<string>('');
    const [verificationUri, setVerificationUri] = useState<string>('');
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [pollingAborted, setPollingAborted] = useState(false);

    // 检查配置
    const isConfigured = isGitHubConfigured();
    const clientId = getGitHubClientId();

    // 开始登录流程
    const startLogin = useCallback(async () => {
        if (!isConfigured) {
            setErrorMessage('GitHub Client ID 未配置，请联系管理员');
            setLoginState('error');
            return;
        }

        setLoginState('waiting');
        setLoading(true);
        setErrorMessage('');
        setPollingAborted(false);

        try {
            // 1. 获取设备码
            const deviceResponse = await initiateDeviceFlow();
            setUserCode(deviceResponse.user_code);
            setVerificationUri(deviceResponse.verification_uri);
            setStatusMessage('请在 GitHub 页面输入验证码');

            // 2. 开始轮询
            const token = await pollForToken(
                deviceResponse.device_code,
                deviceResponse.interval,
                (status, message) => {
                    if (pollingAborted) return;
                    setStatusMessage(message || '');
                    if (status === 'error') {
                        setErrorMessage(message || '授权失败');
                        setLoginState('error');
                    }
                }
            );

            // 3. 获取用户信息
            const user = await fetchGitHubUser(token);

            // 4. 设置认证状态
            setAuth(token, user);
            setLoginState('success');
            setLoading(false);

            // 5. 跳转到首页
            setTimeout(() => {
                router.push('/');
            }, 1500);

        } catch (error) {
            if (pollingAborted) return;

            const message = error instanceof Error ? error.message : '登录失败';
            setErrorMessage(message);
            setLoginState('error');
            setLoading(false);
        }
    }, [isConfigured, setAuth, setError, setLoading, router, pollingAborted]);

    // 取消登录
    const cancelLogin = useCallback(() => {
        setPollingAborted(true);
        setLoginState('init');
        setLoading(false);
        setUserCode('');
        setVerificationUri('');
        setStatusMessage('');
        setErrorMessage('');
    }, [setLoading]);

    // 复制验证码
    const copyUserCode = useCallback(async () => {
        if (!userCode) return;

        try {
            await navigator.clipboard.writeText(userCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // 复制失败，可以手动复制
        }
    }, [userCode]);

    // 打开验证页面
    const openVerificationPage = useCallback(() => {
        if (!verificationUri) return;
        window.open(verificationUri, '_blank', 'noopener,noreferrer');
    }, [verificationUri]);

    // 未配置时显示错误
    if (!isConfigured) {
        return (
            <div className="min-h-screen flex flex-col">
                <Head>
                    <title>登录 - ETF Autos</title>
                </Head>
                <Header activePage="valuation" />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center p-8">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h1 className="text-xl font-bold mb-2">登录功能未配置</h1>
                        <p className="text-muted-foreground mb-4">
                            请设置 NEXT_PUBLIC_GITHUB_CLIENT_ID 环境变量
                        </p>
                        <Button onClick={() => router.push('/')}>
                            返回首页
                        </Button>
                    </div>
                </main>
                <FooterDisclaimer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Head>
                <title>GitHub 登录 - ETF Autos</title>
                <meta name="description" content="使用 GitHub 账号登录 ETF Autos，同步您的收藏和策略参数" />
            </Head>
            <Header activePage="valuation" />

            <main className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* 登录卡片 */}
                    <div className="bg-card border rounded-xl p-6 shadow-lg">
                        {/* 标题 */}
                        <div className="text-center mb-6">
                            <GitHubIcon className="w-12 h-12 mx-auto mb-4" />
                            <h1 className="text-xl font-bold">GitHub 登录</h1>
                            <p className="text-sm text-muted-foreground mt-2">
                                登录后可同步收藏列表和策略参数到云端
                            </p>
                        </div>

                        {/* 初始状态：显示登录按钮 */}
                        {loginState === 'init' && (
                            <div className="space-y-4">
                                <Button
                                    onClick={startLogin}
                                    className="w-full"
                                    size="lg"
                                >
                                    <GitHubIcon className="w-5 h-5 mr-2" />
                                    开始登录
                                </Button>

                                <p className="text-xs text-center text-muted-foreground">
                                    点击后将显示验证码，请在 GitHub 页面输入
                                </p>
                            </div>
                        )}

                        {/* 等待状态：显示验证码 */}
                        {loginState === 'waiting' && (
                            <div className="space-y-4">
                                {/* 验证码显示 */}
                                <div className="bg-muted rounded-lg p-4 text-center">
                                    <p className="text-sm text-muted-foreground mb-2">
                                        请在浏览器中打开以下页面并输入验证码：
                                    </p>
                                    <a
                                        href={verificationUri}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 hover:underline flex items-center justify-center gap-1"
                                    >
                                        {verificationUri}
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>

                                {/* 验证码 */}
                                <div className="bg-primary/10 rounded-lg p-4 text-center">
                                    <p className="text-sm text-muted-foreground mb-2">验证码：</p>
                                    <p className="text-2xl font-mono font-bold tracking-wider">
                                        {userCode}
                                    </p>
                                </div>

                                {/* 操作按钮 */}
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={copyUserCode}
                                        className="flex-1"
                                    >
                                        {copied ? (
                                            <Check className="w-4 h-4 mr-2" />
                                        ) : (
                                            <Copy className="w-4 h-4 mr-2" />
                                        )}
                                        {copied ? '已复制' : '复制验证码'}
                                    </Button>
                                    <Button
                                        onClick={openVerificationPage}
                                        className="flex-1"
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        打开授权页面
                                    </Button>
                                </div>

                                {/* 状态消息 */}
                                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {statusMessage}
                                </div>

                                {/* 取消按钮 */}
                                <Button
                                    variant="ghost"
                                    onClick={cancelLogin}
                                    className="w-full"
                                >
                                    取消
                                </Button>
                            </div>
                        )}

                        {/* 成功状态 */}
                        {loginState === 'success' && (
                            <div className="text-center space-y-4">
                                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                                    <Check className="w-8 h-8 text-green-600" />
                                </div>
                                <h2 className="text-lg font-bold text-green-600">登录成功！</h2>
                                <p className="text-sm text-muted-foreground">
                                    正在跳转到首页...
                                </p>
                            </div>
                        )}

                        {/* 错误状态 */}
                        {loginState === 'error' && (
                            <div className="space-y-4">
                                <div className="text-center">
                                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                                    <h2 className="text-lg font-bold text-red-500">登录失败</h2>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        {errorMessage}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => router.push('/')}
                                        className="flex-1"
                                    >
                                        返回首页
                                    </Button>
                                    <Button
                                        onClick={startLogin}
                                        className="flex-1"
                                    >
                                        重试
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 说明 */}
                    <div className="mt-4 text-center text-xs text-muted-foreground">
                        <p>
                            我们只请求 <code className="bg-muted px-1 rounded">gist</code> 权限，
                            用于在您的私有 Gist 中存储数据
                        </p>
                        <p className="mt-1">
                            数据完全由您掌控，可随时在 GitHub 中查看或删除
                        </p>
                    </div>
                </div>
            </main>

            <FooterDisclaimer />
        </div>
    );
}