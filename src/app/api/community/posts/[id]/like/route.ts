import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { posts, likes } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
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

    const existing = await db.query.likes.findFirst({
      where: and(
        eq(likes.userId, user.id),
        eq(likes.targetType, 'post'),
        eq(likes.targetId, postId)
      )
    });

    if (existing) {
      await db.delete(likes).where(eq(likes.id, existing.id));
      await db
        .update(posts)
        .set({ likeCount: sql`like_count - 1` })
        .where(eq(posts.id, postId));
      return NextResponse.json({ success: true, data: { liked: false } });
    } else {
      await db
        .insert(likes)
        .values({ userId: user.id, targetType: 'post', targetId: postId });
      await db
        .update(posts)
        .set({ likeCount: sql`like_count + 1` })
        .where(eq(posts.id, postId));
      return NextResponse.json({ success: true, data: { liked: true } });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
