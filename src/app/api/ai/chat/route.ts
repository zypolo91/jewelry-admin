import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { aiChats, aiQuotas } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { zhipuAIService, ChatMessage } from '@/service/zhipu-ai.service';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

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
    const { message, sessionId } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, message: '请输入问题' },
        { status: 400 }
      );
    }

    const quota = await db.query.aiQuotas.findFirst({
      where: and(eq(aiQuotas.userId, user.id), eq(aiQuotas.quotaType, 'chat'))
    });

    if (quota && quota.usedQuota >= quota.totalQuota) {
      return NextResponse.json(
        { success: false, message: '本月AI问答次数已用完', quotaRemaining: 0 },
        { status: 429 }
      );
    }

    const currentSessionId = sessionId || uuidv4();

    // 获取历史对话
    const history = await db.query.aiChats.findMany({
      where: and(
        eq(aiChats.userId, user.id),
        eq(aiChats.sessionId, currentSessionId)
      ),
      orderBy: [desc(aiChats.createdAt)],
      limit: 10
    });

    const messages: ChatMessage[] = history
      .reverse()
      .map((h: (typeof history)[number]) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content
      }));
    messages.push({ role: 'user', content: message });

    const reply = await zhipuAIService.chat(messages, currentSessionId);

    // 保存对话记录
    await db.insert(aiChats).values([
      {
        userId: user.id,
        sessionId: currentSessionId,
        role: 'user',
        content: message
      },
      {
        userId: user.id,
        sessionId: currentSessionId,
        role: 'assistant',
        content: reply
      }
    ]);

    if (quota) {
      await db
        .update(aiQuotas)
        .set({ usedQuota: (quota.usedQuota || 0) + 1 })
        .where(eq(aiQuotas.id, quota.id));
    }

    const quotaRemaining = quota
      ? quota.totalQuota - (quota.usedQuota || 0) - 1
      : 999;

    return NextResponse.json({
      success: true,
      data: { sessionId: currentSessionId, reply },
      quotaRemaining
    });
  } catch (error: any) {
    console.error('AI问答失败:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'AI问答失败' },
      { status: 500 }
    );
  }
}

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
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      const chats = await db.query.aiChats.findMany({
        where: and(
          eq(aiChats.userId, user.id),
          eq(aiChats.sessionId, sessionId)
        ),
        orderBy: [desc(aiChats.createdAt)]
      });
      return NextResponse.json({ success: true, data: chats.reverse() });
    }

    // 获取所有会话列表
    const sessions = await db.execute<{
      sessionId: string;
      lastMessage: string;
      createdAt: Date;
    }>`
      SELECT DISTINCT ON (session_id) session_id as "sessionId", content as "lastMessage", created_at as "createdAt"
      FROM ai_chats WHERE user_id = ${user.id} ORDER BY session_id, created_at DESC
    `;

    return NextResponse.json({ success: true, data: sessions.rows });
  } catch (error: any) {
    console.error('获取对话历史失败:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
