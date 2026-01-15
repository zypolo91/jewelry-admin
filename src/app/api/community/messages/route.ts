import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages, users } from '@/db/schema';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// 获取私信对话列表或特定对话的消息
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
    const chatUserId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    if (chatUserId) {
      // 获取与特定用户的对话消息
      const messageList = await db.query.messages.findMany({
        where: or(
          and(
            eq(messages.senderId, user.id),
            eq(messages.receiverId, parseInt(chatUserId))
          ),
          and(
            eq(messages.senderId, parseInt(chatUserId)),
            eq(messages.receiverId, user.id)
          )
        ),
        orderBy: [desc(messages.createdAt)],
        limit,
        offset,
        with: {
          sender: { columns: { id: true, username: true, avatar: true } }
        }
      });

      // 标记消息为已读
      await db
        .update(messages)
        .set({ isRead: true })
        .where(
          and(
            eq(messages.senderId, parseInt(chatUserId)),
            eq(messages.receiverId, user.id),
            eq(messages.isRead, false)
          )
        );

      return NextResponse.json({ success: true, data: messageList.reverse() });
    } else {
      // 获取对话列表（每个对话显示最后一条消息）
      const conversations = await db.execute(sql`
        WITH latest_messages AS (
          SELECT 
            CASE WHEN sender_id = ${user.id} THEN receiver_id ELSE sender_id END as chat_user_id,
            MAX(created_at) as last_message_time
          FROM messages
          WHERE sender_id = ${user.id} OR receiver_id = ${user.id}
          GROUP BY chat_user_id
        )
        SELECT 
          lm.chat_user_id,
          lm.last_message_time,
          m.content as last_message,
          u.username,
          u.avatar,
          (SELECT COUNT(*) FROM messages WHERE sender_id = lm.chat_user_id AND receiver_id = ${user.id} AND is_read = false) as unread_count
        FROM latest_messages lm
        JOIN messages m ON (
          (m.sender_id = ${user.id} AND m.receiver_id = lm.chat_user_id) OR
          (m.sender_id = lm.chat_user_id AND m.receiver_id = ${user.id})
        ) AND m.created_at = lm.last_message_time
        JOIN users u ON u.id = lm.chat_user_id
        ORDER BY lm.last_message_time DESC
        LIMIT ${limit} OFFSET ${offset}
      `);

      return NextResponse.json({ success: true, data: conversations.rows });
    }
  } catch (error: any) {
    console.error('获取消息失败:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// 发送私信
export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const { receiverId, content } = await request.json();

    if (!receiverId || !content?.trim()) {
      return NextResponse.json(
        { success: false, message: '参数不完整' },
        { status: 400 }
      );
    }

    if (receiverId === user.id) {
      return NextResponse.json(
        { success: false, message: '不能给自己发消息' },
        { status: 400 }
      );
    }

    const [message] = await db
      .insert(messages)
      .values({
        senderId: user.id,
        receiverId,
        content: content.trim(),
        type: 'text',
        isRead: false
      })
      .returning();

    return NextResponse.json({ success: true, data: message });
  } catch (error: any) {
    console.error('发送消息失败:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
