import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { blocks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// 取消拉黑用户
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { code: 1, message: '请先登录' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const blockedUserId = parseInt(id);
    if (isNaN(blockedUserId)) {
      return NextResponse.json(
        { code: 1, message: '无效的用户ID' },
        { status: 400 }
      );
    }

    // 删除拉黑记录
    await db
      .delete(blocks)
      .where(
        and(
          eq(blocks.blockerId, currentUser.id),
          eq(blocks.blockedId, blockedUserId)
        )
      );

    return NextResponse.json({
      code: 0,
      message: '取消拉黑成功',
      data: { blocked: false }
    });
  } catch (error) {
    console.error('取消拉黑失败:', error);
    return NextResponse.json(
      { code: 1, message: '取消拉黑失败' },
      { status: 500 }
    );
  }
}
