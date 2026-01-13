import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { vipLevels } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

// GET - 获取所有VIP等级
export async function GET() {
  try {
    const levels = await db
      .select()
      .from(vipLevels)
      .orderBy(asc(vipLevels.sortOrder), asc(vipLevels.level));

    return NextResponse.json({
      code: 0,
      data: levels,
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

// POST - 创建VIP等级
export async function POST(request: NextRequest) {
  try {
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

    if (!name) {
      return NextResponse.json(
        { code: 400, message: '请输入VIP等级名称' },
        { status: 400 }
      );
    }

    const [newLevel] = await db
      .insert(vipLevels)
      .values({
        name,
        level: level || 1,
        price: price || '0',
        duration: duration || 30,
        maxJewelries: maxJewelries || 50,
        maxCategories: maxCategories || 10,
        maxChannels: maxChannels || 10,
        features: features || [],
        icon,
        color,
        sortOrder: sortOrder || 0,
        isActive: isActive !== false
      })
      .returning();

    return NextResponse.json({
      code: 0,
      data: newLevel,
      message: 'VIP等级创建成功'
    });
  } catch (error) {
    console.error('创建VIP等级失败:', error);
    return NextResponse.json(
      { code: 500, message: '创建VIP等级失败' },
      { status: 500 }
    );
  }
}
