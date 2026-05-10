/**
 * GitHub OAuth 登录页面
 * 标准 OAuth 流程，适用于 Vercel 部署
 */

import React, { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ExternalLink } from 'lucide-react';
import { getLoginUrl, isGitHubConfigured } from '@/lib/auth/oauth';
import { useAuth } from '@/lib/auth/use-auth';
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

export default function LoginPage() {
    const router = useRouter();
    const { isLoggedIn, isLoading } = useAuth();

    // 已登录则跳转到首页
    useEffect(() => {
        if (isLoggedIn && !isLoading) {
            router.push('/');
        }
    }, [isLoggedIn, isLoading, router]);

    // 未配置 GitHub OAuth
    if (!isGitHubConfigured()) {
        return (
            <div className="min-h-screen flex flex-col">
                <Head>
                    <title>登录 - ETF Autos</title>
                </Head>
                <Header activePage="valuation" />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center p-8">
                        <p className="text-muted-foreground mb-4">
                            GitHub OAuth 未配置，请设置环境变量
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

    // 加载中或已登录
    if (isLoading || isLoggedIn) {
        return (
            <div className="min-h-screen flex flex-col">
                <Head>
                    <title>登录 - ETF Autos</title>
                </Head>
                <Header activePage="valuation" />
                <main className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground">加载中...</p>
                </main>
                <FooterDisclaimer />
            </div>
        );
    }

    // 开始登录
    const handleLogin = () => {
        // 回调 URL
        const redirectUri = `${window.location.origin}/auth/callback`;
        const loginUrl = getLoginUrl(redirectUri);
        window.location.href = loginUrl;
    };

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

                        {/* 登录按钮 */}
                        <Button
                            onClick={handleLogin}
                            className="w-full"
                            size="lg"
                        >
                            <GitHubIcon className="w-5 h-5 mr-2" />
                            使用 GitHub 登录
                        </Button>

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

                    {/* 部署说明 */}
                    <div className="mt-4 text-center text-xs text-muted-foreground">
                        <p>
                            本项目部署在 Vercel，使用标准 OAuth 流程
                            <ExternalLink className="w-3 h-3 inline ml-1" />
                        </p>
                    </div>
                </div>
            </main>

            <FooterDisclaimer />
        </div>
    );
}