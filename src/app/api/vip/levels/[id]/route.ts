import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { vipLevels } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET - 获取单个VIP等级
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { code: 400, message: '无效的ID' },
        { status: 400 }
      );
    }

    const [level] = await db
      .select()
      .from(vipLevels)
      .where(eq(vipLevels.id, id));

    if (!level) {
      return NextResponse.json(
        { code: 404, message: 'VIP等级不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      code: 0,
      data: level,
      message: 'success'
    });
  } catch (error) {
    console.error('获取VIP等级失败:', error);
    return NextResponse.json(
      { code: 500, message: '获取VIP等级失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新VIP等级
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { code: 400, message: '无效的ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      name,
      level,
      price,
      duration,
      maxJewelries,
      maxCategories,
      maxChannels,
      features,
      icon,
      color,
      sortOrder,
      isActive
    } = body;

    const [updated] = await db
      .update(vipLevels)
      .set({
        name,
        level,
        price,
        duration,
        maxJewelries,
        maxCategories,
        maxChannels,
        features,
        icon,
        color,
        sortOrder,
        isActive
      })
      .where(eq(vipLevels.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { code: 404, message: 'VIP等级不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      code: 0,
      data: updated,
      message: 'VIP等级更新成功'
    });
  } catch (error) {
    console.error('更新VIP等级失败:', error);
    return NextResponse.json(
      { code: 500, message: '更新VIP等级失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除VIP等级
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { code: 400, message: '无效的ID' },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(vipLevels)
      .where(eq(vipLevels.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { code: 404, message: 'VIP等级不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      code: 0,
      message: 'VIP等级删除成功'
    });
  } catch (error) {
    console.error('删除VIP等级失败:', error);
    return NextResponse.json(
      { code: 500, message: '删除VIP等级失败' },
      { status: 500 }
    );
  }
}
