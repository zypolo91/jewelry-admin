import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { searchKeywords } from '@/db/schema';
import { desc } from 'drizzle-orm';

// 获取热门搜索关键词
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // 按搜索次数降序获取热门关键词
    const hotKeywords = await db
      .select({
        keyword: searchKeywords.keyword,
        count: searchKeywords.searchCount
      })
      .from(searchKeywords)
      .orderBy(desc(searchKeywords.searchCount))
      .limit(limit);

    return NextResponse.json({ code: 0, data: hotKeywords });
  } catch (error) {
    console.error('获取热门搜索失败:', error);
    // 如果表不存在或查询失败，返回默认热词
    const defaultKeywords = [
      { keyword: '翡翠', count: 1200 },
      { keyword: '钻石', count: 980 },
      { keyword: '黄金', count: 850 },
      { keyword: '珍珠', count: 720 },
      { keyword: '蓝宝石', count: 650 },
      { keyword: '红宝石', count: 580 },
      { keyword: '和田玉', count: 520 },
      { keyword: '祖母绿', count: 480 }
    ];
    return NextResponse.json({ code: 0, data: defaultKeywords });
  }
}
