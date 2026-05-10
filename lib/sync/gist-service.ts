/**
 * GitHub Gist 服务
 * 用于在用户私有 Gist 中存储和同步数据
 */

import { UserData, GistResponse, SYNC_STORAGE_KEYS, DEFAULT_USER_DATA, CURRENT_DATA_VERSION } from './types';

const GIST_FILENAME = 'etf-autos-data.json';
const GIST_DESCRIPTION = 'ETF Autos 用户数据 - 自动同步';
const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Gist 服务类
 */
export class GistService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  /**
   * 获取请求头
   */
  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };
  }

  /**
   * 获取用户的所有 Gist
   */
  private async listGists(): Promise<GistResponse[]> {
    const response = await fetch(`${GITHUB_API_BASE}/gists`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Token 无效或已过期，请重新登录');
      }
      throw new Error(`获取 Gist 列表失败: ${response.status}`);
    }

    return response.json();
  }

  /**
   * 创建新的 Gist
   */
  private async createGist(data: UserData): Promise<GistResponse> {
    const response = await fetch(`${GITHUB_API_BASE}/gists`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        description: GIST_DESCRIPTION,
        public: false,
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(data, null, 2),
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`创建 Gist 失败: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  /**
   * 获取 Gist 内容
   */
  private async getGist(gistId: string): Promise<GistResponse> {
    const response = await fetch(`${GITHUB_API_BASE}/gists/${gistId}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Gist 不存在');
      }
      if (response.status === 401) {
        throw new Error('Token 无效或已过期，请重新登录');
      }
      throw new Error(`获取 Gist 失败: ${response.status}`);
    }

    return response.json();
  }

  /**
   * 更新 Gist 内容
   */
  private async updateGist(gistId: string, data: UserData): Promise<GistResponse> {
    const response = await fetch(`${GITHUB_API_BASE}/gists/${gistId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({
        description: GIST_DESCRIPTION,
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(data, null, 2),
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`更新 Gist 失败: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  /**
   * 获取或创建用户数据 Gist ID
   */
  async getOrCreateGistId(): Promise<string> {
    // 先检查本地缓存
    if (typeof window !== 'undefined') {
      const cachedId = localStorage.getItem(SYNC_STORAGE_KEYS.GIST_ID);
      if (cachedId) {
        // 验证 Gist 是否仍然存在
        try {
          await this.getGist(cachedId);
          return cachedId;
        } catch {
          // Gist 不存在，清除缓存
          localStorage.removeItem(SYNC_STORAGE_KEYS.GIST_ID);
        }
      }
    }

    // 搜索现有 Gist
    const gists = await this.listGists();
    const existingGist = gists.find(g => g.files[GIST_FILENAME]);
    
    if (existingGist) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(SYNC_STORAGE_KEYS.GIST_ID, existingGist.id);
      }
      return existingGist.id;
    }

    // 创建新 Gist
    const newGist = await this.createGist({
      ...DEFAULT_USER_DATA,
      updatedAt: new Date().toISOString(),
    });
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(SYNC_STORAGE_KEYS.GIST_ID, newGist.id);
    }
    
    return newGist.id;
  }

  /**
   * 从 Gist 读取用户数据
   */
  async readData(): Promise<UserData> {
    const gistId = await this.getOrCreateGistId();
    const gist = await this.getGist(gistId);
    
    const file = gist.files[GIST_FILENAME];
    if (!file || !file.content) {
      throw new Error('Gist 中没有找到数据文件');
    }

    try {
      const data = JSON.parse(file.content) as UserData;
      
      // 检查版本兼容性
      if (data.version !== CURRENT_DATA_VERSION) {
        console.warn('数据版本不匹配，可能需要迁移');
        // 未来可以在这里添加数据迁移逻辑
      }

      return data;
    } catch {
      throw new Error('解析数据失败');
    }
  }

  /**
   * 将用户数据写入 Gist
   */
  async writeData(data: UserData): Promise<void> {
    const gistId = await this.getOrCreateGistId();
    
    // 更新时间戳
    const dataToWrite: UserData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await this.updateGist(gistId, dataToWrite);

    // 更新本地同步时间
    if (typeof window !== 'undefined') {
      localStorage.setItem(SYNC_STORAGE_KEYS.LAST_SYNC_TIME, new Date().toISOString());
    }
  }

  /**
   * 删除 Gist（用于测试或重置）
   */
  async deleteGist(): Promise<void> {
    const gistId = await this.getOrCreateGistId();
    
    const response = await fetch(`${GITHUB_API_BASE}/gists/${gistId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`删除 Gist 失败: ${response.status}`);
    }

    // 清除本地缓存
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SYNC_STORAGE_KEYS.GIST_ID);
      localStorage.removeItem(SYNC_STORAGE_KEYS.LAST_SYNC_TIME);
    }
  }
}

/**
 * 创建 Gist 服务实例
 */
export function createGistService(token: string): GistService {
  return new GistService(token);
}