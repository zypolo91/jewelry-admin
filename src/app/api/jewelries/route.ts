import { NextRequest } from 'next/server';
import { asc, and, desc, eq, gte, like, lte, sql } from 'drizzle-orm';
import { db } from '@/db';
import { jewelries, jewelryCategories, purchaseChannels } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse
} from '@/service/response';

export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const categoryId = searchParams.get('categoryId');
    const channelId = searchParams.get('channelId');
    const status = searchParams.get('status');
    const keyword = searchParams.get('keyword');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const conditions = [eq(jewelries.userId, user.id)];

    if (categoryId)
      conditions.push(eq(jewelries.categoryId, Number(categoryId)));
    if (channelId) conditions.push(eq(jewelries.channelId, Number(channelId)));
    if (status) conditions.push(eq(jewelries.status, status));
    if (keyword) conditions.push(like(jewelries.name, `%${keyword}%`));
    if (minPrice)
      conditions.push(gte(jewelries.purchasePrice, Number(minPrice)));
    if (maxPrice)
      conditions.push(lte(jewelries.purchasePrice, Number(maxPrice)));
    if (startDate)
      conditions.push(gte(jewelries.purchaseDate, new Date(startDate)));
    if (endDate)
      conditions.push(lte(jewelries.purchaseDate, new Date(endDate)));

    const orderByColumn =
      jewelries[sortBy as keyof typeof jewelries] ?? jewelries.createdAt;
    const orderFn = sortOrder === 'asc' ? asc : desc;

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(jewelries)
      .where(and(...conditions));

    const data = await db
      .select({
        id: jewelries.id,
        name: jewelries.name,
        coverImage: jewelries.coverImage,
        categoryId: jewelries.categoryId,
        categoryName: jewelryCategories.name,
        purchasePrice: jewelries.purchasePrice,
        currentValue: jewelries.currentValue,
        purchaseDate: jewelries.purchaseDate,
        status: jewelries.status,
        channelId: jewelries.channelId,
        channelName: purchaseChannels.name,
        createdAt: jewelries.createdAt
      })
      .from(jewelries)
      .leftJoin(
        jewelryCategories,
        eq(jewelries.categoryId, jewelryCategories.id)
      )
      .leftJoin(purchaseChannels, eq(jewelries.channelId, purchaseChannels.id))
      .where(and(...conditions))
      .orderBy(orderFn(orderByColumn))
      .limit(limit)
      .offset((page - 1) * limit);

    return successResponse(data, {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('获取珠宝列表失败:', error);
    return errorResponse('获取列表失败');
  }
}

export async function POST(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const purchaseDate = body.purchaseDate
      ? new Date(body.purchaseDate)
      : new Date();

    const [result] = await db.insert(jewelries).values({
      name: body.name,
      categoryId: body.categoryId,
      images: body.images ?? [],
      coverImage: body.coverImage ?? body.images?.[0] ?? null,
      purchasePrice: body.purchasePrice,
      purchaseDate,
      channelId: body.channelId,
      sellerName: body.sellerName,
      currentValue: body.currentValue,
      valueUpdatedAt: body.currentValue ? new Date() : null,
      specifications: body.specifications,
      qualityGrade: body.qualityGrade,
      certificateNo: body.certificateNo,
      certificateImages: body.certificateImages ?? [],
      status: body.status ?? 'collected',
      remark: body.remark,
      extraData: body.extraData,
      userId: user.id
    });

    const id = (result as any)?.insertId ?? (result as any)?.id ?? null;
    return successResponse({ id, message: '创建成功' });
  } catch (error) {
    console.error('创建珠宝失败:', error);
    return errorResponse('创建失败');
  }
}
