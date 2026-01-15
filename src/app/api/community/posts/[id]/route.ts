import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { posts, likes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getCurrentUser(request);
    const { id } = await params;
    const postId = parseInt(id);
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
      with: { user: true, topic: true, comments: { with: { user: true } } }
    });

    if (!post) {
      return NextResponse.json(
        { success: false, message: '动态不存在' },
        { status: 404 }
      );
    }

    // Check if user has liked this post
    let isLiked = false;
    if (user) {
      const userLike = await db.query.likes.findFirst({
        where: and(
          eq(likes.userId, user.id),
          eq(likes.targetType, 'post'),
          eq(likes.targetId, postId)
        )
      });
      isLiked = !!userLike;
    }

    return NextResponse.json({ success: true, data: { ...post, isLiked } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const postId = parseInt(id);
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId)
    });

    if (!post) {
      return NextResponse.json(
        { success: false, message: '动态不存在' },
        { status: 404 }
      );
    }

    if (post.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: '无权修改' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content, images, visibility } = body;

    await db
      .update(posts)
      .set({ content, images, visibility })
      .where(eq(posts.id, postId));

    return NextResponse.json({ success: true, message: '更新成功' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const postId = parseInt(id);
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId)
    });

    if (!post) {
      return NextResponse.json(
        { success: false, message: '动态不存在' },
        { status: 404 }
      );
    }

    if (post.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: '无权删除' },
        { status: 403 }
      );
    }

    await db
      .update(posts)
      .set({ status: 'deleted' })
      .where(eq(posts.id, postId));

    return NextResponse.json({ success: true, message: '删除成功' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
