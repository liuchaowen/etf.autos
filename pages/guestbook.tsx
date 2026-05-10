import React, { useEffect, useRef } from 'react';
import Head from 'next/head';
import { Header } from '@/components/header';
import { FooterDisclaimer } from '@/components/footer-disclaimer';
import { useTheme } from '@/lib/theme-context';

export default function GuestbookPage() {
    const { theme } = useTheme();
    const walineInstanceRef = useRef<any>(null);

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