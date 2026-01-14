import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { aiQuotas } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const quotas = await db.query.aiQuotas.findMany({
      where: eq(aiQuotas.userId, user.id)
    });

    const quotaMap: Record<
      string,
      { total: number; used: number; remaining: number }
    > = {};

    for (const q of quotas) {
      quotaMap[q.quotaType] = {
        total: q.totalQuota,
        used: q.usedQuota || 0,
        remaining: q.totalQuota - (q.usedQuota || 0)
      };
    }

    // 默认配额
    const defaultQuotas = {
      valuation: { total: 10, used: 0, remaining: 10 },
      authentication: { total: 5, used: 0, remaining: 5 },
      chat: { total: 50, used: 0, remaining: 50 }
    };

    return NextResponse.json({
      success: true,
      data: { ...defaultQuotas, ...quotaMap }
    });
  } catch (error: any) {
    console.error('获取AI配额失败:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

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
    const { quotaType, totalQuota } = body;

    if (!quotaType || !totalQuota) {
      return NextResponse.json(
        { success: false, message: '参数不完整' },
        { status: 400 }
      );
    }

    const existing = await db.query.aiQuotas.findFirst({
      where: and(
        eq(aiQuotas.userId, user.id),
        eq(aiQuotas.quotaType, quotaType)
      )
    });

    if (existing) {
      await db
        .update(aiQuotas)
        .set({ totalQuota })
        .where(eq(aiQuotas.id, existing.id));
    } else {
      await db.insert(aiQuotas).values({
        userId: user.id,
        quotaType,
        totalQuota,
        usedQuota: 0
      });
    }

    return NextResponse.json({ success: true, message: '配额更新成功' });
  } catch (error: any) {
    console.error('更新AI配额失败:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
