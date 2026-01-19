import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { posts, topics, likes, users } from '@/db/schema';
import { eq, desc, and, sql, like, or } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { AchievementService } from '@/service/achievement.service';

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');
    const topicId = searchParams.get('topicId');
    const userId = searchParams.get('userId');
    const keyword = searchParams.get('keyword'); // 模糊搜索关键词
    const mine = searchParams.get('mine'); // 只获取当前用户的帖子
    const offset = (page - 1) * limit;

    const whereConditions: any[] = [eq(posts.status, 'active')];
    if (type) whereConditions.push(eq(posts.type, type));
    if (topicId) whereConditions.push(eq(posts.topicId, parseInt(topicId)));
    if (userId) whereConditions.push(eq(posts.userId, parseInt(userId)));

    // 如果mine=true，只获取当前登录用户的帖子
    if (mine === 'true' && user) {
      whereConditions.push(eq(posts.userId, user.id));
    }

    // 模糊搜索：搜索内容
    if (keyword && keyword.trim()) {
      whereConditions.push(like(posts.content, `%${keyword.trim()}%`));
    }

    const postList = await db.query.posts.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      orderBy: [desc(posts.isPinned), desc(posts.createdAt)],
      limit,
      offset,
      with: { user: true, topic: true }
    });

    // Add isLiked status for each post if user is logged in
    let postsWithLikeStatus: any[] = postList;
    if (user) {
      const userLikes = await db.query.likes.findMany({
        where: and(eq(likes.userId, user.id), eq(likes.targetType, 'post'))
      });
      const likedPostIds = new Set(userLikes.map((l: any) => l.targetId));
      postsWithLikeStatus = postList.map((post: any) => ({
        ...post,
        isLiked: likedPostIds.has(post.id)
      }));
    }

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(and(...whereConditions));

    return NextResponse.json({
      success: true,
      data: postsWithLikeStatus,
      pagination: { page, limit, total: total[0]?.count || 0 }
    });
  } catch (error: any) {
    console.error('获取动态列表失败:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content, images, jewelryIds, topicId, type, visibility } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: '内容不能为空' },
        { status: 400 }
      );
    }

    const [post] = await db
      .insert(posts)
      .values({
        userId: user.id,
        content,
        images: images || [],
        jewelryIds: jewelryIds || [],
        topicId: topicId || null,
        type: type || 'normal',
        visibility: visibility || 'public'
      })
      .returning();

    if (topicId) {
      await db
        .update(topics)
        .set({ postCount: sql`post_count + 1` })
        .where(eq(topics.id, topicId));
    }

    // 触发成就系统检查
    const unlockedAchievements = await AchievementService.checkAndUnlock({
      type: 'post_created',
      userId: user.id,
      data: { postId: post.id, type: post.type }
    });

    return NextResponse.json({
      success: true,
      data: post,
      unlockedAchievements:
        unlockedAchievements.length > 0 ? unlockedAchievements : undefined
    });
  } catch (error: any) {
    console.error('发布动态失败:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
