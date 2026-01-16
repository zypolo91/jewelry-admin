import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// 撤回消息（3分钟内可撤回）
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const messageId = parseInt(params.id);
    if (isNaN(messageId)) {
      return NextResponse.json(
        { success: false, message: '无效的消息ID' },
        { status: 400 }
      );
    }

    // 获取消息
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!message) {
      return NextResponse.json(
        { success: false, message: '消息不存在' },
        { status: 404 }
      );
    }

    // 检查是否是自己发送的消息
    if (message.senderId !== user.id) {
      return NextResponse.json(
        { success: false, message: '只能撤回自己发送的消息' },
        { status: 403 }
      );
    }

    // 检查消息是否已撤回
    if (message.isRecalled) {
      return NextResponse.json(
        { success: false, message: '消息已撤回' },
        { status: 400 }
      );
    }

    // 检查消息是否在3分钟内
    const createdAt = new Date(message.createdAt!);
    const now = new Date();
    const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

    if (diffMinutes > 3) {
      return NextResponse.json(
        { success: false, message: '只能撤回3分钟内的消息' },
        { status: 400 }
      );
    }

    // 获取用户名用于显示撤回提示
    const [sender] = await db
      .select({ username: users.username })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    // 撤回消息
    await db
      .update(messages)
      .set({
        isRecalled: true,
        recalledAt: new Date(),
        content: `${sender?.username || '用户'}撤回了一条消息`
      })
      .where(eq(messages.id, messageId));

    return NextResponse.json({
      success: true,
      message: '撤回成功',
      data: {
        messageId,
        recalledAt: new Date(),
        recallText: `${sender?.username || '用户'}撤回了一条消息`
      }
    });
  } catch (error: any) {
    console.error('撤回消息失败:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
