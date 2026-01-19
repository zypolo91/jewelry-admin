import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jewelryImageTags, jewelries } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// GET - 获取藏品的所有图片标签
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const jewelryId = parseInt(params.id);

    // 验证藏品所有权
    const jewelry = await db.query.jewelries.findFirst({
      where: and(eq(jewelries.id, jewelryId), eq(jewelries.userId, user.id))
    });

    if (!jewelry) {
      return NextResponse.json(
        { success: false, message: '藏品不存在或无权限' },
        { status: 404 }
      );
    }

    const tags = await db.query.jewelryImageTags.findMany({
      where: eq(jewelryImageTags.jewelryId, jewelryId)
    });

    return NextResponse.json({
      success: true,
      data: tags.map((t: any) => ({
        imagePath: t.imageUrl,
        tagIds: t.tagIds,
        taggedAt: t.createdAt,
        note: t.note
      }))
    });
  } catch (error: any) {
    console.error('获取图片标签失败:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// POST - 保存图片标签
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const jewelryId = parseInt(params.id);
    const body = await request.json();
    const { imageUrl, tagIds, note } = body;

    if (!imageUrl || !tagIds || !Array.isArray(tagIds)) {
      return NextResponse.json(
        { success: false, message: '参数错误' },
        { status: 400 }
      );
    }

    // 验证藏品所有权
    const jewelry = await db.query.jewelries.findFirst({
      where: and(eq(jewelries.id, jewelryId), eq(jewelries.userId, user.id))
    });

    if (!jewelry) {
      return NextResponse.json(
        { success: false, message: '藏品不存在或无权限' },
        { status: 404 }
      );
    }

    // 检查是否已存在该图片的标签
    const existing = await db.query.jewelryImageTags.findFirst({
      where: and(
        eq(jewelryImageTags.jewelryId, jewelryId),
        eq(jewelryImageTags.imageUrl, imageUrl)
      )
    });

    if (existing) {
      // 更新现有标签
      await db
        .update(jewelryImageTags)
        .set({ tagIds, note, updatedAt: new Date() })
        .where(eq(jewelryImageTags.id, existing.id));
    } else {
      // 创建新标签
      await db.insert(jewelryImageTags).values({
        jewelryId,
        imageUrl,
        tagIds,
        note
      });
    }

    return NextResponse.json({
      success: true,
      message: '保存成功'
    });
  } catch (error: any) {
    console.error('保存图片标签失败:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// PUT - 更新图片标签
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const jewelryId = parseInt(params.id);
    const body = await request.json();
    const { imageUrl, tagIds, note } = body;

    if (!imageUrl || !tagIds || !Array.isArray(tagIds)) {
      return NextResponse.json(
        { success: false, message: '参数错误' },
        { status: 400 }
      );
    }

    // 验证藏品所有权
    const jewelry = await db.query.jewelries.findFirst({
      where: and(eq(jewelries.id, jewelryId), eq(jewelries.userId, user.id))
    });

    if (!jewelry) {
      return NextResponse.json(
        { success: false, message: '藏品不存在或无权限' },
        { status: 404 }
      );
    }

    const result = await db
      .update(jewelryImageTags)
      .set({ tagIds, note, updatedAt: new Date() })
      .where(
        and(
          eq(jewelryImageTags.jewelryId, jewelryId),
          eq(jewelryImageTags.imageUrl, imageUrl)
        )
      );

    return NextResponse.json({
      success: true,
      message: '更新成功'
    });
  } catch (error: any) {
    console.error('更新图片标签失败:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// DELETE - 删除图片标签
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const jewelryId = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('imageUrl');

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, message: '缺少imageUrl参数' },
        { status: 400 }
      );
    }

    // 验证藏品所有权
    const jewelry = await db.query.jewelries.findFirst({
      where: and(eq(jewelries.id, jewelryId), eq(jewelries.userId, user.id))
    });

    if (!jewelry) {
      return NextResponse.json(
        { success: false, message: '藏品不存在或无权限' },
        { status: 404 }
      );
    }

    await db
      .delete(jewelryImageTags)
      .where(
        and(
          eq(jewelryImageTags.jewelryId, jewelryId),
          eq(jewelryImageTags.imageUrl, imageUrl)
        )
      );

    return NextResponse.json({
      success: true,
      message: '删除成功'
    });
  } catch (error: any) {
    console.error('删除图片标签失败:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
