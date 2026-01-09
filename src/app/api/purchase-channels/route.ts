import { NextRequest } from 'next/server';
import { asc, eq, or } from 'drizzle-orm';
import { db } from '@/db';
import { purchaseChannels } from '@/db/schema';
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
    const data = await db
      .select()
      .from(purchaseChannels)
      .where(
        or(
          eq(purchaseChannels.isSystem, true),
          eq(purchaseChannels.userId, user.id)
        )
      )
      .orderBy(asc(purchaseChannels.sortOrder), asc(purchaseChannels.id));

    return successResponse(data);
  } catch (error) {
    console.error('获取渠道列表失败:', error);
    return errorResponse('获取渠道列表失败');
  }
}

export async function POST(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const [result] = await db.insert(purchaseChannels).values({
      name: body.name,
      icon: body.icon,
      sortOrder: body.sortOrder ?? 0,
      remark: body.remark,
      isSystem: false,
      userId: user.id
    });

    const id = (result as any)?.insertId ?? (result as any)?.id ?? null;
    return successResponse({ id, message: '创建成功' });
  } catch (error) {
    console.error('创建渠道失败:', error);
    return errorResponse('创建渠道失败');
  }
}
