import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { liveRooms } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// 同步直播间（批量upsert）
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
    const rooms = body.rooms || [];

    if (!Array.isArray(rooms)) {
      return NextResponse.json(
        { success: false, message: '无效的数据格式' },
        { status: 400 }
      );
    }

    const syncedRooms = [];

    for (const room of rooms) {
      // 检查是否已存在
      const existing = await db
        .select()
        .from(liveRooms)
        .where(
          and(
            eq(liveRooms.userId, parseInt(userId)),
            eq(liveRooms.platform, room.platform),
            eq(liveRooms.roomId, room.roomId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // 更新已存在的记录
        const [updated] = await db
          .update(liveRooms)
          .set({
            anchorName: room.anchorName,
            avatarUrl: room.avatarUrl,
            originalUrl: room.originalUrl,
            category: room.category,
            note: room.note,
            notificationEnabled: room.notificationEnabled ?? true
          })
          .where(eq(liveRooms.id, existing[0].id))
          .returning();
        syncedRooms.push(updated);
      } else {
        // 插入新记录
        const [inserted] = await db
          .insert(liveRooms)
          .values({
            uniqueId: room.id,
            userId: parseInt(userId),
            platform: room.platform,
            roomId: room.roomId,
            anchorName: room.anchorName,
            avatarUrl: room.avatarUrl,
            originalUrl: room.originalUrl,
            category: room.category,
            note: room.note,
            notificationEnabled: room.notificationEnabled ?? true
          })
          .returning();
        syncedRooms.push(inserted);
      }
    }

    return NextResponse.json({
      success: true,
      data: syncedRooms.map((room: any) => ({
        id: room.uniqueId,
        platform: room.platform,
        roomId: room.roomId,
        anchorName: room.anchorName,
        avatarUrl: room.avatarUrl,
        originalUrl: room.originalUrl,
        category: room.category,
        note: room.note,
        notificationEnabled: room.notificationEnabled,
        createdAt: room.createdAt?.toISOString()
      }))
    });
  } catch (error) {
    console.error('同步直播间失败:', error);
    return NextResponse.json(
      { success: false, message: '同步失败' },
      { status: 500 }
    );
  }
}
