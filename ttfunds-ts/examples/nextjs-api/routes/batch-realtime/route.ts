/**
 * Next.js API 路由示例 - 批量获取基金实时净值
 * 文件路径: app/api/fund/batch-realtime/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { batchGetFundRealtime } from 'ttfunds-ts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { codes, concurrency } = body as { codes: string[]; concurrency?: number };

    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      return NextResponse.json(
        { error: '缺少基金代码数组参数 codes' },
        { status: 400 }
      );
    }

    // 验证所有基金代码格式
    const invalidCodes = codes.filter(code => !/^\d{6}$/.test(code));
    if (invalidCodes.length > 0) {
      return NextResponse.json(
        { error: `基金代码格式错误: ${invalidCodes.join(', ')}` },
        { status: 400 }
      );
    }

    const data = await batchGetFundRealtime(codes, concurrency);
    return NextResponse.json(data);
  } catch (error) {
    console.error('批量获取实时净值失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}