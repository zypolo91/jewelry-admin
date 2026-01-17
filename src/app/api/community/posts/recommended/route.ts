import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  posts,
  users,
  likes,
  userPreferences,
  userViewHistory
} from '@/db/schema';
import { eq, desc, and, notInArray, inArray, gte } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

/**
 * 推荐算法实现
 *
 * 权重分配:
 * - 用户兴趣匹配 (40%): 基于浏览历史、点赞、收藏的分类/话题偏好
 * - 内容热度 (30%): 点赞数、评论数、分享数的综合评分
 * - 时效性 (20%): 发布时间越近分数越高
 * - 多样性 (10%): 避免连续推荐同类型内容
 */

interface PostWithScore {
  id: number;
  userId: number | null;
  content: string | null;
  images: any;
  type: string | null;
  topicId: number | null;
  jewelryIds: any;
  likeCount: number | null;
  commentCount: number | null;
  shareCount: number | null;
  status: string | null;
  createdAt: Date | null;
  username: string | null;
  avatar: string | null;
  recommendScore?: number;
}

interface ViewHistoryEntry {
  postId: number | null;
  viewDuration: number | null;
}

interface LikedPostEntry {
  postId: number | null;
}

// 计算内容热度分数
function calculateHotness(post: PostWithScore): number {
  const likeCount = post.likeCount || 0;
  const commentCount = post.commentCount || 0;
  const shareCount = post.shareCount || 0;

  // 使用对数函数平滑热度计算，避免大V效应
  return (
    Math.log10(likeCount + 1) * 0.5 +
    Math.log10(commentCount + 1) * 0.3 +
    Math.log10(shareCount + 1) * 0.2
  );
}

// 计算时效性分数
function calculateFreshness(createdAt: Date): number {
  const now = new Date();
  const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

  // 24小时内满分，之后递减
  if (hoursDiff <= 24) return 1;
  if (hoursDiff <= 72) return 0.8;
  if (hoursDiff <= 168) return 0.6; // 一周内
  if (hoursDiff <= 720) return 0.4; // 一个月内
  return 0.2;
}

// 计算用户兴趣匹配分数
function calculateInterestMatch(
  post: any,
  userInterests: { types: string[]; topicIds: number[] }
): number {
  let score = 0;

  // 类型匹配
  if (post.type && userInterests.types.includes(post.type)) {
    score += 0.6;
  }

  // 话题匹配
  if (post.topicId && userInterests.topicIds.includes(post.topicId)) {
    score += 0.4;
  }

  return score;
}

// 计算多样性奖励
function calculateDiversityBonus(post: any, recentTypes: string[]): number {
  // 如果最近没有看过这个类型，给予奖励
  if (post.type && !recentTypes.includes(post.type)) {
    return 1;
  }
  return 0;
}

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
    const typeFilter = searchParams.get('type'); // 分类筛选参数

    // 获取用户偏好（减少推送的分类）
    let userPref;
    try {
      [userPref] = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .limit(1);
    } catch (error) {
      console.error('Failed to fetch user preferences:', error);
      userPref = null;
    }

    const reducedCategories = (userPref?.reducedCategories as string[]) || [];
    const notInterestedPosts = (userPref?.notInterestedPosts as number[]) || [];
    const blockedUsers = (userPref?.blockedUsers as number[]) || [];

    // 获取用户的浏览历史，分析兴趣偏好
    const viewHistory: ViewHistoryEntry[] = await db
      .select({
        postId: userViewHistory.postId,
        viewDuration: userViewHistory.viewDuration
      })
      .from(userViewHistory)
      .where(eq(userViewHistory.userId, userId))
      .orderBy(desc(userViewHistory.createdAt))
      .limit(100);

    // 获取用户点赞过的帖子
    const likedPosts: LikedPostEntry[] = await db
      .select({ postId: likes.targetId })
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.targetType, 'post')))
      .limit(50);

    // 分析用户兴趣（基于浏览和点赞历史）
    const interestPostIds = [
      ...viewHistory.map((v) => v.postId),
      ...likedPosts.map((l) => l.postId)
    ].filter((id): id is number => id !== null);

    let userInterests = { types: [] as string[], topicIds: [] as number[] };

    if (interestPostIds.length > 0) {
      const interestPosts = await db
        .select({
          type: posts.type,
          topicId: posts.topicId
        })
        .from(posts)
        .where(inArray(posts.id, interestPostIds));

      // 统计类型和话题频率
      const typeCount: Record<string, number> = {};
      const topicIdCount: Record<number, number> = {};

      interestPosts.forEach((p: any) => {
        if (p.type) {
          typeCount[p.type] = (typeCount[p.type] || 0) + 1;
        }
        if (p.topicId) {
          topicIdCount[p.topicId] = (topicIdCount[p.topicId] || 0) + 1;
        }
      });

      // 取前5个最常见的类型和话题
      userInterests.types = Object.entries(typeCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([t]) => t);

      userInterests.topicIds = Object.entries(topicIdCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id]) => parseInt(id));
    }

    // 最近浏览的类型（用于多样性计算）
    const recentViewedTypes = await db
      .select({ type: posts.type })
      .from(userViewHistory)
      .innerJoin(posts, eq(userViewHistory.postId, posts.id))
      .where(eq(userViewHistory.userId, userId))
      .orderBy(desc(userViewHistory.createdAt))
      .limit(10);

    const recentTypes = recentViewedTypes
      .map((r: any) => r.type)
      .filter((c: any): c is string => c !== null);

    // 构建排除条件
    const excludePostIds = [
      ...notInterestedPosts,
      ...viewHistory
        .map((v) => v.postId)
        .filter((id): id is number => id !== null)
    ];
    const excludeUserIds = [userId, ...blockedUsers];

    // 获取候选帖子（最近30天内的帖子）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let candidatePosts = await db
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
        status: posts.status,
        createdAt: posts.createdAt,
        username: users.username,
        avatar: users.avatar
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .where(
        and(
          eq(posts.status, 'active'),
          gte(posts.createdAt, thirtyDaysAgo),
          // 如果指定了类型筛选，只返回该类型的帖子
          typeFilter ? eq(posts.type, typeFilter) : undefined,
          excludeUserIds.length > 0
            ? notInArray(posts.userId, excludeUserIds)
            : undefined,
          excludePostIds.length > 0
            ? notInArray(posts.id, excludePostIds)
            : undefined
        )
      )
      .orderBy(desc(posts.createdAt))
      .limit(200); // 获取足够多的候选帖子用于排序

    // 计算每个帖子的推荐分数
    const scoredPosts = candidatePosts.map((post: any) => {
      let score = 0;

      // 用户兴趣匹配 (40%)
      score += calculateInterestMatch(post, userInterests) * 0.4;

      // 内容热度 (30%)
      score += calculateHotness(post) * 0.3;

      // 时效性 (20%)
      score += calculateFreshness(post.createdAt!) * 0.2;

      // 多样性 (10%)
      score += calculateDiversityBonus(post, recentTypes) * 0.1;

      // 减少推送的类型降权
      if (post.type && reducedCategories.includes(post.type)) {
        score *= 0.3;
      }

      return { ...post, recommendScore: score };
    });

    // 按推荐分数排序
    scoredPosts.sort((a: any, b: any) => b.recommendScore - a.recommendScore);

    // 分页返回
    const paginatedPosts = scoredPosts.slice(offset, offset + limit);

    // 检查用户是否点赞过这些帖子
    const postIds = paginatedPosts.map((p: any) => p.id);
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
    const formattedPosts = paginatedPosts.map((post: any) => ({
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
      isLiked: likedPostIds.has(post.id),
      recommendScore: post.recommendScore
    }));

    return NextResponse.json({
      success: true,
      data: formattedPosts,
      pagination: {
        page,
        limit,
        hasMore: offset + limit < scoredPosts.length
      }
    });
  } catch (error) {
    console.error('获取推荐帖子失败:', error);
    return NextResponse.json({ error: '获取推荐帖子失败' }, { status: 500 });
  }
}
