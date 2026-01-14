import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { posts, comments } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const postId = parseInt(params.id);
    const body = await request.json();
    const { content, parentId } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: '评论内容不能为空' },
        { status: 400 }
      );
    }

    const [comment] = await db
      .insert(comments)
      .values({
        postId,
        userId: user.id,
        content,
        parentId: parentId || null
      })
      .returning();

    await db
      .update(posts)
      .set({ commentCount: sql`comment_count + 1` })
      .where(eq(posts.id, postId));

    return NextResponse.json({ success: true, data: comment });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
