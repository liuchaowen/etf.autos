import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { Header } from '@/components/header';
import { FooterDisclaimer } from '@/components/footer-disclaimer';
import { useTheme } from '@/lib/theme-context';

export default function GuestbookPage() {
    const { theme } = useTheme();
    const walineInstanceRef = useRef<any>(null);
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error' | 'already'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    // 验证邮箱格式
    const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // 提交订阅
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            setErrorMessage('请输入邮箱地址');
            setSubmitStatus('error');
            return;
        }

        if (!isValidEmail(email)) {
            setErrorMessage('请输入有效的邮箱地址');
            setSubmitStatus('error');
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus('idle');
        setErrorMessage('');

        try {
            const response = await fetch('/api/subscribe/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.alreadyExists) {
                    setSubmitStatus('already');
                } else {
                    setSubmitStatus('success');
                }
                setEmail('');
            } else {
                setErrorMessage(data.error || '订阅失败，请稍后重试');
                setSubmitStatus('error');
            }
        } catch {
            setErrorMessage('网络错误，请稍后重试');
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        // 动态加载 Waline CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/@waline/client@v3/dist/waline.css';
        document.head.appendChild(link);

        // 动态加载 Waline JS 并初始化
        const script = document.createElement('script');
        script.type = 'module';
        script.textContent = `
            import { init } from 'https://unpkg.com/@waline/client@v3/dist/waline.js';
            const instance = init({
                el: '#waline',
                serverURL: 'https://waline.xlap.top',
                dark: 'html.dark',
            });
            window.walineInstance = instance;
        `;
        document.body.appendChild(script);

        return () => {
            // 清理 CSS
            if (link.parentNode) {
                link.parentNode.removeChild(link);
            }
            // 清理 script
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
            // 清理 Waline 实例
            if (window.walineInstance) {
                window.walineInstance.destroy?.();
                window.walineInstance = null;
            }
        };
    }, []);

    // 当主题变化时，更新 Waline 的暗色模式
    useEffect(() => {
        // Waline 使用 dark selector 'html.dark' 会自动响应主题变化
        // 但我们需要确保 Waline 重新计算样式
        const walineEl = document.getElementById('waline');
        if (walineEl) {
            // 触发重绘
            walineEl.classList.toggle('waline-theme-updated');
        }
    }, [theme]);

    return (
        <>
            <Head>
                <title>互动 — ETF</title>
                <meta name="description" content="留言/打赏 - 分享您的想法和建议" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            <div className="min-h-screen bg-white dark:bg-gray-900 font-airbnb transition-colors">
                {/* 顶部导航栏 */}
                <Header activePage="guestbook" />

                {/* 主内容区 */}
                <main className="mx-auto px-6 lg:px-8 py-4 max-w-3xl">
                    <article className="space-y-4">
                        {/* 标题区 */}
                        <section className="text-center py-2">
                            <h2 className="text-[20px] font-bold text-[#222222] dark:text-white mb-4">
                                订阅
                            </h2>
                            <p className="text-[14px] font-medium text-[#6a6a6a] dark:text-gray-400">
                                每日定时检测行情，推送买卖邮件通知。
                            </p>
                        </section>

                        {/* 提交邮箱地址 */}
                        <section className="bg-white dark:bg-gray-800 rounded-[14px] border border-[#dddddd] dark:border-gray-700 p-6 transition-colors">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="请输入您的邮箱地址"
                                        className="flex-1 px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white transition-colors"
                                        disabled={isSubmitting}
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="py-0 px-2 text-sm bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-200 text-white dark:text-gray-900  rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                    >
                                        {isSubmitting ? '提交中...' : '订阅'}
                                    </button>
                                </div>

                                {/* 状态提示 */}
                                {submitStatus === 'success' && (
                                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-[14px]">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>订阅成功！每个工作日将收到ETF买卖信号邮件通知。</span>
                                    </div>
                                )}

                                {submitStatus === 'already' && (
                                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-[14px]">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>该邮箱已订阅，无需重复订阅。</span>
                                    </div>
                                )}

                                {submitStatus === 'error' && (
                                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-[14px]">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{errorMessage}</span>
                                    </div>
                                )}
                            </form>
                        </section>

                        {/* 标题区 */}
                        <section className="text-center py-2">
                            <h2 className="text-[20px] font-bold text-[#222222] dark:text-white mb-4">
                                留言
                            </h2>
                            <p className="text-[14px] font-medium text-[#6a6a6a] dark:text-gray-400">
                                欢迎留下您的想法、建议或问题
                            </p>
                        </section>

                        {/* Waline 评论容器 */}
                        <section className="bg-white dark:bg-gray-800 rounded-[14px] border border-[#dddddd] dark:border-gray-700 p-6 transition-colors">
                            <div id="waline"></div>
                        </section>

                        {/* 标题区 */}
                        <section className="text-center py-2">
                            <h2 className="text-[20px] font-bold text-[#222222] dark:text-white mb-4">
                                打赏
                            </h2>
                            <p className="text-[14px] font-medium text-[#6a6a6a] dark:text-gray-400">
                                如果觉得内容有帮助，欢迎打赏支持
                            </p>
                        </section>

                        {/* 打赏区域 */}
                        <section className="bg-white dark:bg-gray-800 rounded-[14px] border border-[#dddddd] dark:border-gray-700 p-6 transition-colors">
                            <div className="text-center">

                                <div className="flex justify-center">
                                    <div className="relative">
                                        {/* 浅色模式二维码 */}
                                        <img
                                            src="/image/ds_qrcode_light.jpg"
                                            alt="打赏二维码"
                                            className="w-80 h-80 rounded-[12px] shadow-sm block dark:hidden"
                                        />
                                        {/* 深色模式二维码 */}
                                        <img
                                            src="/image/ds_qrcode_dark.jpg"
                                            alt="打赏二维码"
                                            className="w-80 h-80 rounded-[12px] shadow-sm hidden dark:block"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>
                    </article>
                </main>
                {/* 底部免责声明 */}
                <FooterDisclaimer path="/guestbook" />
            </div>
        </>
    );
}