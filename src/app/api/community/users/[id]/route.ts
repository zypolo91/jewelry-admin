import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, posts, follows, blocks } from '@/db/schema';
import { eq, and, sql, count } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// 获取用户主页信息
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

    const currentUser = getCurrentUser(request);

    // 查询用户信息
    const userResult = await db
      .select({
        id: users.id,
        username: users.username,
        avatar: users.avatar,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json(
        { code: 1, message: '用户不存在' },
        { status: 404 }
      );
    }

    const user = userResult[0];

    // 统计帖子数
    const postsCountResult = await db
      .select({ count: count() })
      .from(posts)
      .where(and(eq(posts.userId, userId), eq(posts.status, 'active')));
    const postsCount = postsCountResult[0]?.count || 0;

    // 统计粉丝数
    const followersCountResult = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followingId, userId));
    const followersCount = followersCountResult[0]?.count || 0;

    // 统计关注数
    const followingCountResult = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followerId, userId));
    const followingCount = followingCountResult[0]?.count || 0;

    // 检查当前用户是否关注了该用户
    let isFollowing = false;
    if (currentUser) {
      const followResult = await db
        .select({ id: follows.id })
        .from(follows)
        .where(
          and(
            eq(follows.followerId, currentUser.id),
            eq(follows.followingId, userId)
          )
        )
        .limit(1);
      isFollowing = followResult.length > 0;
    }

    // 检查是否被拉黑
    let isBlocked = false;
    if (currentUser) {
      const blockResult = await db
        .select({ id: blocks.id })
        .from(blocks)
        .where(
          and(
            eq(blocks.blockerId, currentUser.id),
            eq(blocks.blockedId, userId)
          )
        )
        .limit(1);
      isBlocked = blockResult.length > 0;
    }

    return NextResponse.json({
      code: 0,
      data: {
        ...user,
        bio: '', // 用户简介，可以后续扩展
        postsCount,
        followersCount,
        followingCount,
        isFollowing,
        isBlocked
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return NextResponse.json(
      { code: 1, message: '获取用户信息失败' },
      { status: 500 }
    );
  }
}
