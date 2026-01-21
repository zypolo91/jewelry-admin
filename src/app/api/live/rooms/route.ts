import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { liveRooms, liveStatusCache } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// 获取直播间列表
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-Id');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: '未登录' },
        { status: 401 }
      );
    }

    const rooms = await db
      .select()
      .from(liveRooms)
      .where(eq(liveRooms.userId, parseInt(userId)))
      .orderBy(liveRooms.sortOrder);

    return NextResponse.json({
      success: true,
      data: rooms.map((room: any) => ({
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
    console.error('获取直播间列表失败:', error);
    return NextResponse.json(
      { success: false, message: '获取失败' },
      { status: 500 }
    );
  }
}

// 添加直播间
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

    // 检查是否已存在
    const existing = await db
      .select()
      .from(liveRooms)
      .where(
        and(
          eq(liveRooms.userId, parseInt(userId)),
          eq(liveRooms.platform, body.platform),
          eq(liveRooms.roomId, body.roomId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: '直播间已存在' },
        { status: 400 }
      );
    }

    const [room] = await db
      .insert(liveRooms)
      .values({
        uniqueId: body.id,
        userId: parseInt(userId),
        platform: body.platform,
        roomId: body.roomId,
        anchorName: body.anchorName,
        avatarUrl: body.avatarUrl,
        originalUrl: body.originalUrl,
        category: body.category,
        note: body.note,
        notificationEnabled: body.notificationEnabled ?? true
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: {
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
      }
    });
  } catch (error) {
    console.error('添加直播间失败:', error);
    return NextResponse.json(
      { success: false, message: '添加失败' },
      { status: 500 }
    );
  }
}
