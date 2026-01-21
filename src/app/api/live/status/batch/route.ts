import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { liveRooms, liveStatusCache } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

// 批量获取直播状态
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-Id');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: '未登录' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const roomIds = body.roomIds || [];

    if (!Array.isArray(roomIds) || roomIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {}
      });
    }

    // 获取直播间及其状态缓存
    const rooms = await db
      .select({
        room: liveRooms,
        status: liveStatusCache
      })
      .from(liveRooms)
      .leftJoin(liveStatusCache, eq(liveRooms.id, liveStatusCache.liveRoomId))
      .where(inArray(liveRooms.uniqueId, roomIds));

    const statusMap: Record<string, any> = {};

    for (const { room, status } of rooms) {
      statusMap[room.uniqueId] = {
        isLive: status?.isLive ?? false,
        startTime: status?.startTime?.toISOString(),
        viewerCount: status?.viewerCount,
        title: status?.title,
        coverUrl: status?.coverUrl,
        lastCheckedAt: status?.lastCheckedAt?.toISOString()
      };
    }

    return NextResponse.json({
      success: true,
      data: statusMap
    });
  } catch (error) {
    console.error('批量获取直播状态失败:', error);
    return NextResponse.json(
      { success: false, message: '获取失败' },
      { status: 500 }
    );
  }
}
