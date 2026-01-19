import { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { jewelries } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse
} from '@/service/response';

interface TextTag {
  id: string;
  text: string;
  x: number;
  y: number;
  isLeft: boolean;
}

interface TextTagsData {
  [imageUrl: string]: TextTag[];
}

// GET - 获取藏品的文本标签
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const jewelryId = Number(id);
  if (Number.isNaN(jewelryId)) {
    return errorResponse('无效的珠宝ID');
  }

  try {
    const [record] = await db
      .select({
        id: jewelries.id,
        extraData: jewelries.extraData
      })
      .from(jewelries)
      .where(and(eq(jewelries.id, jewelryId), eq(jewelries.userId, user.id)))
      .limit(1);

    if (!record) {
      return notFoundResponse('珠宝不存在');
    }

    // 从extraData中获取textTags
    const extraData = (record.extraData as Record<string, any>) || {};
    const textTags = extraData.textTags || {};

    return successResponse(textTags);
  } catch (error) {
    console.error('获取文本标签失败:', error);
    return errorResponse('获取文本标签失败');
  }
}

// POST - 保存藏品的文本标签
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const jewelryId = Number(id);
  if (Number.isNaN(jewelryId)) {
    return errorResponse('无效的珠宝ID');
  }

  try {
    const body = await request.json();
    const { tags } = body as { tags: TextTagsData };

    // 验证藏品存在且属于当前用户
    const [record] = await db
      .select({
        id: jewelries.id,
        extraData: jewelries.extraData
      })
      .from(jewelries)
      .where(and(eq(jewelries.id, jewelryId), eq(jewelries.userId, user.id)))
      .limit(1);

    if (!record) {
      return notFoundResponse('珠宝不存在');
    }

    // 合并现有extraData和新的textTags
    const existingExtraData = (record.extraData as Record<string, any>) || {};
    const updatedExtraData = {
      ...existingExtraData,
      textTags: tags
    };

    // 更新数据库
    await db
      .update(jewelries)
      .set({
        extraData: updatedExtraData,
        updatedAt: new Date()
      })
      .where(and(eq(jewelries.id, jewelryId), eq(jewelries.userId, user.id)));

    return successResponse({ message: '保存成功' });
  } catch (error) {
    console.error('保存文本标签失败:', error);
    return errorResponse('保存文本标签失败');
  }
}
