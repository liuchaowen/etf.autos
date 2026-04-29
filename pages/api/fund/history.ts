import type { NextApiRequest, NextApiResponse } from 'next';
import { getFundHistory, FundHistoryItem } from 'ttfunds-ts';

/**
 * API 路由 - 获取基金历史净值
 * 路径: /api/fund/history?code=510300
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FundHistoryItem[] | { error: string }>
) {
  // 只允许 GET 请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '方法不允许' });
  }

  const { code } = req.query;

  // 验证基金代码参数
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: '缺少基金代码参数 code' });
  }

  // 验证基金代码格式 (6位数字)
  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: '基金代码格式错误，应为6位数字' });
  }

  try {
    const data = await getFundHistory(code);
    
    if (!data) {
      return res.status(404).json({ error: '获取数据失败，请检查基金代码是否正确' });
    }

    // 设置缓存头，缓存1小时
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('获取历史净值失败:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
}