/**
 * 浏览器端 Gist 同步测试
 * 在浏览器控制台中运行此测试来验证数据收集功能
 */

import { collectLocalData, applyDataToLocal, mergeData } from '../lib/sync/sync-manager';
import { UserData, DEFAULT_USER_DATA } from '../lib/sync/types';
import { getFavorites, saveFavorites, addFavorite, removeFavorite } from '../lib/favorites';

/**
 * 测试结果接口
 */
interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: unknown;
}

/**
 * 测试套件
 */
const testResults: TestResult[] = [];

/**
 * 添加测试结果
 */
function addResult(name: string, passed: boolean, message: string, details?: unknown) {
  testResults.push({ name, passed, message, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
  if (details) {
    console.log('   详情:', details);
  }
}

/**
 * 清理测试数据
 */
function clearTestData() {
  localStorage.removeItem('etf_favorites');
  localStorage.removeItem('strategy_code_cache');
  localStorage.removeItem('etf_autos_local_updated_at');
  localStorage.removeItem('etf_autos_gist_id');
  localStorage.removeItem('etf_autos_last_sync_time');
  
  // 清除所有策略参数
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('strategy_params_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  console.log('🧹 测试数据已清理');
}

/**
 * 设置测试数据
 */
function setupTestData() {
  clearTestData();
  
  // 模拟收藏数据
  const mockFavorites = [
    { fund_code: '588000', fund_name: '测试ETF1', fund_type: '指数型' },
    { fund_code: '510050', fund_name: '测试ETF2', fund_type: '指数型' },
  ];
  localStorage.setItem('etf_favorites', JSON.stringify(mockFavorites));
  
  // 模拟策略参数
  const mockParams = {
    initial_capital: 50000,
    grid_width: 0.025,
    num_grids: 14,
    grid_investment_percent: 10,
    use_volatility_adjustment: true,
  };
  localStorage.setItem('strategy_params_588000_1', JSON.stringify(mockParams));
  localStorage.setItem('strategy_params_510050_2', JSON.stringify({
    ...mockParams,
    initial_capital: 60000,
  }));
  
  // 模拟最后选中的代码
  localStorage.setItem('strategy_code_cache', '588000');
  
  // 模拟本地更新时间
  localStorage.setItem('etf_autos_local_updated_at', new Date().toISOString());
  
  console.log('📦 测试数据已设置');
  console.log('   - 收藏数据:', mockFavorites.length, '条');
  console.log('   - 策略参数: 2 组');
  console.log('   - 最后选中代码: 588000');
}

/**
 * 测试 1: 验证 collectLocalData 是否正确收集数据
 */
function testCollectLocalData() {
  console.log('\n📋 测试 1: collectLocalData 数据收集');
  console.log('='.repeat(50));
  
  setupTestData();
  
  const collectedData = collectLocalData();
  
  console.log('\n收集到的数据:');
  console.log(JSON.stringify(collectedData, null, 2));
  
  // 验证收藏数据
  const favoritesValid = collectedData.favorites.length === 2;
  addResult(
    'collectLocalData - 收藏数据',
    favoritesValid,
    favoritesValid ? `正确收集 ${collectedData.favorites.length} 条收藏` : `期望 2 条，实际 ${collectedData.favorites.length} 条`,
    collectedData.favorites
  );
  
  // 验证策略参数
  const paramsCount = Object.keys(collectedData.strategyParams).length;
  const paramsValid = paramsCount === 2;
  addResult(
    'collectLocalData - 策略参数',
    paramsValid,
    paramsValid ? `正确收集 ${paramsCount} 组参数` : `期望 2 组，实际 ${paramsCount} 组`,
    Object.keys(collectedData.strategyParams)
  );
  
  // 验证最后选中代码
  const codeValid = collectedData.lastSelectedCode === '588000';
  addResult(
    'collectLocalData - 最后选中代码',
    codeValid,
    codeValid ? '正确' : `期望 588000，实际 ${collectedData.lastSelectedCode}`
  );
  
  // 验证版本号
  const versionValid = collectedData.version === '1.0';
  addResult(
    'collectLocalData - 版本号',
    versionValid,
    versionValid ? '正确' : `期望 1.0，实际 ${collectedData.version}`
  );
  
  return favoritesValid && paramsValid && codeValid && versionValid;
}

/**
 * 测试 2: 验证空数据检测
 */
function testEmptyDataDetection() {
  console.log('\n📋 测试 2: 空数据检测');
  console.log('='.repeat(50));
  
  clearTestData();
  
  const emptyData = collectLocalData();
  
  console.log('\n空数据:');
  console.log(JSON.stringify(emptyData, null, 2));
  
  const isEmpty = 
    emptyData.favorites.length === 0 &&
    Object.keys(emptyData.strategyParams).length === 0;
  
  addResult(
    '空数据检测',
    isEmpty,
    isEmpty ? '正确识别为空数据' : '未能正确识别空数据',
    { favorites: emptyData.favorites.length, params: Object.keys(emptyData.strategyParams).length }
  );
  
  // 验证默认值
  const hasDefaultCode = emptyData.lastSelectedCode === '588000';
  addResult(
    '空数据默认代码',
    hasDefaultCode,
    hasDefaultCode ? '正确' : `期望 588000，实际 ${emptyData.lastSelectedCode}`
  );
  
  return isEmpty && hasDefaultCode;
}

/**
 * 测试 3: 验证数据合并逻辑 - 远程更新
 */
function testMergeDataRemoteNewer() {
  console.log('\n📋 测试 3: 数据合并 - 远程更新');
  console.log('='.repeat(50));
  
  const localData: UserData = {
    version: '1.0',
    updatedAt: '2024-01-01T12:00:00.000Z',
    favorites: [
      { fund_code: '588000', fund_name: '本地ETF' },
    ],
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
  
  const remoteData: UserData = {
    version: '1.0',
    updatedAt: '2024-01-02T12:00:00.000Z', // 更新
    favorites: [
      { fund_code: '510050', fund_name: '远程ETF' },
    ],
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
  
  const mergedData = mergeData(localData, remoteData);
  
  console.log('\n合并后数据:');
  console.log(JSON.stringify(mergedData, null, 2));
  
  // 远程数据更新，应该使用远程数据
  const useRemoteValid = mergedData.favorites[0].fund_code === '510050';
  addResult(
    '合并 - 远程更新时使用远程数据',
    useRemoteValid,
    useRemoteValid ? '正确使用远程数据' : '未能正确使用远程数据',
    { mergedFund: mergedData.favorites[0].fund_code }
  );
  
  return useRemoteValid;
}

/**
 * 测试 4: 验证数据合并逻辑 - 本地更新
 */
function testMergeDataLocalNewer() {
  console.log('\n📋 测试 4: 数据合并 - 本地更新');
  console.log('='.repeat(50));
  
  const localData: UserData = {
    version: '1.0',
    updatedAt: '2024-01-02T12:00:00.000Z', // 更新
    favorites: [
      { fund_code: '588000', fund_name: '本地ETF' },
    ],
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
  
  const remoteData: UserData = {
    version: '1.0',
    updatedAt: '2024-01-01T12:00:00.000Z',
    favorites: [
      { fund_code: '510050', fund_name: '远程ETF' },
    ],
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
  
  const mergedData = mergeData(localData, remoteData);
  
  console.log('\n合并后数据:');
  console.log(JSON.stringify(mergedData, null, 2));
  
  // 本地数据更新，应该使用本地数据
  const useLocalValid = mergedData.favorites[0].fund_code === '588000';
  addResult(
    '合并 - 本地更新时使用本地数据',
    useLocalValid,
    useLocalValid ? '正确使用本地数据' : '未能正确使用本地数据',
    { mergedFund: mergedData.favorites[0].fund_code }
  );
  
  return useLocalValid;
}

/**
 * 测试 5: 验证 applyDataToLocal 是否正确应用数据
 */
function testApplyDataToLocal() {
  console.log('\n📋 测试 5: applyDataToLocal 数据应用');
  console.log('='.repeat(50));
  
  clearTestData();
  
  const testData: UserData = {
    version: '1.0',
    updatedAt: '2024-01-01T12:00:00.000Z',
    favorites: [
      { fund_code: '588000', fund_name: '测试ETF' },
    ],
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
  
  console.log('\n应用数据:');
  console.log(JSON.stringify(testData, null, 2));
  
  applyDataToLocal(testData);
  
  // 验证收藏数据是否正确应用
  const favoritesStr = localStorage.getItem('etf_favorites');
  const favorites = favoritesStr ? JSON.parse(favoritesStr) : [];
  const favoritesValid = favorites.length === 1 && favorites[0].fund_code === '588000';
  addResult(
    'applyDataToLocal - 收藏数据',
    favoritesValid,
    favoritesValid ? '正确应用收藏数据' : '未能正确应用收藏数据',
    favorites
  );
  
  // 验证策略参数是否正确应用
  const paramsStr = localStorage.getItem('strategy_params_588000_1');
  const params = paramsStr ? JSON.parse(paramsStr) : null;
  const paramsValid = params !== null && params.initial_capital === 50000;
  addResult(
    'applyDataToLocal - 策略参数',
    paramsValid,
    paramsValid ? '正确应用策略参数' : '未能正确应用策略参数',
    params
  );
  
  // 验证最后选中代码是否正确应用
  const lastCode = localStorage.getItem('strategy_code_cache');
  const codeValid = lastCode === '588000';
  addResult(
    'applyDataToLocal - 最后选中代码',
    codeValid,
    codeValid ? '正确' : `期望 588000，实际 ${lastCode}`
  );
  
  // 验证本地更新时间是否设置
  const updatedAt = localStorage.getItem('etf_autos_local_updated_at');
  const timeValid = updatedAt === '2024-01-01T12:00:00.000Z';
  addResult(
    'applyDataToLocal - 更新时间',
    timeValid,
    timeValid ? '正确' : `期望 2024-01-01T12:00:00.000Z，实际 ${updatedAt}`
  );
  
  return favoritesValid && paramsValid && codeValid && timeValid;
}

/**
 * 测试 6: 验证收藏功能与同步的集成
 */
function testFavoritesIntegration() {
  console.log('\n📋 测试 6: 收藏功能与同步集成');
  console.log('='.repeat(50));
  
  clearTestData();
  
  // 添加收藏
  const fund = { fund_code: '588000', fund_name: '测试ETF' };
  addFavorite(fund);
  
  // 检查 localStorage 是否更新
  const favoritesStr = localStorage.getItem('etf_favorites');
  const favorites = favoritesStr ? JSON.parse(favoritesStr) : [];
  console.log(`\n添加收藏后: ${favorites.length} 条`);
  
  const addValid = favorites.length === 1;
  addResult(
    '收藏 - 添加',
    addValid,
    addValid ? '正确添加收藏' : '未能正确添加收藏',
    favorites
  );
  
  // 检查本地更新时间是否设置
  const updatedAt = localStorage.getItem('etf_autos_local_updated_at');
  const hasUpdatedAt = updatedAt !== null;
  addResult(
    '收藏 - 本地更新时间',
    hasUpdatedAt,
    hasUpdatedAt ? '已设置本地更新时间' : '未设置本地更新时间'
  );
  
  // 收集数据验证
  const collectedData = collectLocalData();
  const collectedValid = collectedData.favorites.length === 1;
  addResult(
    '收藏 - 数据收集',
    collectedValid,
    collectedValid ? '数据收集包含收藏' : '数据收集未包含收藏',
    collectedData.favorites
  );
  
  // 移除收藏
  removeFavorite('588000');
  const afterRemove = getFavorites();
  const removeValid = afterRemove.length === 0;
  addResult(
    '收藏 - 移除',
    removeValid,
    removeValid ? '正确移除收藏' : '未能正确移除收藏',
    afterRemove
  );
  
  return addValid && hasUpdatedAt && collectedValid && removeValid;
}

/**
 * 测试 7: 检查当前 localStorage 中的实际数据
 */
function testCurrentLocalStorage() {
  console.log('\n📋 测试 7: 当前 localStorage 数据检查');
  console.log('='.repeat(50));
  
  // 收集所有相关数据
  const data: Record<string, unknown> = {};
  
  // 收藏数据
  const favoritesStr = localStorage.getItem('etf_favorites');
  data['etf_favorites'] = favoritesStr ? JSON.parse(favoritesStr) : null;
  
  // 策略代码
  data['strategy_code_cache'] = localStorage.getItem('strategy_code_cache');
  
  // 同步相关
  data['etf_autos_gist_id'] = localStorage.getItem('etf_autos_gist_id');
  data['etf_autos_last_sync_time'] = localStorage.getItem('etf_autos_last_sync_time');
  data['etf_autos_local_updated_at'] = localStorage.getItem('etf_autos_local_updated_at');
  
  // 策略参数
  const strategyParams: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('strategy_params_')) {
      const value = localStorage.getItem(key);
      strategyParams[key] = value ? JSON.parse(value) : null;
    }
  }
  data['strategyParams'] = strategyParams;
  
  console.log('\n当前 localStorage 数据:');
  console.log(JSON.stringify(data, null, 2));
  
  // 检查是否有数据
  const hasFavorites = data['etf_favorites'] !== null && Array.isArray(data['etf_favorites']) && (data['etf_favorites'] as unknown[]).length > 0;
  const hasStrategyParams = Object.keys(strategyParams).length > 0;
  const hasCode = data['strategy_code_cache'] !== null;
  
  addResult(
    'localStorage - 收藏数据',
    hasFavorites,
    hasFavorites ? `有 ${(data['etf_favorites'] as unknown[]).length} 条收藏` : '无收藏数据'
  );
  
  addResult(
    'localStorage - 策略参数',
    hasStrategyParams,
    hasStrategyParams ? `有 ${Object.keys(strategyParams).length} 组参数` : '无策略参数'
  );
  
  addResult(
    'localStorage - 最后选中代码',
    hasCode,
    hasCode ? `代码: ${data['strategy_code_cache']}` : '无最后选中代码'
  );
  
  return true; // 这个测试总是通过，只是展示数据
}

/**
 * 测试 8: 模拟完整的同步流程
 */
function testFullSyncFlow() {
  console.log('\n📋 测试 8: 完整同步流程模拟');
  console.log('='.repeat(50));
  
  // 设置本地数据
  setupTestData();
  
  // 收集本地数据
  const localData = collectLocalData();
  console.log('\n1. 收集本地数据:');
  console.log(JSON.stringify(localData, null, 2));
  
  // 模拟远程数据（空数据，新创建的 Gist）
  const remoteData: UserData = {
    ...DEFAULT_USER_DATA,
    updatedAt: new Date().toISOString(),
  };
  console.log('\n2. 远程数据（新 Gist）:');
  console.log(JSON.stringify(remoteData, null, 2));
  
  // 检查远程数据是否为空
  const isEmptyRemote = 
    remoteData.favorites.length === 0 &&
    Object.keys(remoteData.strategyParams).length === 0;
  
  addResult(
    '同步流程 - 远程数据为空',
    isEmptyRemote,
    isEmptyRemote ? '远程数据为空，应上传本地数据' : '远程数据不为空'
  );
  
  // 模拟同步后的数据
  if (isEmptyRemote) {
    console.log('\n3. 同步策略: 上传本地数据到远程');
    console.log('   本地数据:', {
      favorites: localData.favorites.length,
      params: Object.keys(localData.strategyParams).length,
      code: localData.lastSelectedCode,
    });
  }
  
  // 验证本地数据完整性
  const localDataValid = 
    localData.favorites.length === 2 &&
    Object.keys(localData.strategyParams).length === 2 &&
    localData.lastSelectedCode === '588000';
  
  addResult(
    '同步流程 - 本地数据完整',
    localDataValid,
    localDataValid ? '本地数据完整' : '本地数据不完整'
  );
  
  return isEmptyRemote && localDataValid;
}

/**
 * 运行所有测试
 */
function runAllTests() {
  console.log('🚀 Gist 同步功能测试');
  console.log('='.repeat(50));
  console.log(`时间: ${new Date().toISOString()}`);
  console.log(`URL: ${window.location.href}`);
  
  // 清空之前的测试结果
  testResults.length = 0;
  
  // 运行所有测试
  testCollectLocalData();
  testEmptyDataDetection();
  testMergeDataRemoteNewer();
  testMergeDataLocalNewer();
  testApplyDataToLocal();
  testFavoritesIntegration();
  testCurrentLocalStorage();
  testFullSyncFlow();
  
  // 输出汇总
  console.log('\n' + '='.repeat(50));
  console.log('📊 测试结果汇总');
  console.log('='.repeat(50));
  
  const passed = testResults.filter(r => r.passed).length;
  const failed = testResults.filter(r => !r.passed).length;
  
  testResults.forEach(r => {
    const icon = r.passed ? '✅' : '❌';
    console.log(`${icon} ${r.name}: ${r.message}`);
  });
  
  console.log(`\n总计: ${passed} 通过, ${failed} 失败`);
  
  if (failed > 0) {
    console.log('\n⚠️ 存在失败的测试，请检查上述详情');
  } else {
    console.log('\n✅ 所有测试通过');
  }
  
  return { passed, failed, results: testResults };
}

// 导出到全局作用域以便在控制台调用
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).gistSyncTest = {
    runAllTests,
    testCollectLocalData,
    testEmptyDataDetection,
    testMergeDataRemoteNewer,
    testMergeDataLocalNewer,
    testApplyDataToLocal,
    testFavoritesIntegration,
    testCurrentLocalStorage,
    testFullSyncFlow,
    clearTestData,
    setupTestData,
  };
  console.log('💡 Gist 同步测试已加载。在控制台运行: window.gistSyncTest.runAllTests()');
}

export {
  runAllTests,
  testCollectLocalData,
  testEmptyDataDetection,
  testMergeDataRemoteNewer,
  testMergeDataLocalNewer,
  testApplyDataToLocal,
  testFavoritesIntegration,
  testCurrentLocalStorage,
  testFullSyncFlow,
  clearTestData,
  setupTestData,
};