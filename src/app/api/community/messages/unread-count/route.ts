import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// 获取未读消息总数
export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    // 统计未读消息数量（排除已删除的消息）
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          eq(messages.receiverId, user.id),
          eq(messages.isRead, false),
          eq(messages.isDeleted, false)
        )
      );

    const count = result[0]?.count || 0;

    return NextResponse.json({
      success: true,
      data: { count: Number(count) }
    });
  } catch (error: any) {
    console.error('获取未读消息数失败:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
