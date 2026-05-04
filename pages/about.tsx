import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Header } from '@/components/header';
import { FooterDisclaimer } from '@/components/footer-disclaimer';

export default function AboutPage() {
    return (
        <>
            <Head>
                <title>关于 — ETF</title>
                <meta name="description" content="了解网格交易策略的核心逻辑和用时间换空间的投资理念" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            <div className="min-h-screen bg-white dark:bg-gray-900 font-airbnb transition-colors">
                {/* 顶部导航栏 */}
                <Header activePage="about" />

                {/* 主内容区 */}
                <main className="mx-auto px-6 lg:px-8 py-4 max-w-3xl">
                    <article className="space-y-8">
                        {/* 标题区 - Section Heading 28px 700 */}
                        <section className="text-center py-8">
                            <p className="text-[18px] font-normal leading-[1.18]">
                                用时间换空间，让波动成为收益
                            </p>
                        </section>

                        {/* 核心理念卡片 - 14px radius */}
                        <section className="bg-white dark:bg-gray-800 rounded-[14px] border border-[#dddddd] dark:border-gray-700 p-6 transition-colors">
                            <h3 className="text-[14px] font-normal text-[#222222] dark:text-white mb-4 flex items-center gap-3">
                                核心理念
                            </h3>
                            <div className="text-[#222222] dark:text-gray-300 space-y-4 text-[14px] font-normal leading-[1.25]">
                                <p>
                                    网格交易是一种<strong className="text-[#222222] dark:text-white font-normal">被动式、规则化</strong>的投资策略。它不预测市场涨跌，而是利用市场的波动性，在价格下跌时分批买入，在价格上涨时分批卖出。
                                </p>
                                <div className="bg-[#f7f7f7] dark:bg-gray-700/50 rounded-[8px] p-5 text-center">
                                    <p className="text-[#222222] dark:text-gray-200 font-normal">
                                        "用时间换空间"—— 给策略足够的时间运行，让市场的自然波动为你创造收益。
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 策略逻辑卡片 */}
                        <section className="bg-white dark:bg-gray-800 rounded-[14px] border border-[#dddddd] dark:border-gray-700 p-6 transition-colors">
                            <h3 className="text-[14px] font-normal text-[#222222] dark:text-white mb-4 flex items-center gap-3">
                                策略逻辑
                            </h3>
                            <div className="space-y-5">
                                {/* 步骤1 */}
                                <div className="flex gap-4 items-start">
                                    <div className="flex-shrink-0 w-8 h-8 bg-[#f7f7f7] dark:bg-gray-700 rounded-[50%] flex items-center justify-center text-[#222222] dark:text-gray-300 font-normal text-[14px]">1</div>
                                    <div className="flex-1">
                                        <p className="text-[14px] font-normal text-[#222222] dark:text-white mb-1">设定网格</p>
                                        <p className="text-[14px] font-normal text-[#6a6a6a] dark:text-gray-400 leading-[1.25]">以基准价格为中心，按一定间距（网格宽度）向上设置卖出网格，向下设置买入网格。</p>
                                    </div>
                                </div>

                                {/* 步骤2 */}
                                <div className="flex gap-4 items-start">
                                    <div className="flex-shrink-0 w-8 h-8 bg-[#f7f7f7] dark:bg-gray-700 rounded-[50%] flex items-center justify-center text-[#222222] dark:text-gray-300 font-normal text-[14px]">2</div>
                                    <div className="flex-1">
                                        <p className="text-[14px] font-normal text-[#222222] dark:text-white mb-1">触发交易</p>
                                        <p className="text-[14px] font-normal text-[#6a6a6a] dark:text-gray-400 leading-[1.25]">当价格下跌触及买入网格时，自动买入；当价格上涨触及卖出网格时，自动卖出。</p>
                                    </div>
                                </div>

                                {/* 步骤3 */}
                                <div className="flex gap-4 items-start">
                                    <div className="flex-shrink-0 w-8 h-8 bg-[#f7f7f7] dark:bg-gray-700 rounded-[50%] flex items-center justify-center text-[#222222] dark:text-gray-300 font-normal text-[14px]">3</div>
                                    <div className="flex-1">
                                        <p className="text-[14px] font-normal text-[#222222] dark:text-white mb-1">循环往复</p>
                                        <p className="text-[14px] font-normal text-[#6a6a6a] dark:text-gray-400 leading-[1.25]">买卖完成后，等待下一次价格波动触发交易，持续运行，积少成多。</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 图解说明卡片 */}
                        <section className="bg-white dark:bg-gray-800 rounded-[14px] border border-[#dddddd] dark:border-gray-700 p-6 transition-colors">
                            <h3 className="text-[14px] font-normal text-[#222222] dark:text-white mb-4 flex items-center gap-3">
                                简单图解
                            </h3>
                            <div className="bg-[#f7f7f7] dark:bg-gray-700/50 rounded-[14px] p-6 text-center">
                                <div className="inline-block text-left space-y-3">
                                    <div className="flex items-center gap-4 text-[#222222] dark:text-gray-200">
                                        <span className="w-20 text-right text-[14px] font-normal">卖出 ↑</span>
                                        <span className="font-mono text-[14px]">┌───┬───┬───┬───┐ 价格上涨</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-[#6a6a6a] dark:text-gray-400">
                                        <span className="w-20 text-right text-[14px] font-normal">基准价</span>
                                        <span className="font-mono text-[14px]">├───┼───┼───┼───┤</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-[#222222] dark:text-gray-200">
                                        <span className="w-20 text-right text-[14px] font-normal">买入 ↓</span>
                                        <span className="font-mono text-[14px]">└───┴───┴───┴───┘ 价格下跌</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-[12px] font-normal text-[#6a6a6a] dark:text-gray-500 mt-4 text-center leading-[1.33]">
                                价格在网格间波动时，自动低买高卖
                            </p>
                        </section>

                        {/* 为什么有效卡片 */}
                        <section className="bg-white dark:bg-gray-800 rounded-[14px] border border-[#dddddd] dark:border-gray-700 p-6 transition-colors">
                            <h3 className="text-[14px] font-normal text-[#222222] dark:text-white mb-4 flex items-center gap-3">
                                为什么"用时间换空间"有效？
                            </h3>
                            <div className="text-[#222222] dark:text-gray-300 space-y-4 text-[14px] font-normal leading-[1.25]">
                                <p>
                                    <strong className="text-[#222222] dark:text-white font-normal">市场大部分时间都在震荡。</strong>
                                    <span className="text-[#6a6a6a] dark:text-gray-400">统计显示，A股市场约70%的时间处于震荡状态，只有30%的时间是单边趋势。</span>
                                </p>
                                <p>
                                    <strong className="text-[#222222] dark:text-white font-normal">网格策略天生适合震荡市。</strong>
                                    <span className="text-[#6a6a6a] dark:text-gray-400">在震荡行情中，价格反复上下穿越网格线，策略不断低买高卖，积累收益。</span>
                                </p>
                                <p>
                                    <strong className="text-[#222222] dark:text-white font-normal">时间越长，效果越好。</strong>
                                    <span className="text-[#6a6a6a] dark:text-gray-400">给策略足够的运行时间，让更多的波动转化为交易机会，用时间的累积换取收益空间的增长。</span>
                                </p>
                            </div>
                        </section>

                        {/* 适用场景卡片 */}
                        <section className="bg-white dark:bg-gray-800 rounded-[14px] border border-[#dddddd] dark:border-gray-700 p-6 transition-colors">
                            <h3 className="text-[14px] font-normal text-[#222222] dark:text-white mb-4 flex items-center gap-3">
                                适用场景
                            </h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                    <span className="text-[#222222] dark:text-gray-300 text-[14px]">✓</span>
                                    <span className="text-[14px] font-normal text-[#6a6a6a] dark:text-gray-400">震荡行情中的ETF、指数基金</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-[#222222] dark:text-gray-300 text-[14px]">✓</span>
                                    <span className="text-[14px] font-normal text-[#6a6a6a] dark:text-gray-400">有长期持有意愿的标的</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-[#222222] dark:text-gray-300 text-[14px]">✓</span>
                                    <span className="text-[14px] font-normal text-[#6a6a6a] dark:text-gray-400">希望降低持仓成本的投资者</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-[#222222] dark:text-gray-300 text-[14px]">✓</span>
                                    <span className="text-[14px] font-normal text-[#6a6a6a] dark:text-gray-400">追求稳健收益的长期投资者</span>
                                </div>
                            </div>
                        </section>

                        {/* 风险提示卡片 */}
                        <section className="bg-white dark:bg-gray-800 rounded-[14px] border border-[#c13515] dark:border-red-800 p-6 transition-colors">
                            <h3 className="text-[14px] font-normal text-[#c13515] dark:text-red-400 mb-3 flex items-center gap-3">
                                风险提示
                            </h3>
                            <ul className="text-[#c13515] dark:text-red-400 space-y-3 text-[14px] font-normal leading-[1.25]">
                                <li>• 单边下跌行情中，策略会持续买入，需要准备充足资金</li>
                                <li>• 单边上涨行情中，可能过早卖出，错过后续涨幅</li>
                                <li>• 策略回测仅供学习研究，不构成投资建议</li>
                                <li>• 投资有风险，入市需谨慎</li>
                            </ul>
                        </section>
                    </article>

                    {/* 底部免责声明 */}
                    <FooterDisclaimer path="/about" />
                </main>
            </div>
        </>
    );
}