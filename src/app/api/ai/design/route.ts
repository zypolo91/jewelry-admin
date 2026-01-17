import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { aiQuotas } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { openRouterAIService } from '@/service/openrouter-ai.service';
import { getCurrentUser } from '@/lib/auth';

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
    const { image, prompt } = body;

    if (!image && !prompt) {
      return NextResponse.json(
        { success: false, message: '请上传图片或输入设计描述' },
        { status: 400 }
      );
    }

    // 检查AI设计配额
    const quota = await db.query.aiQuotas.findFirst({
      where: and(eq(aiQuotas.userId, user.id), eq(aiQuotas.quotaType, 'design'))
    });

    if (quota && quota.usedQuota >= quota.totalQuota) {
      return NextResponse.json(
        { success: false, message: '本月AI设计次数已用完', quotaRemaining: 0 },
        { status: 429 }
      );
    }

    // 调用OpenRouter AI设计服务
    const result = await openRouterAIService.design(image, prompt || '');

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
      data: result,
      quotaRemaining
    });
  } catch (error: any) {
    console.error('AI设计失败:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'AI设计失败' },
      { status: 500 }
    );
  }
}

// 测试API连接
export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const result = await openRouterAIService.testConnection();

    return NextResponse.json({
      success: result.success,
      data: result
    });
  } catch (error: any) {
    console.error('测试连接失败:', error);
    return NextResponse.json(
      { success: false, message: error.message || '测试连接失败' },
      { status: 500 }
    );
  }
}
