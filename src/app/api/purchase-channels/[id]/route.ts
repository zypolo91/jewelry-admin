import { NextRequest } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { jewelries, purchaseChannels } from '@/db/schema';
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

  const channelId = Number(params.id);
  if (Number.isNaN(channelId)) {
    return errorResponse('无效的渠道ID');
  }

  const [record] = await db
    .select()
    .from(purchaseChannels)
    .where(eq(purchaseChannels.id, channelId))
    .limit(1);

  if (!record) {
    return notFoundResponse('渠道不存在');
  }

  if (record.isSystem) {
    return forbiddenResponse('系统预设渠道不可修改');
  }

  if (record.userId !== user.id) {
    return forbiddenResponse('无权修改该渠道');
  }

  try {
    const body = await request.json();
    await db
      .update(purchaseChannels)
      .set({
        name: body.name ?? record.name,
        icon: body.icon ?? record.icon,
        sortOrder: body.sortOrder ?? record.sortOrder,
        remark: body.remark ?? record.remark
      })
      .where(
        and(
          eq(purchaseChannels.id, channelId),
          eq(purchaseChannels.userId, user.id)
        )
      );

    return successResponse({ message: '更新成功' });
  } catch (error) {
    console.error('更新渠道失败:', error);
    return errorResponse('更新渠道失败');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  const channelId = Number(params.id);
  if (Number.isNaN(channelId)) {
    return errorResponse('无效的渠道ID');
  }

  const [record] = await db
    .select()
    .from(purchaseChannels)
    .where(eq(purchaseChannels.id, channelId))
    .limit(1);

  if (!record) {
    return notFoundResponse('渠道不存在');
  }

  if (record.isSystem) {
    return forbiddenResponse('系统预设渠道不可删除');
  }

  if (record.userId !== user.id) {
    return forbiddenResponse('无权删除该渠道');
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(jewelries)
    .where(eq(jewelries.channelId, channelId));

  if (count > 0) {
    return errorResponse('该渠道下仍有关联珠宝，无法删除');
  }

  try {
    await db
      .delete(purchaseChannels)
      .where(
        and(
          eq(purchaseChannels.id, channelId),
          eq(purchaseChannels.userId, user.id)
        )
      );
    return successResponse({ message: '删除成功' });
  } catch (error) {
    console.error('删除渠道失败:', error);
    return errorResponse('删除渠道失败');
  }
}
