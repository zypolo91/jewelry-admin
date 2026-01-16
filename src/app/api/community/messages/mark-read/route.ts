import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// 标记与某用户的消息为已读
export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: '用户ID不能为空' },
        { status: 400 }
      );
    }

    // 标记该用户发给当前用户的所有消息为已读
    const result = await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.senderId, userId),
          eq(messages.receiverId, user.id),
          eq(messages.isRead, false)
        )
      );

    return NextResponse.json({
      success: true,
      message: '标记已读成功'
    });
  } catch (error: any) {
    console.error('标记已读失败:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
