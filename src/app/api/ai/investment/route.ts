import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jewelries, aiQuotas } from '@/db/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import { zhipuAIService } from '@/service/zhipu-ai.service';
import { getCurrentUser } from '@/lib/auth';

// AI投资分析 - 基于用户珠宝收藏生成分析报告
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
    const { type } = body; // 'overview' | 'trend' | 'suggestion'

    // 检查配额
    const quota = await db.query.aiQuotas.findFirst({
      where: and(
        eq(aiQuotas.userId, user.id),
        eq(aiQuotas.quotaType, 'investment')
      )
    });

    if (quota && quota.usedQuota >= quota.totalQuota) {
      return NextResponse.json(
        { success: false, message: '本月AI分析次数已用完', quotaRemaining: 0 },
        { status: 429 }
      );
    }

    // 获取用户珠宝数据
    const userJewelries = await db.query.jewelries.findMany({
      where: eq(jewelries.userId, user.id),
      orderBy: [desc(jewelries.createdAt)]
    });

    if (userJewelries.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          report:
            '您还没有添加任何珠宝收藏，无法生成投资分析报告。请先添加一些珠宝后再试。',
          statistics: null
        }
      });
    }

    // 计算统计数据
    const statistics = calculateStatistics(userJewelries);

    // 根据类型生成不同的分析报告
    let prompt = '';
    switch (type) {
      case 'trend':
        prompt = generateTrendPrompt(statistics, userJewelries);
        break;
      case 'suggestion':
        prompt = generateSuggestionPrompt(statistics, userJewelries);
        break;
      case 'overview':
      default:
        prompt = generateOverviewPrompt(statistics, userJewelries);
    }

    // 调用GLM-4生成分析报告
    const report = await zhipuAIService.chat([
      { role: 'user', content: prompt }
    ]);

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
        report,
        statistics,
        type: type || 'overview'
      },
      quotaRemaining
    });
  } catch (error: any) {
    console.error('AI投资分析失败:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'AI投资分析失败' },
      { status: 500 }
    );
  }
}

// GET - 获取价值追踪数据
export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    // 获取用户珠宝数据
    const userJewelries = await db.query.jewelries.findMany({
      where: eq(jewelries.userId, user.id),
      orderBy: [desc(jewelries.createdAt)]
    });

    // 计算统计数据
    const statistics = calculateStatistics(userJewelries);

    // 计算价值变化趋势（模拟月度数据）
    const valueHistory = calculateValueHistory(userJewelries);

    // 获取配额信息
    const quota = await db.query.aiQuotas.findFirst({
      where: and(
        eq(aiQuotas.userId, user.id),
        eq(aiQuotas.quotaType, 'investment')
      )
    });

    return NextResponse.json({
      success: true,
      data: {
        statistics,
        valueHistory,
        quota: {
          total: quota?.totalQuota || 10,
          used: quota?.usedQuota || 0,
          remaining: (quota?.totalQuota || 10) - (quota?.usedQuota || 0)
        }
      }
    });
  } catch (error: any) {
    console.error('获取价值追踪数据失败:', error);
    return NextResponse.json(
      { success: false, message: error.message || '获取数据失败' },
      { status: 500 }
    );
  }
}

function calculateStatistics(jewelries: any[]) {
  const totalCount = jewelries.length;
  let totalPurchaseValue = 0;
  let totalCurrentValue = 0;
  const categoryStats: Record<string, { count: number; value: number }> = {};
  const materialStats: Record<string, { count: number; value: number }> = {};

  for (const j of jewelries) {
    const purchasePrice = j.purchasePrice || 0;
    const currentValue = j.currentValue || purchasePrice;

    totalPurchaseValue += purchasePrice;
    totalCurrentValue += currentValue;

    // 分类统计
    const category = j.categoryName || '其他';
    if (!categoryStats[category]) {
      categoryStats[category] = { count: 0, value: 0 };
    }
    categoryStats[category].count++;
    categoryStats[category].value += currentValue;

    // 材质统计
    const material = j.material || '未知';
    if (!materialStats[material]) {
      materialStats[material] = { count: 0, value: 0 };
    }
    materialStats[material].count++;
    materialStats[material].value += currentValue;
  }

  const profitAmount = totalCurrentValue - totalPurchaseValue;
  const profitRate =
    totalPurchaseValue > 0
      ? ((profitAmount / totalPurchaseValue) * 100).toFixed(2)
      : '0.00';

  return {
    totalCount,
    totalPurchaseValue,
    totalCurrentValue,
    profitAmount,
    profitRate: parseFloat(profitRate),
    categoryStats: Object.entries(categoryStats)
      .map(([name, data]) => ({
        name,
        ...data
      }))
      .sort((a, b) => b.value - a.value),
    materialStats: Object.entries(materialStats)
      .map(([name, data]) => ({
        name,
        ...data
      }))
      .sort((a, b) => b.value - a.value),
    avgValue: totalCount > 0 ? Math.round(totalCurrentValue / totalCount) : 0
  };
}

function calculateValueHistory(jewelries: any[]) {
  // 按月份计算累计价值
  const monthlyData: Record<
    string,
    { purchase: number; current: number; count: number }
  > = {};
  const now = new Date();

  // 初始化最近6个月
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[key] = { purchase: 0, current: 0, count: 0 };
  }

  // 累计计算
  let cumulativePurchase = 0;
  let cumulativeCurrent = 0;
  let cumulativeCount = 0;

  // 按购买日期排序
  const sortedJewelries = [...jewelries].sort(
    (a, b) =>
      new Date(a.purchaseDate || a.createdAt).getTime() -
      new Date(b.purchaseDate || b.createdAt).getTime()
  );

  for (const j of sortedJewelries) {
    const date = new Date(j.purchaseDate || j.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    cumulativePurchase += j.purchasePrice || 0;
    cumulativeCurrent += j.currentValue || j.purchasePrice || 0;
    cumulativeCount++;

    // 更新当月及之后所有月份的累计值
    for (const monthKey of Object.keys(monthlyData)) {
      if (monthKey >= key) {
        monthlyData[monthKey] = {
          purchase: cumulativePurchase,
          current: cumulativeCurrent,
          count: cumulativeCount
        };
      }
    }
  }

  return Object.entries(monthlyData).map(([month, data]) => ({
    month,
    ...data,
    profit: data.current - data.purchase,
    profitRate:
      data.purchase > 0
        ? (((data.current - data.purchase) / data.purchase) * 100).toFixed(2)
        : '0.00'
  }));
}

function generateOverviewPrompt(statistics: any, jewelries: any[]) {
  return `你是一位专业的珠宝投资顾问。请根据以下用户的珠宝收藏数据，生成一份简洁的投资概览报告。

用户收藏概况：
- 珠宝总数：${statistics.totalCount}件
- 购入总成本：¥${statistics.totalPurchaseValue.toLocaleString()}
- 当前估值：¥${statistics.totalCurrentValue.toLocaleString()}
- 收益金额：¥${statistics.profitAmount.toLocaleString()}
- 收益率：${statistics.profitRate}%
- 平均单件价值：¥${statistics.avgValue.toLocaleString()}

分类分布：
${statistics.categoryStats
  .slice(0, 5)
  .map(
    (c: any) => `- ${c.name}：${c.count}件，价值¥${c.value.toLocaleString()}`
  )
  .join('\n')}

请提供：
1. 收藏概况总结（2-3句话）
2. 投资表现评价
3. 收藏结构点评
4. 一句话建议

请用简洁专业的语言，控制在300字以内。`;
}

function generateTrendPrompt(statistics: any, jewelries: any[]) {
  const recentJewelries = jewelries.slice(0, 10);

  return `你是一位专业的珠宝投资顾问。请根据以下用户的珠宝收藏数据，分析投资趋势。

整体数据：
- 珠宝总数：${statistics.totalCount}件
- 总投资：¥${statistics.totalPurchaseValue.toLocaleString()}
- 当前估值：¥${statistics.totalCurrentValue.toLocaleString()}
- 收益率：${statistics.profitRate}%

最近添加的珠宝：
${recentJewelries.map((j: any) => `- ${j.name}：购入价¥${(j.purchasePrice || 0).toLocaleString()}，当前估值¥${(j.currentValue || j.purchasePrice || 0).toLocaleString()}`).join('\n')}

请分析：
1. 用户的投资偏好趋势
2. 价值变化趋势
3. 市场行情对收藏的影响
4. 趋势预测

请用专业但易懂的语言，控制在400字以内。`;
}

function generateSuggestionPrompt(statistics: any, jewelries: any[]) {
  return `你是一位专业的珠宝投资顾问。请根据以下用户的珠宝收藏数据，提供投资建议。

收藏概况：
- 珠宝总数：${statistics.totalCount}件
- 总投资：¥${statistics.totalPurchaseValue.toLocaleString()}
- 当前估值：¥${statistics.totalCurrentValue.toLocaleString()}
- 收益率：${statistics.profitRate}%

分类分布：
${statistics.categoryStats.map((c: any) => `- ${c.name}：${c.count}件（${((c.count / statistics.totalCount) * 100).toFixed(1)}%），价值¥${c.value.toLocaleString()}`).join('\n')}

材质分布：
${statistics.materialStats
  .slice(0, 5)
  .map((m: any) => `- ${m.name}：${m.count}件`)
  .join('\n')}

请提供：
1. 收藏结构优化建议
2. 风险分散建议
3. 适合增持的品类
4. 需要关注的市场机会
5. 保值增值策略

请给出具体可操作的建议，控制在500字以内。`;
}
