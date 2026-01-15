import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { searchKeywords } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// 记录搜索关键词
export async function POST(request: NextRequest) {
  try {
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { code: 1, message: '请先登录' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { keyword } = body;

    if (
      !keyword ||
      typeof keyword !== 'string' ||
      keyword.trim().length === 0
    ) {
      return NextResponse.json(
        { code: 1, message: '无效的关键词' },
        { status: 400 }
      );
    }

    const trimmedKeyword = keyword.trim().slice(0, 100); // 限制长度

    // 尝试更新已有关键词的搜索次数
    const updateResult = await db
      .update(searchKeywords)
      .set({
        searchCount: sql`${searchKeywords.searchCount} + 1`,
        lastSearchedAt: new Date()
      })
      .where(eq(searchKeywords.keyword, trimmedKeyword));

    // 如果没有更新到任何记录，则插入新记录
    // @ts-ignore - rowCount 可能不存在于某些数据库驱动
    if (!updateResult.rowCount || updateResult.rowCount === 0) {
      try {
        await db.insert(searchKeywords).values({
          keyword: trimmedKeyword,
          searchCount: 1
        });
      } catch (insertError: any) {
        // 如果是唯一键冲突（并发情况），忽略错误
        if (
          !insertError.message?.includes('unique') &&
          !insertError.message?.includes('duplicate')
        ) {
          throw insertError;
        }
      }
    }

    return NextResponse.json({ code: 0, message: '记录成功' });
  } catch (error) {
    console.error('记录搜索关键词失败:', error);
    // 即使记录失败也返回成功，不影响用户搜索体验
    return NextResponse.json({ code: 0, message: '记录成功' });
  }
}
