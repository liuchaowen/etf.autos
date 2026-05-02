import { FundItem } from '@/types';

// localStorage 缓存键名
const FAVORITES_KEY = 'etf_favorites';

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
    } catch {
        // 保存失败时忽略
    }
}

/**
 * 添加收藏（最多9个）
 */
export function addFavorite(fund: FundItem): FundItem[] {
    const favorites = getFavorites();
    // 检查是否已收藏
    if (!favorites.some(item => item.fund_code === fund.fund_code)) {
        // 检查是否已达到最大数量
        if (favorites.length >= 9) {
            return favorites; // 已满，不添加
        }
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