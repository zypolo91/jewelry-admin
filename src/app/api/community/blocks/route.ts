import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { blocks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// 拉黑用户
export async function POST(request: NextRequest) {
  try {
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { code: 1, message: '请先登录' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId || typeof userId !== 'number') {
      return NextResponse.json(
        { code: 1, message: '无效的用户ID' },
        { status: 400 }
      );
    }

    if (userId === currentUser.id) {
      return NextResponse.json(
        { code: 1, message: '不能拉黑自己' },
        { status: 400 }
      );
    }

    // 检查是否已经拉黑
    const existingBlock = await db
      .select({ id: blocks.id })
      .from(blocks)
      .where(
        and(eq(blocks.blockerId, currentUser.id), eq(blocks.blockedId, userId))
      )
      .limit(1);

    if (existingBlock.length > 0) {
      return NextResponse.json({
        code: 0,
        message: '已拉黑',
        data: { blocked: true }
      });
    }

    // 创建拉黑记录
    await db.insert(blocks).values({
      blockerId: currentUser.id,
      blockedId: userId
    });

    return NextResponse.json({
      code: 0,
      message: '拉黑成功',
      data: { blocked: true }
    });
  } catch (error) {
    console.error('拉黑用户失败:', error);
    return NextResponse.json(
      { code: 1, message: '拉黑用户失败' },
      { status: 500 }
    );
  }
}

// 获取拉黑列表
export async function GET(request: NextRequest) {
  try {
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { code: 1, message: '请先登录' },
        { status: 401 }
      );
    }

    const blockedUsers = await db
      .select({
        id: blocks.id,
        blockedId: blocks.blockedId,
        createdAt: blocks.createdAt
      })
      .from(blocks)
      .where(eq(blocks.blockerId, currentUser.id));

    return NextResponse.json({ code: 0, data: blockedUsers });
  } catch (error) {
    console.error('获取拉黑列表失败:', error);
    return NextResponse.json(
      { code: 1, message: '获取拉黑列表失败' },
      { status: 500 }
    );
  }
}
