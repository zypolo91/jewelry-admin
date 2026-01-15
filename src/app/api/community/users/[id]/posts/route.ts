import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { posts, users, likes, blocks } from '@/db/schema';
import { eq, and, desc, notInArray } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// 获取用户发布的帖子
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { code: 1, message: '无效的用户ID' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const currentUser = getCurrentUser(request);

    // 检查当前用户是否被该用户拉黑
    if (currentUser) {
      const blockResult = await db
        .select({ id: blocks.id })
        .from(blocks)
        .where(
          and(
            eq(blocks.blockerId, userId),
            eq(blocks.blockedId, currentUser.id)
          )
        )
        .limit(1);

      if (blockResult.length > 0) {
        // 被拉黑，返回空列表
        return NextResponse.json({ code: 0, data: [] });
      }
    }

    // 查询帖子
    const postsResult = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        images: posts.images,
        type: posts.type,
        likeCount: posts.likeCount,
        commentCount: posts.commentCount,
        shareCount: posts.shareCount,
        favoriteCount: posts.favoriteCount,
        createdAt: posts.createdAt,
        user: {
          id: users.id,
          username: users.username,
          avatar: users.avatar
        }
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .where(and(eq(posts.userId, userId), eq(posts.status, 'active')))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    // 获取当前用户的点赞状态
    let likedPostIds: number[] = [];
    if (currentUser) {
      const likesResult = await db
        .select({ targetId: likes.targetId })
        .from(likes)
        .where(
          and(eq(likes.userId, currentUser.id), eq(likes.targetType, 'post'))
        );
      likedPostIds = likesResult.map((l) => l.targetId);
    }

    const data = postsResult.map((post) => ({
      ...post,
      images: post.images || [],
      isLiked: likedPostIds.includes(post.id)
    }));

    return NextResponse.json({ code: 0, data });
  } catch (error) {
    console.error('获取用户帖子失败:', error);
    return NextResponse.json(
      { code: 1, message: '获取用户帖子失败' },
      { status: 500 }
    );
  }
}
