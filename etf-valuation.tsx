import React, { useEffect, useState } from 'react';

/**
 * ETF估值工具页面
 * 功能：
 * - 显示ETF列表供用户选择
 * - 选择ETF后显示该ETF的波动率和平均年化收益率
 * 
 * 说明：
 * 本页面UI结构简单，方便后续结合后端数据接口完善逻辑
 */

const ETF_LIST = [
    { symbol: '588000', name: '科创50' },
    { symbol: '510300', name: '沪深300' },
    { symbol: '159919', name: '中证500' },
];

interface ValuationData {
    volatility: number | null;
    annualizedReturn: number | null;
}

export default function EtfValuation() {
    const [selectedSymbol, setSelectedSymbol] = useState<string>(ETF_LIST[0].symbol);
    const [valuation, setValuation] = useState<ValuationData>({ volatility: null, annualizedReturn: null });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 模拟异步获取ETF估值数据，后续通过API接口替换此函数实现
    async function fetchValuation(symbol: string): Promise<ValuationData> {
        setError(null);
        setLoading(true);
        try {
            // TODO: 调用后端接口获取ETF数据，计算波动率和年化收益率
            // 这里模拟延时并返回假数据
            await new Promise(resolve => setTimeout(resolve, 800));
            if (symbol === '588000') {
                return { volatility: 0.25, annualizedReturn: 0.12 };
            } else if (symbol === '510300') {
                return { volatility: 0.18, annualizedReturn: 0.08 };
            } else if (symbol === '159919') {
                return { volatility: 0.22, annualizedReturn: 0.10 };
            }
            return { volatility: 0.2, annualizedReturn: 0.09 };
        } catch (e) {
            setError('数据获取失败');
            return { volatility: null, annualizedReturn: null };
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchValuation(selectedSymbol).then(setValuation);
    }, [selectedSymbol]);

    return (
        <main style={{ padding: 24, fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
            <h1>ETF估值工具</h1>
            <div style={{ marginBottom: 16 }}>
                <label htmlFor="etf-select" style={{ marginRight: 8, fontWeight: 'bold' }}>选择ETF：</label>
                <select
                    id="etf-select"
                    value={selectedSymbol}
                    onChange={e => setSelectedSymbol(e.target.value)}
                    style={{ padding: '4px 8px', fontSize: 16 }}
                >
                    {ETF_LIST.map(etf => (
                        <option key={etf.symbol} value={etf.symbol}>
                            {etf.name} ({etf.symbol})
                        </option>
                    ))}
                </select>
            </div>

            <section style={{
                border: '1px solid #ccc',
                borderRadius: 8,
                padding: 16,
                maxWidth: 400,
            }}>
                <h2>估值结果</h2>
                {loading ? (
                    <p>加载中...</p>
                ) : error ? (
                    <p style={{ color: 'red' }}>{error}</p>
                ) : (
                    <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                        <li><strong>平台波动率：</strong> {valuation.volatility !== null ? (valuation.volatility * 100).toFixed(2) + '%' : '--'}</li>
                        <li><strong>平均年化率：</strong> {valuation.annualizedReturn !== null ? (valuation.annualizedReturn * 100).toFixed(2) + '%' : '--'}</li>
                    </ul>
                )}
            </section>
        </main>
    );
}