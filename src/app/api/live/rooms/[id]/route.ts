import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { liveRooms } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// 更新直播间
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('X-User-Id');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: '未登录' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id: roomId } = await params;

    const [room] = await db
      .update(liveRooms)
      .set({
        anchorName: body.anchorName,
        avatarUrl: body.avatarUrl,
        category: body.category,
        note: body.note,
        notificationEnabled: body.notificationEnabled,
        sortOrder: body.sortOrder
      })
      .where(
        and(
          eq(liveRooms.uniqueId, roomId),
          eq(liveRooms.userId, parseInt(userId))
        )
      )
      .returning();

    if (!room) {
      return NextResponse.json(
        { success: false, message: '直播间不存在' },
        { status: 404 }
      );
    }

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
    console.error('更新直播间失败:', error);
    return NextResponse.json(
      { success: false, message: '更新失败' },
      { status: 500 }
    );
  }
}

// 删除直播间
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('X-User-Id');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: '未登录' },
        { status: 401 }
      );
    }

    const { id: roomId } = await params;

    const result = await db
      .delete(liveRooms)
      .where(
        and(
          eq(liveRooms.uniqueId, roomId),
          eq(liveRooms.userId, parseInt(userId))
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, message: '直播间不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除直播间失败:', error);
    return NextResponse.json(
      { success: false, message: '删除失败' },
      { status: 500 }
    );
  }
}
