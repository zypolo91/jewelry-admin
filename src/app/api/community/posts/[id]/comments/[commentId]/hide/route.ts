import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { comments, posts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// 隐藏评论（仅帖主可操作）
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

    const { id, commentId } = await params;
    const postId = parseInt(id);
    const commentIdNum = parseInt(commentId);

    if (isNaN(postId) || isNaN(commentIdNum)) {
      return NextResponse.json(
        { code: 1, message: '无效的参数' },
        { status: 400 }
      );
    }

    // 查询帖子，确认当前用户是帖主
    const postResult = await db
      .select({ userId: posts.userId })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (postResult.length === 0) {
      return NextResponse.json(
        { code: 1, message: '帖子不存在' },
        { status: 404 }
      );
    }

    if (postResult[0].userId !== currentUser.id) {
      return NextResponse.json(
        { code: 1, message: '只有帖主可以隐藏评论' },
        { status: 403 }
      );
    }

    // 查询评论是否存在
    const commentResult = await db
      .select({ id: comments.id, status: comments.status })
      .from(comments)
      .where(eq(comments.id, commentIdNum))
      .limit(1);

    if (commentResult.length === 0) {
      return NextResponse.json(
        { code: 1, message: '评论不存在' },
        { status: 404 }
      );
    }

    // 隐藏评论
    await db
      .update(comments)
      .set({ status: 'hidden' })
      .where(eq(comments.id, commentIdNum));

    return NextResponse.json({ code: 0, message: '评论已隐藏' });
  } catch (error) {
    console.error('隐藏评论失败:', error);
    return NextResponse.json(
      { code: 1, message: '隐藏评论失败' },
      { status: 500 }
    );
  }
}
