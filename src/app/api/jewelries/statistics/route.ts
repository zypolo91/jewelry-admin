import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { jewelries, jewelryCategories, purchaseChannels } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse
} from '@/service/response';

const priceRanges = [
  { label: '0-1000', min: 0, max: 1000 },
  { label: '1000-5000', min: 1000, max: 5000 },
  { label: '5000-10000', min: 5000, max: 10000 },
  { label: '10000+', min: 10000, max: Infinity }
];

export async function GET(request: Request) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  try {
    const records = await db
      .select({
        id: jewelries.id,
        status: jewelries.status,
        purchasePrice: jewelries.purchasePrice,
        currentValue: jewelries.currentValue,
        categoryId: jewelries.categoryId,
        channelId: jewelries.channelId,
        purchaseDate: jewelries.purchaseDate,
        categoryName: jewelryCategories.name,
        channelName: purchaseChannels.name
      })
      .from(jewelries)
      .leftJoin(
        jewelryCategories,
        eq(jewelries.categoryId, jewelryCategories.id)
      )
      .leftJoin(purchaseChannels, eq(jewelries.channelId, purchaseChannels.id))
      .where(eq(jewelries.userId, user.id));

    const totalCount = records.length;
    const collectedCount = records.filter(
      (r) => r.status === 'collected'
    ).length;
    const soldCount = records.filter((r) => r.status === 'sold').length;

    const totalInvestment = records.reduce(
      (sum, r) => sum + Number(r.purchasePrice ?? 0),
      0
    );
    const totalValue = records.reduce(
      (sum, r) =>
        sum +
        Number(
          r.currentValue !== null && r.currentValue !== undefined
            ? r.currentValue
            : (r.purchasePrice ?? 0)
        ),
      0
    );
    const profitLoss = totalValue - totalInvestment;
    const profitRate =
      totalInvestment > 0
        ? ((profitLoss / totalInvestment) * 100).toFixed(2)
        : '0.00';

    const byCategoryMap = new Map<
      number,
      { categoryId: number; name: string | null; count: number; value: number }
    >();
    records.forEach((item) => {
      const catKey = item.categoryId;
      const entry = byCategoryMap.get(catKey) || {
        categoryId: catKey,
        name: item.categoryName ?? '未分类',
        count: 0,
        value: 0
      };
      entry.count += 1;
      entry.value += Number(item.currentValue ?? item.purchasePrice ?? 0);
      byCategoryMap.set(catKey, entry);
    });

    const byChannelMap = new Map<
      number,
      { channelId: number; name: string | null; count: number; amount: number }
    >();
    records.forEach((item) => {
      const channelKey = item.channelId;
      const entry = byChannelMap.get(channelKey) || {
        channelId: channelKey,
        name: item.channelName ?? '未标记',
        count: 0,
        amount: 0
      };
      entry.count += 1;
      entry.amount += Number(item.purchasePrice ?? 0);
      byChannelMap.set(channelKey, entry);
    });

    const monthlyTrendMap = new Map<
      string,
      { month: string; count: number; amount: number }
    >();
    records.forEach((item) => {
      const date = new Date(item.purchaseDate as any);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}`;
      const entry = monthlyTrendMap.get(monthKey) || {
        month: monthKey,
        count: 0,
        amount: 0
      };
      entry.count += 1;
      entry.amount += Number(item.purchasePrice ?? 0);
      monthlyTrendMap.set(monthKey, entry);
    });

    const priceDistribution = priceRanges.map((range) => ({
      range: range.label,
      count: records.filter((item) => {
        const value = Number(item.purchasePrice ?? 0);
        return value >= range.min && value < range.max;
      }).length
    }));

    return successResponse({
      overview: {
        totalCount,
        collectedCount,
        soldCount,
        totalInvestment: totalInvestment.toFixed(2),
        totalValue: totalValue.toFixed(2),
        profitLoss: profitLoss.toFixed(2),
        profitRate
      },
      byCategory: Array.from(byCategoryMap.values()),
      byChannel: Array.from(byChannelMap.values()),
      monthlyTrend: Array.from(monthlyTrendMap.values()).sort((a, b) =>
        a.month.localeCompare(b.month)
      ),
      priceDistribution
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return errorResponse('获取统计数据失败');
  }
}
