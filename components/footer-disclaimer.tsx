import React, { useEffect } from 'react';

interface FooterDisclaimerProps {
    /**
     * 顶部内边距大小
     * - 'sm': pt-4 (适用于紧凑布局)
     * - 'md': pt-8 (适用于宽松布局)
     * @default 'sm'
     */
    padding?: 'sm' | 'md';
}

/**
 * 页脚声明组件
 * 显示数据来源和免责声明
 */
export function FooterDisclaimer({ padding = 'sm' }: FooterDisclaimerProps) {
    const paddingClass = padding === 'md' ? 'pt-8' : 'pt-4';

    return (
        <div className={`text-center text-[12px] font-medium text-[#6a6a6a] dark:text-gray-500 ${paddingClass} leading-[1.33]`}>
            数据来源:天天基金 · 策略回测仅供学习研究，不构成投资建议 · 访问量 <span className="waline-pageview-count ml-1" data-path="/" />
        </div>
    );
}