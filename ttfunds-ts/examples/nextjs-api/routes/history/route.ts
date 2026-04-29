/**
 * Next.js API 路由示例 - 获取基金历史净值
 * 文件路径: app/api/fund/history/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFundHistory } from 'ttfunds-ts';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json(
      { error: '缺少基金代码参数 code' },
      { status: 400 }
    );
  }

  // 验证基金代码格式 (6位数字)
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { error: '基金代码格式错误，应为6位数字' },
      { status: 400 }
    );
  }

  try {
    const data = await getFundHistory(code);
    
    if (!data) {
      return NextResponse.json(
        { error: '获取数据失败，请检查基金代码是否正确' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('获取历史净值失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}