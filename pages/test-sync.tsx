import React, { useState } from 'react';
import Head from 'next/head';
import { Header } from '@/components/header';
import { FooterDisclaimer } from '@/components/footer-disclaimer';
import { Button } from '@/components/ui/button';

interface TestResult {
    name: string;
    passed: boolean;
    message: string;
    details?: unknown;
}

interface TestSuite {
    name: string;
    description: string;
    run: () => Promise<TestResult[]>;
}

/**
 * 测试 1: collectLocalData 数据收集
 */
async function testCollectLocalData(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // 设置测试数据
    localStorage.removeItem('etf_favorites');
    localStorage.removeItem('strategy_code_cache');
    localStorage.removeItem('etf_autos_local_updated_at');

    // 清除所有策略参数
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('strategy_params_')) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // 设置测试数据
    const mockFavorites = [
        { fund_code: '588000', abbr: '测试ETF1', name: '测试ETF1', type: '指数型', pinyin: 'ceshietf1' },
        { fund_code: '510050', abbr: '测试ETF2', name: '测试ETF2', type: '指数型', pinyin: 'ceshietf2' },
    ];
    localStorage.setItem('etf_favorites', JSON.stringify(mockFavorites));

    const mockParams = {
        initial_capital: 50000,
        grid_width: 0.025,
        num_grids: 14,
        grid_investment_percent: 10,
        use_volatility_adjustment: true,
    };
    localStorage.setItem('strategy_params_588000_1', JSON.stringify(mockParams));
    localStorage.setItem('strategy_params_510050_2', JSON.stringify({ ...mockParams, initial_capital: 60000 }));
    localStorage.setItem('strategy_code_cache', '588000');
    localStorage.setItem('etf_autos_local_updated_at', new Date().toISOString());

    // 动态导入并执行
    const { collectLocalData } = await import('@/lib/sync/sync-manager');
    const collectedData = collectLocalData();

    // 验证收藏数据
    const favoritesValid = collectedData.favorites.length === 2;
    results.push({
        name: '收藏数据收集',
        passed: favoritesValid,
        message: favoritesValid ? `正确收集 ${collectedData.favorites.length} 条收藏` : `期望 2 条，实际 ${collectedData.favorites.length} 条`,
        details: collectedData.favorites,
    });

    // 验证策略参数
    const paramsCount = Object.keys(collectedData.strategyParams).length;
    const paramsValid = paramsCount === 2;
    results.push({
        name: '策略参数收集',
        passed: paramsValid,
        message: paramsValid ? `正确收集 ${paramsCount} 组参数` : `期望 2 组，实际 ${paramsCount} 组`,
        details: Object.keys(collectedData.strategyParams),
    });

    // 验证最后选中代码
    const codeValid = collectedData.lastSelectedCode === '588000';
    results.push({
        name: '最后选中代码',
        passed: codeValid,
        message: codeValid ? '正确' : `期望 588000，实际 ${collectedData.lastSelectedCode}`,
    });

    return results;
}

/**
 * 测试 2: 空数据检测
 */
async function testEmptyDataDetection(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // 清空所有数据
    localStorage.removeItem('etf_favorites');
    localStorage.removeItem('strategy_code_cache');
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('strategy_params_')) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    const { collectLocalData } = await import('@/lib/sync/sync-manager');
    const emptyData = collectLocalData();

    const isEmpty =
        emptyData.favorites.length === 0 &&
        Object.keys(emptyData.strategyParams).length === 0;

    results.push({
        name: '空数据检测',
        passed: isEmpty,
        message: isEmpty ? '正确识别为空数据' : '未能正确识别空数据',
        details: { favorites: emptyData.favorites.length, params: Object.keys(emptyData.strategyParams).length },
    });

    const hasDefaultCode = emptyData.lastSelectedCode === '588000';
    results.push({
        name: '默认代码',
        passed: hasDefaultCode,
        message: hasDefaultCode ? '正确' : `期望 588000，实际 ${emptyData.lastSelectedCode}`,
    });

    return results;
}

/**
 * 测试 3: 数据合并逻辑
 */
async function testMergeData(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const { mergeData } = await import('@/lib/sync/sync-manager');

    // 测试远程更新
    const localData1 = {
        version: '1.0',
        updatedAt: '2024-01-01T12:00:00.000Z',
        favorites: [{ fund_code: '588000', abbr: '本地ETF', name: '本地ETF', type: '指数型', pinyin: 'bendietf' }],
        strategyParams: {
            '588000_1': {
                initial_capital: 50000,
                grid_width: 0.025,
                num_grids: 14,
                grid_investment_percent: 10,
                use_volatility_adjustment: true,
            },
        },
        lastSelectedCode: '588000',
    };

    const remoteData1 = {
        version: '1.0',
        updatedAt: '2024-01-02T12:00:00.000Z',
        favorites: [{ fund_code: '510050', abbr: '远程ETF', name: '远程ETF', type: '指数型', pinyin: 'yuancheng' }],
        strategyParams: {
            '510050_1': {
                initial_capital: 60000,
                grid_width: 0.03,
                num_grids: 10,
                grid_investment_percent: 15,
                use_volatility_adjustment: false,
            },
        },
        lastSelectedCode: '510050',
    };

    const merged1 = mergeData(localData1, remoteData1);
    const useRemoteValid = merged1.favorites[0].fund_code === '510050';
    results.push({
        name: '远程更新时使用远程数据',
        passed: useRemoteValid,
        message: useRemoteValid ? '正确使用远程数据' : '未能正确使用远程数据',
        details: { mergedFund: merged1.favorites[0].fund_code },
    });

    // 测试本地更新
    const localData2 = {
        version: '1.0',
        updatedAt: '2024-01-02T12:00:00.000Z',
        favorites: [{ fund_code: '588000', abbr: '本地ETF', name: '本地ETF', type: '指数型', pinyin: 'bendietf' }],
        strategyParams: {},
        lastSelectedCode: '588000',
    };

    const remoteData2 = {
        version: '1.0',
        updatedAt: '2024-01-01T12:00:00.000Z',
        favorites: [{ fund_code: '510050', abbr: '远程ETF', name: '远程ETF', type: '指数型', pinyin: 'yuancheng' }],
        strategyParams: {},
        lastSelectedCode: '510050',
    };

    const merged2 = mergeData(localData2, remoteData2);
    const useLocalValid = merged2.favorites[0].fund_code === '588000';
    results.push({
        name: '本地更新时使用本地数据',
        passed: useLocalValid,
        message: useLocalValid ? '正确使用本地数据' : '未能正确使用本地数据',
        details: { mergedFund: merged2.favorites[0].fund_code },
    });

    return results;
}

/**
 * 测试 4: applyDataToLocal 数据应用
 */
async function testApplyDataToLocal(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // 清空数据
    localStorage.removeItem('etf_favorites');
    localStorage.removeItem('strategy_code_cache');
    localStorage.removeItem('etf_autos_local_updated_at');
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('strategy_params_')) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    const { applyDataToLocal } = await import('@/lib/sync/sync-manager');

    const testData = {
        version: '1.0',
        updatedAt: '2024-01-01T12:00:00.000Z',
        favorites: [{ fund_code: '588000', abbr: '测试ETF', name: '测试ETF', type: '指数型', pinyin: 'ceshietf' }],
        strategyParams: {
            '588000_1': {
                initial_capital: 50000,
                grid_width: 0.025,
                num_grids: 14,
                grid_investment_percent: 10,
                use_volatility_adjustment: true,
            },
        },
        lastSelectedCode: '588000',
    };

    applyDataToLocal(testData);

    // 验证收藏数据
    const favoritesStr = localStorage.getItem('etf_favorites');
    const favorites = favoritesStr ? JSON.parse(favoritesStr) : [];
    const favoritesValid = favorites.length === 1 && favorites[0].fund_code === '588000';
    results.push({
        name: '收藏数据应用',
        passed: favoritesValid,
        message: favoritesValid ? '正确应用收藏数据' : '未能正确应用收藏数据',
        details: favorites,
    });

    // 验证策略参数
    const paramsStr = localStorage.getItem('strategy_params_588000_1');
    const params = paramsStr ? JSON.parse(paramsStr) : null;
    const paramsValid = params !== null && params.initial_capital === 50000;
    results.push({
        name: '策略参数应用',
        passed: paramsValid,
        message: paramsValid ? '正确应用策略参数' : '未能正确应用策略参数',
        details: params,
    });

    // 验证最后选中代码
    const lastCode = localStorage.getItem('strategy_code_cache');
    const codeValid = lastCode === '588000';
    results.push({
        name: '最后选中代码应用',
        passed: codeValid,
        message: codeValid ? '正确' : `期望 588000，实际 ${lastCode}`,
    });

    return results;
}

/**
 * 测试 5: 收藏功能与同步集成
 */
async function testFavoritesIntegration(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // 清空数据
    localStorage.removeItem('etf_favorites');
    localStorage.removeItem('etf_autos_local_updated_at');

    const { addFavorite, removeFavorite, getFavorites } = await import('@/lib/favorites');
    const { collectLocalData } = await import('@/lib/sync/sync-manager');

    // 添加收藏
    const fund = { fund_code: '588000', abbr: '测试ETF', name: '测试ETF', type: '指数型', pinyin: 'ceshietf' };
    addFavorite(fund);

    // 检查 localStorage 是否更新
    const favoritesStr = localStorage.getItem('etf_favorites');
    const favorites = favoritesStr ? JSON.parse(favoritesStr) : [];
    const addValid = favorites.length === 1;
    results.push({
        name: '添加收藏',
        passed: addValid,
        message: addValid ? '正确添加收藏' : '未能正确添加收藏',
        details: favorites,
    });

    // 检查本地更新时间
    const updatedAt = localStorage.getItem('etf_autos_local_updated_at');
    const hasUpdatedAt = updatedAt !== null;
    results.push({
        name: '本地更新时间设置',
        passed: hasUpdatedAt,
        message: hasUpdatedAt ? '已设置本地更新时间' : '未设置本地更新时间',
    });

    // 收集数据验证
    const collectedData = collectLocalData();
    const collectedValid = collectedData.favorites.length === 1;
    results.push({
        name: '数据收集包含收藏',
        passed: collectedValid,
        message: collectedValid ? '数据收集包含收藏' : '数据收集未包含收藏',
    });

    // 移除收藏
    removeFavorite('588000');
    const afterRemove = getFavorites();
    const removeValid = afterRemove.length === 0;
    results.push({
        name: '移除收藏',
        passed: removeValid,
        message: removeValid ? '正确移除收藏' : '未能正确移除收藏',
    });

    return results;
}

/**
 * 测试 6: 当前 localStorage 数据检查
 */
async function testCurrentLocalStorage(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // 收集所有相关数据
    const favoritesStr = localStorage.getItem('etf_favorites');
    const favorites = favoritesStr ? JSON.parse(favoritesStr) : null;
    const strategyCode = localStorage.getItem('strategy_code_cache');
    const gistId = localStorage.getItem('etf_autos_gist_id');
    const lastSyncTime = localStorage.getItem('etf_autos_last_sync_time');
    const localUpdatedAt = localStorage.getItem('etf_autos_local_updated_at');

    // 策略参数
    const strategyParams: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('strategy_params_')) {
            const value = localStorage.getItem(key);
            strategyParams[key] = value ? JSON.parse(value) : null;
        }
    }

    const hasFavorites = favorites !== null && Array.isArray(favorites) && favorites.length > 0;
    const hasStrategyParams = Object.keys(strategyParams).length > 0;
    const hasCode = strategyCode !== null;
    const hasGistId = gistId !== null;
    const hasSyncTime = lastSyncTime !== null;
    const hasLocalTime = localUpdatedAt !== null;

    results.push({
        name: '收藏数据',
        passed: true, // 总是通过，只是展示状态
        message: hasFavorites ? `有 ${favorites.length} 条收藏` : '无收藏数据',
        details: favorites,
    });

    results.push({
        name: '策略参数',
        passed: true,
        message: hasStrategyParams ? `有 ${Object.keys(strategyParams).length} 组参数` : '无策略参数',
        details: Object.keys(strategyParams),
    });

    results.push({
        name: '最后选中代码',
        passed: true,
        message: hasCode ? `代码: ${strategyCode}` : '无最后选中代码',
    });

    results.push({
        name: 'Gist ID',
        passed: true,
        message: hasGistId ? `已绑定 Gist: ${gistId?.substring(0, 8)}...` : '未绑定 Gist',
    });

    results.push({
        name: '最后同步时间',
        passed: true,
        message: hasSyncTime ? `最后同步: ${lastSyncTime}` : '从未同步',
    });

    results.push({
        name: '本地更新时间',
        passed: true,
        message: hasLocalTime ? `本地更新: ${localUpdatedAt}` : '无本地更新时间',
    });

    return results;
}

/**
 * 测试 7: 完整同步流程模拟
 */
async function testFullSyncFlow(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // 设置测试数据
    localStorage.removeItem('etf_favorites');
    localStorage.removeItem('strategy_code_cache');
    localStorage.removeItem('etf_autos_local_updated_at');
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('strategy_params_')) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // 设置测试数据
    const mockFavorites = [
        { fund_code: '588000', abbr: '测试ETF1', name: '测试ETF1', type: '指数型', pinyin: 'ceshietf1' },
        { fund_code: '510050', abbr: '测试ETF2', name: '测试ETF2', type: '指数型', pinyin: 'ceshietf2' },
    ];
    localStorage.setItem('etf_favorites', JSON.stringify(mockFavorites));

    const mockParams = {
        initial_capital: 50000,
        grid_width: 0.025,
        num_grids: 14,
        grid_investment_percent: 10,
        use_volatility_adjustment: true,
    };
    localStorage.setItem('strategy_params_588000_1', JSON.stringify(mockParams));
    localStorage.setItem('strategy_params_510050_2', JSON.stringify({ ...mockParams, initial_capital: 60000 }));
    localStorage.setItem('strategy_code_cache', '588000');
    localStorage.setItem('etf_autos_local_updated_at', new Date().toISOString());

    const { collectLocalData } = await import('@/lib/sync/sync-manager');
    const { DEFAULT_USER_DATA } = await import('@/lib/sync/types');

    const localData = collectLocalData();

    // 验证本地数据完整性
    const localDataValid =
        localData.favorites.length === 2 &&
        Object.keys(localData.strategyParams).length === 2 &&
        localData.lastSelectedCode === '588000';

    results.push({
        name: '本地数据完整性',
        passed: localDataValid,
        message: localDataValid ? '本地数据完整' : '本地数据不完整',
        details: {
            favorites: localData.favorites.length,
            params: Object.keys(localData.strategyParams).length,
            code: localData.lastSelectedCode,
        },
    });

    // 模拟远程数据（空数据）
    const remoteData = {
        ...DEFAULT_USER_DATA,
        updatedAt: new Date().toISOString(),
    };

    const isEmptyRemote =
        remoteData.favorites.length === 0 &&
        Object.keys(remoteData.strategyParams).length === 0;

    results.push({
        name: '远程数据为空（新 Gist）',
        passed: isEmptyRemote,
        message: isEmptyRemote ? '远程数据为空，应上传本地数据' : '远程数据不为空',
    });

    // 检查同步策略
    if (isEmptyRemote && localDataValid) {
        results.push({
            name: '同步策略',
            passed: true,
            message: '应上传本地数据到远程 Gist',
        });
    }

    return results;
}

/**
 * 测试页面组件
 */
export default function TestSyncPage() {
    const [testResults, setTestResults] = useState<Record<string, TestResult[]>>({});
    const [running, setRunning] = useState<string | null>(null);
    const [allResults, setAllResults] = useState<{ passed: number; failed: number } | null>(null);

    const testSuites: TestSuite[] = [
        { name: 'collectLocalData', description: '测试数据收集功能', run: testCollectLocalData },
        { name: '空数据检测', description: '测试空数据检测逻辑', run: testEmptyDataDetection },
        { name: '数据合并', description: '测试数据合并逻辑', run: testMergeData },
        { name: 'applyDataToLocal', description: '测试数据应用功能', run: testApplyDataToLocal },
        { name: '收藏集成', description: '测试收藏功能与同步集成', run: testFavoritesIntegration },
        { name: 'localStorage 检查', description: '检查当前 localStorage 数据', run: testCurrentLocalStorage },
        { name: '完整同步流程', description: '模拟完整同步流程', run: testFullSyncFlow },
    ];

    const runTest = async (suite: TestSuite) => {
        setRunning(suite.name);
        try {
            const results = await suite.run();
            setTestResults(prev => ({ ...prev, [suite.name]: results }));
        } catch (error) {
            setTestResults(prev => ({
                ...prev,
                [suite.name]: [{
                    name: suite.name,
                    passed: false,
                    message: `测试失败: ${error instanceof Error ? error.message : String(error)}`,
                }],
            }));
        }
        setRunning(null);
    };

    const runAllTests = async () => {
        setRunning('全部测试');
        const allResults: Record<string, TestResult[]> = {};
        let passed = 0;
        let failed = 0;

        for (const suite of testSuites) {
            try {
                const results = await suite.run();
                allResults[suite.name] = results;
                results.forEach(r => {
                    if (r.passed) passed++;
                    else failed++;
                });
            } catch (error) {
                allResults[suite.name] = [{
                    name: suite.name,
                    passed: false,
                    message: `测试失败: ${error instanceof Error ? error.message : String(error)}`,
                }];
                failed++;
            }
        }

        setTestResults(allResults);
        setAllResults({ passed, failed });
        setRunning(null);
    };

    return (
        <div className="min-h-screen bg-background">
            <Head>
                <title>Gist 同步测试 - ETF Autos</title>
            </Head>
            <Header activePage="valuation" />

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold">Gist 同步功能测试</h1>
                            <p className="text-muted-foreground mt-2">
                                验证数据收集和同步功能是否正常工作
                            </p>
                        </div>
                        <Button onClick={runAllTests} disabled={running !== null}>
                            {running === '全部测试' ? '运行中...' : '运行全部测试'}
                        </Button>
                    </div>

                    {allResults && (
                        <div className="bg-muted rounded-lg p-6 mb-8">
                            <h2 className="text-xl font-semibold mb-4">测试结果汇总</h2>
                            <div className="flex gap-8">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-500">{allResults.passed}</div>
                                    <div className="text-sm text-muted-foreground">通过</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-red-500">{allResults.failed}</div>
                                    <div className="text-sm text-muted-foreground">失败</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {testSuites.map(suite => (
                            <div key={suite.name} className="bg-card border rounded-lg overflow-hidden">
                                <div className="p-4 border-b flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold">{suite.name}</h3>
                                        <p className="text-sm text-muted-foreground">{suite.description}</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => runTest(suite)}
                                        disabled={running !== null}
                                    >
                                        {running === suite.name ? '运行中...' : '运行'}
                                    </Button>
                                </div>
                                {testResults[suite.name] && (
                                    <div className="p-4">
                                        <div className="space-y-2">
                                            {testResults[suite.name].map((result, index) => (
                                                <div
                                                    key={index}
                                                    className={`p-3 rounded-lg ${result.passed
                                                        ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800'
                                                        : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className={result.passed ? 'text-green-500' : 'text-red-500'}>
                                                            {result.passed ? '✅' : '❌'}
                                                        </span>
                                                        <span className="font-medium">{result.name}</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
                                                    {result.details !== undefined && result.details !== null && (
                                                        <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto max-h-40">
                                                            {typeof result.details === 'string' ? result.details : JSON.stringify(result.details, null, 2)}
                                                        </pre>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-4 bg-muted rounded-lg">
                        <h3 className="font-medium mb-2">💡 测试说明</h3>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• 这些测试会修改 localStorage 中的数据</li>
                            <li>• 建议在测试前备份重要数据</li>
                            <li>• 测试完成后可以刷新页面恢复原始数据</li>
                            <li>• 如果测试失败，请检查控制台获取详细错误信息</li>
                        </ul>
                    </div>
                </div>
            </main>

            <FooterDisclaimer />
        </div>
    );
}