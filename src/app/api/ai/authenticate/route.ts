import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { aiAuthentications, aiQuotas } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { zhipuAIService } from '@/service/zhipu-ai.service';
import { getCurrentUser } from '@/lib/auth';
import { AchievementService } from '@/service/achievement.service';

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
    const { imageUrls, jewelryId } = body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json(
        { success: false, message: '请提供至少一张图片' },
        { status: 400 }
      );
    }

    const quota = await db.query.aiQuotas.findFirst({
      where: and(
        eq(aiQuotas.userId, user.id),
        eq(aiQuotas.quotaType, 'authentication')
      )
    });

    if (quota && quota.usedQuota >= quota.totalQuota) {
      return NextResponse.json(
        { success: false, message: '本月AI鉴定次数已用完', quotaRemaining: 0 },
        { status: 429 }
      );
    }

    const result = await zhipuAIService.authenticate(imageUrls);

    const [authentication] = await db
      .insert(aiAuthentications)
      .values({
        userId: user.id,
        jewelryId: jewelryId || null,
        imageUrls,
        result: result.result,
        confidence: String(result.confidence),
        issues: result.issues,
        suggestions: result.suggestions,
        modelVersion: 'glm-4-flash'
      })
      .returning();

    if (quota) {
      await db
        .update(aiQuotas)
        .set({ usedQuota: (quota.usedQuota || 0) + 1 })
        .where(eq(aiQuotas.id, quota.id));
    }

    // 触发成就检查
    const unlockedAchievements = await AchievementService.checkAndUnlock({
      type: 'ai_auth',
      userId: user.id
    });

    const quotaRemaining = quota
      ? quota.totalQuota - (quota.usedQuota || 0) - 1
      : 999;

    return NextResponse.json({
      success: true,
      data: { id: authentication.id, ...result },
      quotaRemaining,
      unlockedAchievements: unlockedAchievements.map((a) => ({
        id: a.id,
        name: a.name,
        points: a.points
      }))
    });
  } catch (error: any) {
    console.error('AI鉴定失败:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'AI鉴定失败' },
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const authentications = await db.query.aiAuthentications.findMany({
      where: eq(aiAuthentications.userId, user.id),
      orderBy: [desc(aiAuthentications.createdAt)],
      limit,
      offset,
      with: { jewelry: true }
    });

    return NextResponse.json({
      success: true,
      data: authentications,
      pagination: { page, limit }
    });
  } catch (error: any) {
    console.error('获取鉴定历史失败:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
