import { NextRequest } from 'next/server';
import { asc, eq, or } from 'drizzle-orm';
import { db } from '@/db';
import { jewelryCategories } from '@/db/schema';
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
      .from(jewelryCategories)
      .where(
        or(
          eq(jewelryCategories.isSystem, true),
          eq(jewelryCategories.userId, user.id)
        )
      )
      .orderBy(asc(jewelryCategories.sortOrder), asc(jewelryCategories.id));

    return successResponse(data);
  } catch (error) {
    console.error('获取分类列表失败:', error);
    return errorResponse('获取分类列表失败');
  }
}

export async function POST(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const [result] = await db.insert(jewelryCategories).values({
      name: body.name,
      icon: body.icon,
      color: body.color,
      sortOrder: body.sortOrder ?? 0,
      isSystem: false,
      userId: user.id
    });

    const id = (result as any)?.insertId ?? (result as any)?.id ?? null;
    return successResponse({ id, message: '创建成功' });
  } catch (error) {
    console.error('创建分类失败:', error);
    return errorResponse('创建分类失败');
  }
}
