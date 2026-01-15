import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { comments, posts } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// 删除评论
export async function DELETE(
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

    const { id, commentId } = await params;
    const postId = parseInt(id);
    const commentIdNum = parseInt(commentId);

    if (isNaN(postId) || isNaN(commentIdNum)) {
      return NextResponse.json(
        { code: 1, message: '无效的参数' },
        { status: 400 }
      );
    }

    // 查询评论信息
    const commentResult = await db
      .select({
        id: comments.id,
        userId: comments.userId,
        postId: comments.postId
      })
      .from(comments)
      .where(eq(comments.id, commentIdNum))
      .limit(1);

    if (commentResult.length === 0) {
      return NextResponse.json(
        { code: 1, message: '评论不存在' },
        { status: 404 }
      );
    }

    const comment = commentResult[0];

    // 查询帖子作者
    const postResult = await db
      .select({ userId: posts.userId })
      .from(posts)
      .where(eq(posts.id, comment.postId))
      .limit(1);

    if (postResult.length === 0) {
      return NextResponse.json(
        { code: 1, message: '帖子不存在' },
        { status: 404 }
      );
    }

    const postOwnerId = postResult[0].userId;

    // 检查权限：评论者或帖主可以删除
    if (comment.userId !== currentUser.id && postOwnerId !== currentUser.id) {
      return NextResponse.json(
        { code: 1, message: '无权限删除此评论' },
        { status: 403 }
      );
    }

    // 删除评论（软删除，设置状态为deleted）
    await db
      .update(comments)
      .set({ status: 'deleted' })
      .where(eq(comments.id, commentIdNum));

    // 减少帖子评论数
    await db
      .update(posts)
      .set({ commentCount: sql`GREATEST(${posts.commentCount} - 1, 0)` })
      .where(eq(posts.id, comment.postId));

    return NextResponse.json({ code: 0, message: '删除成功' });
  } catch (error) {
    console.error('删除评论失败:', error);
    return NextResponse.json(
      { code: 1, message: '删除评论失败' },
      { status: 500 }
    );
  }
}
