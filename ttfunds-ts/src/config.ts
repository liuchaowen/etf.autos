/**
 * 天天基金配置模块
 */

import { TtfundsConfig, DEFAULT_CONFIG } from './types';

/**
 * 全局配置对象
 */
let config: TtfundsConfig = { ...DEFAULT_CONFIG };

/**
 * 配置天天基金库
 * @param options 配置选项
 * @returns 当前配置
 */
export function configure(options: Partial<TtfundsConfig>): TtfundsConfig {
  config = { ...config, ...options };
  return config;
}

/**
 * 获取当前配置
 * @returns 当前配置
 */
export function getConfig(): TtfundsConfig {
  return config;
}

/**
 * 重置为默认配置
 * @returns 默认配置
 */
export function resetConfig(): TtfundsConfig {
  config = { ...DEFAULT_CONFIG };
  return config;
}