/**
 * 同步模块类型定义
 */

import { FundItem, StrategyParams } from '@/types';

// 用户数据结构
export interface UserData {
  version: string;
  updatedAt: string;
  favorites: FundItem[];
  strategyParams: Record<string, StrategyParams>;
}

// 同步状态
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

// 同步上下文值
export interface SyncContextValue {
  // 状态
  status: SyncStatus;
  lastSyncTime: string | null;
  error: string | null;
  isSyncing: boolean;
  
  // 方法
  sync: () => Promise<void>;
  upload: () => Promise<void>;
  download: () => Promise<void>;
  clearError: () => void;
}

// Gist 文件结构
export interface GistFile {
  filename: string;
  type: string;
  language: string;
  raw_url: string;
  size: number;
  content?: string;
}

// Gist 响应结构
export interface GistResponse {
  id: string;
  node_id: string;
  html_url: string;
  files: Record<string, GistFile>;
  description: string;
  public: boolean;
  created_at: string;
  updated_at: string;
}

// 本地存储键
export const SYNC_STORAGE_KEYS = {
  GIST_ID: 'etf_autos_gist_id',
  LAST_SYNC_TIME: 'etf_autos_last_sync_time',
  LOCAL_UPDATED_AT: 'etf_autos_local_updated_at',
} as const;

// 当前数据版本
export const CURRENT_DATA_VERSION = '1.0';

// 默认用户数据
export const DEFAULT_USER_DATA: UserData = {
  version: CURRENT_DATA_VERSION,
  updatedAt: new Date().toISOString(),
  favorites: [],
  strategyParams: {},
};