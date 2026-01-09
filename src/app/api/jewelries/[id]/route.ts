import { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { jewelries, jewelryCategories, purchaseChannels } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse
} from '@/service/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  const jewelryId = Number(params.id);
  if (Number.isNaN(jewelryId)) {
    return errorResponse('无效的珠宝ID');
  }

  const [record] = await db
    .select({
      id: jewelries.id,
      name: jewelries.name,
      images: jewelries.images,
      coverImage: jewelries.coverImage,
      category: {
        id: jewelryCategories.id,
        name: jewelryCategories.name,
        icon: jewelryCategories.icon
      },
      categoryId: jewelries.categoryId,
      purchasePrice: jewelries.purchasePrice,
      purchaseDate: jewelries.purchaseDate,
      channel: {
        id: purchaseChannels.id,
        name: purchaseChannels.name
      },
      channelId: jewelries.channelId,
      sellerName: jewelries.sellerName,
      currentValue: jewelries.currentValue,
      valueUpdatedAt: jewelries.valueUpdatedAt,
      specifications: jewelries.specifications,
      qualityGrade: jewelries.qualityGrade,
      certificateNo: jewelries.certificateNo,
      certificateImages: jewelries.certificateImages,
      status: jewelries.status,
      remark: jewelries.remark,
      createdAt: jewelries.createdAt,
      updatedAt: jewelries.updatedAt
    })
    .from(jewelries)
    .leftJoin(jewelryCategories, eq(jewelries.categoryId, jewelryCategories.id))
    .leftJoin(purchaseChannels, eq(jewelries.channelId, purchaseChannels.id))
    .where(and(eq(jewelries.id, jewelryId), eq(jewelries.userId, user.id)))
    .limit(1);

  if (!record) {
    return notFoundResponse('珠宝不存在');
  }

  return successResponse(record);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  const jewelryId = Number(params.id);
  if (Number.isNaN(jewelryId)) {
    return errorResponse('无效的珠宝ID');
  }

  const body = await request.json();

  try {
    const updateData: Record<string, any> = {
      updatedAt: new Date()
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.images !== undefined) updateData.images = body.images;
    if (body.coverImage !== undefined) updateData.coverImage = body.coverImage;
    if (body.purchasePrice !== undefined)
      updateData.purchasePrice = body.purchasePrice;
    if (body.purchaseDate !== undefined)
      updateData.purchaseDate = new Date(body.purchaseDate);
    if (body.channelId !== undefined) updateData.channelId = body.channelId;
    if (body.sellerName !== undefined) updateData.sellerName = body.sellerName;
    if (body.currentValue !== undefined) {
      updateData.currentValue = body.currentValue;
      updateData.valueUpdatedAt = new Date();
    }
    if (body.specifications !== undefined)
      updateData.specifications = body.specifications;
    if (body.qualityGrade !== undefined)
      updateData.qualityGrade = body.qualityGrade;
    if (body.certificateNo !== undefined)
      updateData.certificateNo = body.certificateNo;
    if (body.certificateImages !== undefined)
      updateData.certificateImages = body.certificateImages;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.remark !== undefined) updateData.remark = body.remark;
    if (body.extraData !== undefined) updateData.extraData = body.extraData;

    await db
      .update(jewelries)
      .set(updateData)
      .where(and(eq(jewelries.id, jewelryId), eq(jewelries.userId, user.id)));

    return successResponse({ message: '更新成功' });
  } catch (error) {
    console.error('更新珠宝失败:', error);
    return errorResponse('更新失败');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  const jewelryId = Number(params.id);
  if (Number.isNaN(jewelryId)) {
    return errorResponse('无效的珠宝ID');
  }

  try {
    await db
      .delete(jewelries)
      .where(and(eq(jewelries.id, jewelryId), eq(jewelries.userId, user.id)));

    return successResponse({ message: '删除成功' });
  } catch (error) {
    console.error('删除珠宝失败:', error);
    return errorResponse('删除失败');
  }
}
