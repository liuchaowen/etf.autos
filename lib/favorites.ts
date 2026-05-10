import { FundItem } from '@/types';
import { getSyncManager } from '@/lib/sync/sync-manager';

// localStorage 缓存键名
const FAVORITES_KEY = 'etf_favorites';

// 自定义事件名称
export const FAVORITES_CHANGE_EVENT = 'etf_favorites_change';

/**
 * 触发收藏变化事件
 */
function dispatchFavoritesChange(favorites: FundItem[]): void {
    if (typeof window === 'undefined') return;
    
    window.dispatchEvent(new CustomEvent(FAVORITES_CHANGE_EVENT, {
        detail: { favorites }
    }));
}

/**
 * 标记本地数据已修改（用于同步）
 */
function markLocalModified(): void {
    if (typeof window === 'undefined') return;
    
    try {
        const syncManager = getSyncManager();
        syncManager.markLocalModified();
    } catch {
        // 同步管理器未初始化，忽略
    }
}

/**
 * 获取收藏列表
 */
export function getFavorites(): FundItem[] {
    if (typeof window === 'undefined') return [];
    
    try {
        const stored = localStorage.getItem(FAVORITES_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch {
        // 读取失败，返回空数组
    }
    return [];
}

/**
 * 保存收藏列表
 */
export function saveFavorites(favorites: FundItem[]): void {
    if (typeof window === 'undefined') return;
    
    try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        // 触发自定义事件通知其他组件
        dispatchFavoritesChange(favorites);
        // 标记本地数据已修改
        markLocalModified();
    } catch {
        // 保存失败时忽略
    }
}

/**
 * 添加收藏
 */
export function addFavorite(fund: FundItem): FundItem[] {
    const favorites = getFavorites();
    // 检查是否已收藏
    if (!favorites.some(item => item.fund_code === fund.fund_code)) {
        favorites.push(fund);
        saveFavorites(favorites);
    }
    return favorites;
}

/**
 * 取消收藏
 */
export function removeFavorite(fundCode: string): FundItem[] {
    const favorites = getFavorites();
    const newFavorites = favorites.filter(item => item.fund_code !== fundCode);
    saveFavorites(newFavorites);
    return newFavorites;
}

/**
 * 检查是否已收藏
 */
export function isFavorite(fundCode: string): boolean {
    const favorites = getFavorites();
    return favorites.some(item => item.fund_code === fundCode);
}

/**
 * 切换收藏状态
 */
export function toggleFavorite(fund: FundItem): FundItem[] {
    if (isFavorite(fund.fund_code)) {
        return removeFavorite(fund.fund_code);
    } else {
        return addFavorite(fund);
    }
}

/**
 * 重新排序收藏列表
 * @param fromIndex 原始位置
 * @param toIndex 目标位置
 */
export function reorderFavorites(fromIndex: number, toIndex: number): FundItem[] {
    const favorites = getFavorites();
    if (fromIndex < 0 || fromIndex >= favorites.length || toIndex < 0 || toIndex >= favorites.length) {
        return favorites;
    }
    
    const [removed] = favorites.splice(fromIndex, 1);
    favorites.splice(toIndex, 0, removed);
    saveFavorites(favorites);
    return favorites;
}