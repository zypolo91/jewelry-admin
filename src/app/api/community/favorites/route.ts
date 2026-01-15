import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { favorites, posts } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// 获取用户收藏列表
export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const favoriteList = await db.query.favorites.findMany({
      where: eq(favorites.userId, user.id),
      orderBy: [desc(favorites.createdAt)],
      limit,
      offset,
      with: {
        post: {
          with: { user: true, topic: true }
        }
      }
    });

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(favorites)
      .where(eq(favorites.userId, user.id));

    return NextResponse.json({
      success: true,
      data: favoriteList.map((f: any) => f.post).filter(Boolean),
      pagination: { page, limit, total: total[0]?.count || 0 }
    });
  } catch (error: any) {
    console.error('获取收藏列表失败:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// 收藏/取消收藏帖子
export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const { postId } = await request.json();
    if (!postId) {
      return NextResponse.json(
        { success: false, message: '帖子ID不能为空' },
        { status: 400 }
      );
    }

    // 检查是否已收藏
    const existing = await db.query.favorites.findFirst({
      where: and(eq(favorites.userId, user.id), eq(favorites.postId, postId))
    });

    if (existing) {
      // 取消收藏
      await db.delete(favorites).where(eq(favorites.id, existing.id));
      await db
        .update(posts)
        .set({ favoriteCount: sql`GREATEST(favorite_count - 1, 0)` })
        .where(eq(posts.id, postId));
      return NextResponse.json({ success: true, data: { isFavorited: false } });
    } else {
      // 添加收藏
      await db.insert(favorites).values({ userId: user.id, postId });
      await db
        .update(posts)
        .set({ favoriteCount: sql`favorite_count + 1` })
        .where(eq(posts.id, postId));
      return NextResponse.json({ success: true, data: { isFavorited: true } });
    }
  } catch (error: any) {
    console.error('收藏操作失败:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
