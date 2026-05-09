import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { ThemeProvider } from '@/lib/theme-context';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Toaster } from '@/components/ui/toaster';

export default function App({ Component, pageProps }: AppProps) {
    const router = useRouter();

    useEffect(() => {
        // 初始化 Waline 访问量统计
        const initWalinePageview = () => {
            const script = document.createElement('script');
            script.type = 'module';
            script.textContent = `
                import { pageviewCount } from 'https://unpkg.com/@waline/client@v3/dist/pageview.js';
                pageviewCount({
                    serverURL: 'https://waline.xlap.top',
                    path: window.location.pathname,
                });
            `;
            document.body.appendChild(script);
        };

        initWalinePageview();
    }, [router.pathname]);

    return (
        <ThemeProvider>
            <Component {...pageProps} />
            <Toaster />
        </ThemeProvider>
    );
}