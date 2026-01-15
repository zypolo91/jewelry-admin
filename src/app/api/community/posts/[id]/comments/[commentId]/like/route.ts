import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { likes, comments } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// 点赞/取消点赞评论
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { code: 1, message: '请先登录' },
        { status: 401 }
      );
    }

    const { commentId } = await params;
    const commentIdNum = parseInt(commentId);
    if (isNaN(commentIdNum)) {
      return NextResponse.json(
        { code: 1, message: '无效的评论ID' },
        { status: 400 }
      );
    }

    // 检查评论是否存在
    const commentResult = await db
      .select({ id: comments.id, likeCount: comments.likeCount })
      .from(comments)
      .where(eq(comments.id, commentIdNum))
      .limit(1);

    if (commentResult.length === 0) {
      return NextResponse.json(
        { code: 1, message: '评论不存在' },
        { status: 404 }
      );
    }

    // 检查是否已点赞
    const existingLike = await db
      .select({ id: likes.id })
      .from(likes)
      .where(
        and(
          eq(likes.userId, currentUser.id),
          eq(likes.targetType, 'comment'),
          eq(likes.targetId, commentIdNum)
        )
      )
      .limit(1);

    let liked: boolean;
    if (existingLike.length > 0) {
      // 取消点赞
      await db
        .delete(likes)
        .where(
          and(
            eq(likes.userId, currentUser.id),
            eq(likes.targetType, 'comment'),
            eq(likes.targetId, commentIdNum)
          )
        );

      // 减少点赞数
      await db
        .update(comments)
        .set({ likeCount: sql`GREATEST(${comments.likeCount} - 1, 0)` })
        .where(eq(comments.id, commentIdNum));

      liked = false;
    } else {
      // 添加点赞
      await db.insert(likes).values({
        userId: currentUser.id,
        targetType: 'comment',
        targetId: commentIdNum
      });

      // 增加点赞数
      await db
        .update(comments)
        .set({ likeCount: sql`${comments.likeCount} + 1` })
        .where(eq(comments.id, commentIdNum));

      liked = true;
    }

    return NextResponse.json({
      code: 0,
      message: liked ? '点赞成功' : '取消点赞成功',
      data: { liked }
    });
  } catch (error) {
    console.error('评论点赞操作失败:', error);
    return NextResponse.json({ code: 1, message: '操作失败' }, { status: 500 });
  }
}
