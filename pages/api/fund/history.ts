import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * 基金历史净值数据项
 */
export interface FundHistoryItem {
  date: string;       // 净值日期
  nav: number;        // 单位净值
  accNav: number;     // 累计净值
  growthRate: string; // 日增长率
}

/**
 * 从天天基金网获取基金历史净值数据
 * @param code 基金代码
 * @returns 历史净值数据数组
 */
async function fetchFundHistoryFromEastmoney(code: string): Promise<FundHistoryItem[]> {
  const url = `https://fund.eastmoney.com/f10/F10DataApi.aspx?type=lsjz&code=${code}&page=1&sdate=&edate=&per=365`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://fund.eastmoney.com/',
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const text = await response.text();
  
  // 解析返回的 HTML 表格数据
  const items: FundHistoryItem[] = [];
  
  // 使用正则表达式提取表格行数据
  const rowRegex = /<td>(\d{4}-\d{2}-\d{2})<\/td>\s*<td class='tor bold'>([\d.]+)<\/td>\s*<td class='tor bold'>([\d.]+)<\/td>\s*<td class='tor bold (red|green)?'?>([-\d.]+%?)<\/td>/g;
  
  let match;
  while ((match = rowRegex.exec(text)) !== null) {
    items.push({
      date: match[1],
      nav: parseFloat(match[2]),
      accNav: parseFloat(match[3]),
      growthRate: match[5],
    });
  }
  
  return items;
}

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
    const data = await fetchFundHistoryFromEastmoney(code);
    
    if (!data || data.length === 0) {
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