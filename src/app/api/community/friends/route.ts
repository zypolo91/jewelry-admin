import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { follows, users } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// 获取好友列表（互相关注的用户）
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
    const type = searchParams.get('type') || 'friends'; // 'friends', 'following', 'followers'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    if (type === 'friends') {
      // 获取互相关注的用户（好友）
      const friendIds = await db.execute(sql`
        SELECT f1.following_id as friend_id
        FROM follows f1
        INNER JOIN follows f2 ON f1.following_id = f2.follower_id AND f1.follower_id = f2.following_id
        WHERE f1.follower_id = ${user.id}
        ORDER BY f1.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `);

      const ids = (friendIds.rows as any[]).map((r: any) => r.friend_id);
      if (ids.length === 0) {
        return NextResponse.json({ success: true, data: [] });
      }

      const friends = await db.query.users.findMany({
        where: sql`${users.id} IN (${sql.join(
          ids.map((id) => sql`${id}`),
          sql`, `
        )})`,
        columns: { id: true, username: true, avatar: true, bio: true }
      });

      return NextResponse.json({ success: true, data: friends });
    } else if (type === 'following') {
      const followingList = await db.query.follows.findMany({
        where: eq(follows.followerId, user.id),
        orderBy: [desc(follows.createdAt)],
        limit,
        offset,
        with: {
          following: {
            columns: { id: true, username: true, avatar: true, bio: true }
          }
        }
      });
      return NextResponse.json({
        success: true,
        data: followingList.map((f: any) => f.following).filter(Boolean)
      });
    } else {
      const followerList = await db.query.follows.findMany({
        where: eq(follows.followingId, user.id),
        orderBy: [desc(follows.createdAt)],
        limit,
        offset,
        with: {
          follower: {
            columns: { id: true, username: true, avatar: true, bio: true }
          }
        }
      });
      return NextResponse.json({
        success: true,
        data: followerList.map((f: any) => f.follower).filter(Boolean)
      });
    }
  } catch (error: any) {
    console.error('获取好友列表失败:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
