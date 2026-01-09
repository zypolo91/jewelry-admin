import { NextRequest } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { jewelries, jewelryCategories } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse
} from '@/service/response';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  const categoryId = Number(params.id);
  if (Number.isNaN(categoryId)) {
    return errorResponse('无效的分类ID');
  }

  const [record] = await db
    .select()
    .from(jewelryCategories)
    .where(eq(jewelryCategories.id, categoryId))
    .limit(1);

  if (!record) {
    return notFoundResponse('分类不存在');
  }

  if (record.isSystem) {
    return forbiddenResponse('系统预设分类不可修改');
  }

  if (record.userId !== user.id) {
    return forbiddenResponse('无权修改该分类');
  }

  try {
    const body = await request.json();
    await db
      .update(jewelryCategories)
      .set({
        name: body.name ?? record.name,
        icon: body.icon ?? record.icon,
        color: body.color ?? record.color,
        sortOrder: body.sortOrder ?? record.sortOrder
      })
      .where(
        and(
          eq(jewelryCategories.id, categoryId),
          eq(jewelryCategories.userId, user.id)
        )
      );

    return successResponse({ message: '更新成功' });
  } catch (error) {
    console.error('更新分类失败:', error);
    return errorResponse('更新分类失败');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  const categoryId = Number(params.id);
  if (Number.isNaN(categoryId)) {
    return errorResponse('无效的分类ID');
  }

  const [record] = await db
    .select()
    .from(jewelryCategories)
    .where(eq(jewelryCategories.id, categoryId))
    .limit(1);

  if (!record) {
    return notFoundResponse('分类不存在');
  }

  if (record.isSystem) {
    return forbiddenResponse('系统预设分类不可删除');
  }

  if (record.userId !== user.id) {
    return forbiddenResponse('无权删除该分类');
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(jewelries)
    .where(eq(jewelries.categoryId, categoryId));

  if (count > 0) {
    return errorResponse('该分类下仍有珠宝，无法删除');
  }

  try {
    await db
      .delete(jewelryCategories)
      .where(
        and(
          eq(jewelryCategories.id, categoryId),
          eq(jewelryCategories.userId, user.id)
        )
      );
    return successResponse({ message: '删除成功' });
  } catch (error) {
    console.error('删除分类失败:', error);
    return errorResponse('删除分类失败');
  }
}
