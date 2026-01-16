import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { posts, users, likes, follows } from '@/db/schema';
import { eq, desc, and, inArray, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

/**
 * 获取关注用户的帖子列表
 * GET /api/community/posts/following
 */
export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    const userId = user.id;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 获取用户关注的人
    const followingList = await db
      .select({ followingId: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, userId));

    const followingIds = followingList.map((f: any) => f.followingId);

    if (followingIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { page, limit, total: 0, hasMore: false }
      });
    }

    // 获取关注用户的帖子
    const postList = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        images: posts.images,
        type: posts.type,
        topicId: posts.topicId,
        jewelryIds: posts.jewelryIds,
        likeCount: posts.likeCount,
        commentCount: posts.commentCount,
        shareCount: posts.shareCount,
        createdAt: posts.createdAt,
        username: users.username,
        avatar: users.avatar
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .where(
        and(eq(posts.status, 'active'), inArray(posts.userId, followingIds))
      )
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    // 获取总数
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(
        and(eq(posts.status, 'active'), inArray(posts.userId, followingIds))
      );
    const total = countResult?.count || 0;

    // 检查用户是否点赞过这些帖子
    const postIds = postList.map((p: any) => p.id);
    const userLikes =
      postIds.length > 0
        ? await db
            .select({ postId: likes.targetId })
            .from(likes)
            .where(
              and(
                eq(likes.userId, userId),
                eq(likes.targetType, 'post'),
                inArray(likes.targetId, postIds)
              )
            )
        : [];

    const likedPostIds = new Set(userLikes.map((l: any) => l.postId));

    // 格式化返回数据
    const formattedPosts = postList.map((post: any) => ({
      id: post.id,
      userId: post.userId,
      content: post.content,
      images: post.images || [],
      type: post.type,
      topicId: post.topicId,
      jewelryIds: post.jewelryIds || [],
      likeCount: post.likeCount || 0,
      commentCount: post.commentCount || 0,
      shareCount: post.shareCount || 0,
      createdAt: post.createdAt,
      user: {
        id: post.userId,
        username: post.username,
        avatar: post.avatar
      },
      isLiked: likedPostIds.has(post.id)
    }));

    return NextResponse.json({
      success: true,
      data: formattedPosts,
      pagination: {
        page,
        limit,
        total,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('获取关注帖子失败:', error);
    return NextResponse.json({ error: '获取关注帖子失败' }, { status: 500 });
  }
}
