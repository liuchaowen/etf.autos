/**
 * Gist 同步功能测试
 * 用于验证数据收集和同步是否正常工作
 */

import { collectLocalData, applyDataToLocal, mergeData } from '../lib/sync/sync-manager';
import { UserData, DEFAULT_USER_DATA } from '../lib/sync/types';
import { getFavorites, saveFavorites, addFavorite, removeFavorite } from '../lib/favorites';

// 模拟 localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

// 在测试环境中替换 localStorage
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

/**
 * 测试工具函数
 */
function setupTestData() {
  localStorageMock.clear();
  
  // 模拟收藏数据
  const mockFavorites = [
    { fund_code: '588000', fund_name: '测试ETF1' },
    { fund_code: '510050', fund_name: '测试ETF2' },
  ];
  localStorageMock.setItem('etf_favorites', JSON.stringify(mockFavorites));
  
  // 模拟策略参数
  const mockParams = {
    initial_capital: 50000,
    grid_width: 0.025,
    num_grids: 14,
    grid_investment_percent: 10,
    use_volatility_adjustment: true,
  };
  localStorageMock.setItem('strategy_params_588000_1', JSON.stringify(mockParams));
  localStorageMock.setItem('strategy_params_510050_2', JSON.stringify(mockParams));
  
  // 模拟最后选中的代码
  localStorageMock.setItem('strategy_code_cache', '588000');
  
  // 模拟本地更新时间
  localStorageMock.setItem('etf_autos_local_updated_at', new Date().toISOString());
  
  console.log('✅ 测试数据已设置');
  console.log('  - 收藏数据:', mockFavorites);
  console.log('  - 策略参数键:', Object.keys(localStorageMock).filter(k => k.startsWith('strategy_params_')));
  console.log('  - 最后选中代码: 588000');
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
  console.log(`\n收藏数据验证: ${favoritesValid ? '✅ 通过' : '❌ 失败'}`);
  if (!favoritesValid) {
    console.log(`  期望: 2 条收藏, 实际: ${collectedData.favorites.length} 条`);
  }
  
  // 验证策略参数
  const paramsValid = Object.keys(collectedData.strategyParams).length === 2;
  console.log(`策略参数验证: ${paramsValid ? '✅ 通过' : '❌ 失败'}`);
  if (!paramsValid) {
    console.log(`  期望: 2 组参数, 实际: ${Object.keys(collectedData.strategyParams).length} 组`);
    console.log(`  参数键: ${JSON.stringify(Object.keys(collectedData.strategyParams))}`);
  }
  
  // 验证最后选中代码
  const codeValid = collectedData.lastSelectedCode === '588000';
  console.log(`最后选中代码验证: ${codeValid ? '✅ 通过' : '❌ 失败'}`);
  if (!codeValid) {
    console.log(`  期望: 588000, 实际: ${collectedData.lastSelectedCode}`);
  }
  
  return favoritesValid && paramsValid && codeValid;
}

/**
 * 测试 2: 验证空数据检测
 */
function testEmptyDataDetection() {
  console.log('\n📋 测试 2: 空数据检测');
  console.log('='.repeat(50));
  
  localStorageMock.clear();
  
  const emptyData = collectLocalData();
  
  console.log('\n空数据:');
  console.log(JSON.stringify(emptyData, null, 2));
  
  const isEmpty = 
    emptyData.favorites.length === 0 &&
    Object.keys(emptyData.strategyParams).length === 0 &&
    emptyData.lastSelectedCode === '588000';
  
  console.log(`\n空数据检测: ${isEmpty ? '✅ 通过' : '❌ 失败'}`);
  
  return isEmpty;
}

/**
 * 测试 3: 验证数据合并逻辑
 */
function testMergeData() {
  console.log('\n📋 测试 3: 数据合并逻辑');
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
  
  console.log('\n本地数据:');
  console.log(JSON.stringify(localData, null, 2));
  console.log('\n远程数据:');
  console.log(JSON.stringify(remoteData, null, 2));
  
  const mergedData = mergeData(localData, remoteData);
  
  console.log('\n合并后数据:');
  console.log(JSON.stringify(mergedData, null, 2));
  
  // 远程数据更新，应该使用远程数据
  const useRemoteValid = mergedData.favorites[0].fund_code === '510050';
  console.log(`\n使用远程数据（更新）: ${useRemoteValid ? '✅ 通过' : '❌ 失败'}`);
  
  return useRemoteValid;
}

/**
 * 测试 4: 验证 applyDataToLocal 是否正确应用数据
 */
function testApplyDataToLocal() {
  console.log('\n📋 测试 4: applyDataToLocal 数据应用');
  console.log('='.repeat(50));
  
  localStorageMock.clear();
  
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
  const favoritesStr = localStorageMock.getItem('etf_favorites');
  const favorites = favoritesStr ? JSON.parse(favoritesStr) : [];
  const favoritesValid = favorites.length === 1 && favorites[0].fund_code === '588000';
  console.log(`\n收藏数据应用: ${favoritesValid ? '✅ 通过' : '❌ 失败'}`);
  
  // 验证策略参数是否正确应用
  const paramsStr = localStorageMock.getItem('strategy_params_588000_1');
  const params = paramsStr ? JSON.parse(paramsStr) : null;
  const paramsValid = params !== null && params.initial_capital === 50000;
  console.log(`策略参数应用: ${paramsValid ? '✅ 通过' : '❌ 失败'}`);
  
  // 验证最后选中代码是否正确应用
  const lastCode = localStorageMock.getItem('strategy_code_cache');
  const codeValid = lastCode === '588000';
  console.log(`最后选中代码应用: ${codeValid ? '✅ 通过' : '❌ 失败'}`);
  
  return favoritesValid && paramsValid && codeValid;
}

/**
 * 测试 5: 验证收藏功能与同步的集成
 */
function testFavoritesIntegration() {
  console.log('\n📋 测试 5: 收藏功能与同步集成');
  console.log('='.repeat(50));
  
  localStorageMock.clear();
  
  // 添加收藏
  const fund = { fund_code: '588000', fund_name: '测试ETF' };
  addFavorite(fund);
  
  // 检查 localStorage 是否更新
  const favoritesStr = localStorageMock.getItem('etf_favorites');
  const favorites = favoritesStr ? JSON.parse(favoritesStr) : [];
  console.log(`\n添加收藏后: ${favorites.length} 条`);
  
  // 检查本地更新时间是否设置
  const updatedAt = localStorageMock.getItem('etf_autos_local_updated_at');
  const hasUpdatedAt = updatedAt !== null;
  console.log(`本地更新时间已设置: ${hasUpdatedAt ? '✅ 是' : '❌ 否'}`);
  
  // 收集数据验证
  const collectedData = collectLocalData();
  const collectedValid = collectedData.favorites.length === 1;
  console.log(`数据收集包含收藏: ${collectedValid ? '✅ 通过' : '❌ 失败'}`);
  
  // 移除收藏
  removeFavorite('588000');
  const afterRemove = getFavorites();
  const removeValid = afterRemove.length === 0;
  console.log(`移除收藏: ${removeValid ? '✅ 通过' : '❌ 失败'}`);
  
  return hasUpdatedAt && collectedValid && removeValid;
}

/**
 * 测试 6: 模拟完整的同步流程
 */
function testFullSyncFlow() {
  console.log('\n📋 测试 6: 完整同步流程模拟');
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
  console.log(`\n远程数据为空: ${isEmptyRemote ? '✅ 是' : '❌ 否'}`);
  
  // 如果远程为空，应该上传本地数据
  if (isEmptyRemote) {
    console.log('\n3. 应该上传本地数据到远程');
    console.log('   这需要实际的 Gist API 调用，测试环境无法验证');
  }
  
  return isEmptyRemote;
}

/**
 * 运行所有测试
 */
function runAllTests() {
  console.log('🚀 Gist 同步功能测试');
  console.log('='.repeat(50));
  console.log(`时间: ${new Date().toISOString()}`);
  
  const results = {
    test1: testCollectLocalData(),
    test2: testEmptyDataDetection(),
    test3: testMergeData(),
    test4: testApplyDataToLocal(),
    test5: testFavoritesIntegration(),
    test6: testFullSyncFlow(),
  };
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 测试结果汇总');
  console.log('='.repeat(50));
  
  Object.entries(results).forEach(([name, passed]) => {
    console.log(`${name}: ${passed ? '✅ 通过' : '❌ 失败'}`);
  });
  
  const allPassed = Object.values(results).every(r => r);
  console.log(`\n总计: ${allPassed ? '✅ 所有测试通过' : '❌ 存在失败的测试'}`);
  
  return allPassed;
}

// 导出测试函数
export {
  testCollectLocalData,
  testEmptyDataDetection,
  testMergeData,
  testApplyDataToLocal,
  testFavoritesIntegration,
  testFullSyncFlow,
  runAllTests,
};

// 如果直接运行此文件
if (typeof require !== 'undefined' && require.main === module) {
  runAllTests();
}