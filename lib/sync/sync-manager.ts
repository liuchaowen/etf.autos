/**
 * 同步管理器
 * 负责协调本地数据和远程 Gist 数据的同步
 * 采用时间戳优先策略处理冲突
 */

import { FundItem, StrategyParams } from '@/types';
import { UserData, SYNC_STORAGE_KEYS, DEFAULT_USER_DATA } from './types';
import { GistService, createGistService } from './gist-service';
import { getFavorites, saveFavorites } from '@/lib/favorites';

// localStorage 键名（从现有代码复制）
const STRATEGY_PARAMS_CACHE_PREFIX = 'strategy_params_';
const STRATEGY_CODE_CACHE_KEY = 'strategy_code_cache';

/**
 * 从本地存储收集所有数据
 */
export function collectLocalData(): UserData {
  if (typeof window === 'undefined') {
    return DEFAULT_USER_DATA;
  }

  // 收藏列表
  const favorites = getFavorites();

  // 策略参数
  const strategyParams: Record<string, StrategyParams> = {};
  
  // 遍历 localStorage 找出所有策略参数
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STRATEGY_PARAMS_CACHE_PREFIX)) {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          // key 格式: strategy_params_{code}_{years}
          const paramsKey = key.replace(STRATEGY_PARAMS_CACHE_PREFIX, '');
          strategyParams[paramsKey] = JSON.parse(value);
        }
      } catch {
        // 解析失败，跳过
      }
    }
  }

  // 最后选中的代码
  const lastSelectedCode = localStorage.getItem(STRATEGY_CODE_CACHE_KEY) || '588000';

  // 本地更新时间
  const localUpdatedAt = localStorage.getItem(SYNC_STORAGE_KEYS.LOCAL_UPDATED_AT);

  return {
    version: '1.0',
    updatedAt: localUpdatedAt || new Date().toISOString(),
    favorites,
    strategyParams,
    lastSelectedCode,
  };
}

/**
 * 将数据应用到本地存储
 */
export function applyDataToLocal(data: UserData): void {
  if (typeof window === 'undefined') return;

  // 应用收藏列表
  saveFavorites(data.favorites);

  // 应用策略参数
  Object.entries(data.strategyParams).forEach(([key, params]) => {
    localStorage.setItem(`${STRATEGY_PARAMS_CACHE_PREFIX}${key}`, JSON.stringify(params));
  });

  // 应用最后选中的代码
  localStorage.setItem(STRATEGY_CODE_CACHE_KEY, data.lastSelectedCode);

  // 更新本地更新时间
  localStorage.setItem(SYNC_STORAGE_KEYS.LOCAL_UPDATED_AT, data.updatedAt);
}

/**
 * 合并本地和远程数据（时间戳优先策略）
 */
export function mergeData(local: UserData, remote: UserData): UserData {
  const localTime = new Date(local.updatedAt).getTime();
  const remoteTime = new Date(remote.updatedAt).getTime();

  // 如果远程数据更新，使用远程数据
  if (remoteTime > localTime) {
    console.log('使用远程数据（更新）');
    return remote;
  }

  // 如果本地数据更新，使用本地数据
  if (localTime > remoteTime) {
    console.log('使用本地数据（更新）');
    return local;
  }

  // 时间戳相同，合并数据（取并集）
  console.log('时间戳相同，合并数据');
  
  // 收藏列表：以本地为准（用户可能刚添加）
  const mergedFavorites = local.favorites.length >= remote.favorites.length 
    ? local.favorites 
    : remote.favorites;

  // 策略参数：合并，本地优先
  const mergedParams: Record<string, StrategyParams> = { ...remote.strategyParams };
  Object.entries(local.strategyParams).forEach(([key, params]) => {
    mergedParams[key] = params;
  });

  // 最后选中的代码：使用本地
  const mergedLastCode = local.lastSelectedCode;

  return {
    version: '1.0',
    updatedAt: new Date().toISOString(),
    favorites: mergedFavorites,
    strategyParams: mergedParams,
    lastSelectedCode: mergedLastCode,
  };
}

/**
 * 同步管理器类
 */
export class SyncManager {
  private gistService: GistService | null = null;
  private token: string | null = null;

  /**
   * 设置认证 token
   */
  setToken(token: string): void {
    this.token = token;
    this.gistService = createGistService(token);
  }

  /**
   * 清除 token
   */
  clearToken(): void {
    this.token = null;
    this.gistService = null;
  }

  /**
   * 检查是否已登录
   */
  isLoggedIn(): boolean {
    return Boolean(this.token && this.gistService);
  }

  /**
   * 执行完整同步（下载 + 合并 + 上传）
   */
  async sync(): Promise<UserData> {
    if (!this.gistService) {
      throw new Error('未登录，无法同步');
    }

    // 1. 收集本地数据
    const localData = collectLocalData();

    // 2. 读取远程数据
    const remoteData = await this.gistService.readData();

    // 3. 合并数据
    const mergedData = mergeData(localData, remoteData);

    // 4. 应用到本地
    applyDataToLocal(mergedData);

    // 5. 上传到远程
    await this.gistService.writeData(mergedData);

    return mergedData;
  }

  /**
   * 仅上传本地数据到远程
   */
  async upload(): Promise<void> {
    if (!this.gistService) {
      throw new Error('未登录，无法上传');
    }

    const localData = collectLocalData();
    await this.gistService.writeData(localData);

    // 更新本地更新时间
    localStorage.setItem(SYNC_STORAGE_KEYS.LOCAL_UPDATED_AT, localData.updatedAt);
  }

  /**
   * 仅下载远程数据到本地
   */
  async download(): Promise<UserData> {
    if (!this.gistService) {
      throw new Error('未登录，无法下载');
    }

    const remoteData = await this.gistService.readData();
    applyDataToLocal(remoteData);

    return remoteData;
  }

  /**
   * 获取上次同步时间
   */
  getLastSyncTime(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(SYNC_STORAGE_KEYS.LAST_SYNC_TIME);
  }

  /**
   * 标记本地数据已修改
   */
  markLocalModified(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SYNC_STORAGE_KEYS.LOCAL_UPDATED_AT, new Date().toISOString());
  }

  /**
   * 清除同步相关的缓存数据
   * 用于退出登录时清理
   */
  clearSyncCache(): void {
    if (typeof window === 'undefined') return;
    
    // 清除同步相关的存储键
    localStorage.removeItem(SYNC_STORAGE_KEYS.GIST_ID);
    localStorage.removeItem(SYNC_STORAGE_KEYS.LAST_SYNC_TIME);
    localStorage.removeItem(SYNC_STORAGE_KEYS.LOCAL_UPDATED_AT);
    
    console.log('同步缓存已清除');
  }
}

// 全局同步管理器实例
let syncManagerInstance: SyncManager | null = null;

/**
 * 获取同步管理器实例
 */
export function getSyncManager(): SyncManager {
  if (!syncManagerInstance) {
    syncManagerInstance = new SyncManager();
  }
  return syncManagerInstance;
}