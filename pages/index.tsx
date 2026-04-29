import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Head from 'next/head';
import { Header } from '@/components/header';
import { ChevronDownIcon } from '@/components/icons';
import { PriceChart } from '@/components/price-chart';
import { FooterDisclaimer } from '@/components/footer-disclaimer';
import { FundSearch } from '@/components/FundSearch';
import { fetchValuationData, ETF_LIST, formatPercent } from '@/lib/api';
import { FundItem, HistoryItem, ChartDataItem } from '@/types';

/**
 * ETF估值工具页面
 * 功能：
 * - 显示ETF列表供用户选择
 * - 选择ETF后显示该ETF的波动率和平均年化收益率
 * - 显示净值走势图
 */

// 时间范围选项
const TIME_RANGE_OPTIONS = [
  { label: '上市以来', value: 0 },
  { label: '近10年', value: 10 },
  { label: '近5年', value: 5 },
];

interface ValuationData {
  volatility: number;
  annualizedReturn: number;
  historyData: HistoryItem[];
}

export default function ValuationPage() {
  const [selectedCode, setSelectedCode] = useState<string>(ETF_LIST[0].fund_code);
  const [valuation, setValuation] = useState<ValuationData>({
    volatility: 0,
    annualizedReturn: 0,
    historyData: []
  });
  const [selectedYears, setSelectedYears] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载估值数据
  const loadValuationData = useCallback(async (code: string, years: number = 0) => {
    if (!code) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchValuationData(code, years);
      setValuation(data);
    } catch (err: any) {
      setError(err.message || '数据获取失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadValuationData(selectedCode, selectedYears);
  }, [selectedCode, selectedYears, loadValuationData]);

  // 为图表准备数据
  const chartData = useMemo((): ChartDataItem[] => {
    if (!valuation.historyData || valuation.historyData.length === 0) return [];

    const sortedData = [...valuation.historyData].sort((a, b) => a.x - b.x);

    return sortedData.map(item => {
      const date = new Date(item.x);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const time = `${year}-${month}-${day}`;

      return {
        time: time,
        value: item.y,
      };
    });
  }, [valuation.historyData]);

  const selectedFund = useMemo<FundItem | undefined>(
    () => ETF_LIST.find(item => item.fund_code === selectedCode),
    [selectedCode]
  );

  return (
    <>
      <Head>
        <title>估值 — ETF</title>
        <meta name="description" content="ETF估值工具，查看ETF波动率、年化收益率和历史走势" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>

      <div className="min-h-screen bg-white dark:bg-gray-900 font-airbnb transition-colors">
        {/* 顶部导航栏 */}
        <Header
          activePage="valuation"
          rightContent={
            <div className="flex items-center gap-3">
              {/* 搜索组件 */}
              <FundSearch
                onSelect={(fund) => setSelectedCode(fund.fund_code)}
                placeholder="搜索基金..."
              />
            </div>
          }
        />

        {/* 主内容区 */}
        <main className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {error && (
            <div className="mb-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 text-xs rounded">
              {error}
            </div>
          )}

          {/* 走势图 */}
          <div className="mb-4">
            <PriceChart
              chartData={chartData}
              selectedFund={selectedFund}
              selectedYears={selectedYears}
              onYearsChange={setSelectedYears}
              title={`${selectedFund?.name || 'ETF'} `}
              showLegend={true}
              height="400px"
              timeRangeOptions={TIME_RANGE_OPTIONS}
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-2 border-gray-200 dark:border-gray-700 border-t-blue-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">正在加载数据...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 估值指标卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 波动率卡片 */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">年化波动率</h3>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {selectedYears === 0 ? '上市以来' : `近${selectedYears}年`}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {valuation.volatility > 0 ? (valuation.volatility * 100).toFixed(2) : '--'}
                    </span>
                    <span className="text-lg text-gray-500 dark:text-gray-400">%</span>
                  </div>
                  <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                    波动率越高，价格波动越大，风险越高
                  </p>
                </div>

                {/* 年化收益率卡片 */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">年化收益率</h3>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {selectedYears === 0 ? '上市以来' : `近${selectedYears}年`}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-bold ${valuation.annualizedReturn >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {valuation.annualizedReturn !== 0 ? formatPercent(valuation.annualizedReturn) : '--'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                    年化收益率 = (1 + 总收益率)^(1/年数) - 1
                  </p>
                </div>
              </div>

              {/* 说明信息 */}
              <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">指标说明</h4>
                <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <li>• <strong>年化波动率</strong>：衡量价格波动的剧烈程度，计算方式为日收益率标准差 × √250</li>
                  <li>• <strong>年化收益率</strong>：将持有期收益率转换为年度收益率，便于不同周期比较</li>
                  <li>• 波动率较高的ETF适合网格交易策略，波动率较低的ETF适合长期持有</li>
                </ul>
              </div>
            </div>
          )}
        </main>

        {/* 底部免责声明 */}
        <FooterDisclaimer />
      </div>
    </>
  );
}