import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface FundItem {
  fund_code: string;
  abbr: string;
  name: string;
  type: string;
  pinyin: string;
}

/**
 * 基金列表搜索 API
 * 支持按代码、名称、拼音首字母搜索
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<FundItem[] | { error: string }>
) {
  try {
    // 读取基金列表数据
    const filePath = path.join(process.cwd(), 'data', 'list.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const funds: FundItem[] = JSON.parse(fileContent);

    // 获取搜索参数
    const { q } = req.query;

    if (!q || typeof q !== 'string' || !q.trim()) {
      // 如果没有搜索词，返回空数组
      return res.status(200).json([]);
    }

    const queryLower = q.toLowerCase().trim();
    const results: FundItem[] = [];

    /**
     * 获取拼音首字母
     */
    function getInitials(pinyin: string): string {
      if (!pinyin) return '';
      return pinyin.split('').filter((char) => {
        return char >= 'A' && char <= 'Z';
      }).join('');
    }

    // 搜索匹配
    for (const fund of funds) {
      // 限制返回20条
      if (results.length >= 20) break;

      // 匹配代码
      if (fund.fund_code.toLowerCase().includes(queryLower)) {
        results.push(fund);
        continue;
      }

      // 匹配名称
      if (fund.name.toLowerCase().includes(queryLower)) {
        results.push(fund);
        continue;
      }

      // 匹配缩写
      if (fund.abbr.toLowerCase().includes(queryLower)) {
        results.push(fund);
        continue;
      }

      // 匹配拼音首字母
      const initials = getInitials(fund.pinyin);
      if (initials.toLowerCase().includes(queryLower)) {
        results.push(fund);
        continue;
      }

      // 匹配完整拼音
      if (fund.pinyin.toLowerCase().includes(queryLower)) {
        results.push(fund);
        continue;
      }
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error('搜索基金失败:', error);
    return res.status(500).json({ error: '搜索失败' });
  }
}