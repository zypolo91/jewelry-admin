import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { posts, topics } from '@/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');
    const topicId = searchParams.get('topicId');
    const userId = searchParams.get('userId');
    const offset = (page - 1) * limit;

    let whereConditions = [eq(posts.status, 'active')];
    if (type) whereConditions.push(eq(posts.type, type));
    if (topicId) whereConditions.push(eq(posts.topicId, parseInt(topicId)));
    if (userId) whereConditions.push(eq(posts.userId, parseInt(userId)));

    const postList = await db.query.posts.findMany({
      where: and(...whereConditions),
      orderBy: [desc(posts.isPinned), desc(posts.createdAt)],
      limit,
      offset,
      with: { user: true, topic: true }
    });

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(and(...whereConditions));

    return NextResponse.json({
      success: true,
      data: postList,
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

    return NextResponse.json({ success: true, data: post });
  } catch (error: any) {
    console.error('发布动态失败:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
