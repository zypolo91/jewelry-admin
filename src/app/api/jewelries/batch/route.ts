import { NextRequest } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { jewelries } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse
} from '@/service/response';

export async function POST(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const ids: number[] = body.ids || [];
    const action = body.action as string;

    if (!Array.isArray(ids) || ids.length === 0) {
      return errorResponse('请选择需要操作的记录');
    }

    if (action === 'updateStatus') {
      const result = await db
        .update(jewelries)
        .set({
          status: body.data?.status ?? 'collected',
          updatedAt: new Date()
        })
        .where(and(eq(jewelries.userId, user.id), inArray(jewelries.id, ids)));

      const affected =
        (result as any)?.rowsAffected ??
        (result as any)?.affectedRows ??
        ids.length;
      return successResponse({ affected, message: '状态更新成功' });
    }

    if (action === 'delete') {
      const result = await db
        .delete(jewelries)
        .where(and(eq(jewelries.userId, user.id), inArray(jewelries.id, ids)));

      const affected =
        (result as any)?.rowsAffected ??
        (result as any)?.affectedRows ??
        ids.length;
      return successResponse({ affected, message: '删除成功' });
    }

    return errorResponse('不支持的批量操作');
  } catch (error) {
    console.error('批量操作失败:', error);
    return errorResponse('批量操作失败');
  }
}
