import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { aiValuations, aiQuotas } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { zhipuAIService } from '@/service/zhipu-ai.service';
import { getCurrentUser } from '@/lib/auth';

/**
 * AI估价接口
 * POST /api/ai/valuation
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { imageUrl, jewelryId } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, message: '请提供图片URL' },
        { status: 400 }
      );
    }

    // 检查配额
    const quota = await db.query.aiQuotas.findFirst({
      where: and(
        eq(aiQuotas.userId, user.id),
        eq(aiQuotas.quotaType, 'valuation')
      )
    });

    if (quota && quota.usedQuota >= quota.totalQuota) {
      return NextResponse.json(
        {
          success: false,
          message: '本月AI估价次数已用完',
          quotaRemaining: 0
        },
        { status: 429 }
      );
    }

    // 调用AI估价
    const result = await zhipuAIService.getValuation(imageUrl);

    // 保存估价记录
    const [valuation] = await db
      .insert(aiValuations)
      .values({
        userId: user.id,
        jewelryId: jewelryId || null,
        imageUrl,
        category: result.category,
        material: result.material,
        qualityScore: String(result.qualityScore),
        estimatedMin: String(result.estimatedRange.min),
        estimatedMax: String(result.estimatedRange.max),
        confidence: String(result.confidence),
        analysis: result.analysis,
        modelVersion: 'glm-4-flash'
      })
      .returning();

    // 更新配额
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
      data: {
        id: valuation.id,
        ...result
      },
      quotaRemaining
    });
  } catch (error: any) {
    console.error('AI估价失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'AI估价失败'
      },
      { status: 500 }
    );
  }
}

/**
 * 获取估价历史
 * GET /api/ai/valuation
 */
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

    const valuations = await db.query.aiValuations.findMany({
      where: eq(aiValuations.userId, user.id),
      orderBy: [desc(aiValuations.createdAt)],
      limit,
      offset,
      with: {
        jewelry: true
      }
    });

    return NextResponse.json({
      success: true,
      data: valuations,
      pagination: { page, limit }
    });
  } catch (error: any) {
    console.error('获取估价历史失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message
      },
      { status: 500 }
    );
  }
}
