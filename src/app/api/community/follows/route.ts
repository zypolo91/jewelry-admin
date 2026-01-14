import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { follows, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

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
    const type = searchParams.get('type') || 'following';

    if (type === 'following') {
      const followingList = await db.query.follows.findMany({
        where: eq(follows.followerId, user.id),
        orderBy: [desc(follows.createdAt)]
      });
      return NextResponse.json({ success: true, data: followingList });
    } else {
      const followerList = await db.query.follows.findMany({
        where: eq(follows.followingId, user.id),
        orderBy: [desc(follows.createdAt)]
      });
      return NextResponse.json({ success: true, data: followerList });
    }
  } catch (error: any) {
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
    const { userId } = body;

    if (!userId || userId === user.id) {
      return NextResponse.json(
        { success: false, message: '无效的用户ID' },
        { status: 400 }
      );
    }

    const existing = await db.query.follows.findFirst({
      where: and(
        eq(follows.followerId, user.id),
        eq(follows.followingId, userId)
      )
    });

    if (existing) {
      await db.delete(follows).where(eq(follows.id, existing.id));
      return NextResponse.json({ success: true, data: { following: false } });
    } else {
      await db
        .insert(follows)
        .values({ followerId: user.id, followingId: userId });
      return NextResponse.json({ success: true, data: { following: true } });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
