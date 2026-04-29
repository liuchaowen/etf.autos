/**
 * Next.js API 路由示例 - 获取基金列表
 * 文件路径: app/api/fund/list/route.ts
 */

import { NextResponse } from 'next/server';
import { getFundList } from 'ttfunds-ts';

export async function GET() {
  try {
    const data = await getFundList();
    
    if (!data) {
      return NextResponse.json(
        { error: '获取基金列表失败' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('获取基金列表失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}