import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// 获取未读消息总数或与特定用户的未读数
export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fromUserId = searchParams.get('fromUserId');

    let whereCondition = and(
      eq(messages.receiverId, user.id),
      eq(messages.isRead, false),
      eq(messages.isDeleted, false)
    );

    // 如果指定了发送者ID，只统计该用户发送的未读消息
    if (fromUserId) {
      whereCondition = and(
        whereCondition,
        eq(messages.senderId, parseInt(fromUserId))
      );
    }

    // 统计未读消息数量
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(whereCondition);

    const count = result[0]?.count || 0;

    // 如果没有指定用户，返回按用户分组的未读数
    if (!fromUserId) {
      const groupedResult = await db.execute(sql`
        SELECT sender_id, COUNT(*) as count
        FROM messages
        WHERE receiver_id = ${user.id} AND is_read = false AND is_deleted = false
        GROUP BY sender_id
      `);

      return NextResponse.json({
        success: true,
        data: {
          totalCount: Number(count),
          byUser: groupedResult.rows
        }
      });
    }

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
