import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { jewelries, jewelryCategories } from '@/db/schema';
import {
  successResponse,
  errorResponse,
  notFoundResponse
} from '@/service/response';

/**
 * 公开获取珠宝信息（不需要所有权验证）
 * 用于帖子详情页展示关联的珠宝
 * GET /api/jewelries/public/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const jewelryId = Number(id);
  if (Number.isNaN(jewelryId)) {
    return errorResponse('无效的珠宝ID');
  }

  const [record] = await db
    .select({
      id: jewelries.id,
      name: jewelries.name,
      coverImage: jewelries.coverImage,
      images: jewelries.images,
      categoryName: jewelryCategories.name,
      categoryIcon: jewelryCategories.icon
    })
    .from(jewelries)
    .leftJoin(jewelryCategories, eq(jewelries.categoryId, jewelryCategories.id))
    .where(eq(jewelries.id, jewelryId))
    .limit(1);

  if (!record) {
    return notFoundResponse('珠宝不存在');
  }

  return successResponse({
    id: record.id,
    name: record.name,
    image: record.coverImage || (record.images as string[])?.[0],
    category: record.categoryName,
    categoryIcon: record.categoryIcon
  });
}
