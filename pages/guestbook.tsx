import React, { useEffect } from 'react';
import Head from 'next/head';
import { Header } from '@/components/header';
import { FooterDisclaimer } from '@/components/footer-disclaimer';

export default function GuestbookPage() {
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
            init({
                el: '#waline',
                serverURL: 'https://waline.xlap.top',
            });
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
        };
    }, []);

    return (
        <>
            <Head>
                <title>留言 — ETF</title>
                <meta name="description" content="留言板 - 分享您的想法和建议" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            <div className="min-h-screen bg-white dark:bg-gray-900 font-airbnb transition-colors">
                {/* 顶部导航栏 */}
                <Header activePage="guestbook" />

                {/* 主内容区 */}
                <main className="mx-auto px-6 lg:px-8 py-12 max-w-3xl">
                    <article className="space-y-8">
                        {/* 标题区 */}
                        <section className="text-center py-8">
                            <h1 className="text-[28px] font-bold text-[#222222] dark:text-white mb-4">
                                留言板
                            </h1>
                            <p className="text-[16px] font-medium text-[#6a6a6a] dark:text-gray-400">
                                欢迎留下您的想法、建议或问题
                            </p>
                        </section>

                        {/* Waline 评论容器 */}
                        <section className="bg-white dark:bg-gray-800 rounded-[14px] border border-[#dddddd] dark:border-gray-700 p-6 transition-colors">
                            <div id="waline"></div>
                        </section>
                    </article>
                </main>

                {/* 底部免责声明 */}
                <FooterDisclaimer />
            </div>
        </>
    );
}