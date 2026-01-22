import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { liveRooms, liveStatusCache, notifications } from '@/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';

// 直播提醒检测API - 由定时任务调用
// 检测所有启用提醒的直播间状态，发现开播则创建通知

export async function POST(request: NextRequest) {
  try {
    // 验证调用来源（可以添加secret key验证）
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    // 获取所有启用提醒的直播间
    const roomsWithNotification = await db
      .select({
        id: liveRooms.id,
        uniqueId: liveRooms.uniqueId,
        userId: liveRooms.userId,
        platform: liveRooms.platform,
        roomId: liveRooms.roomId,
        anchorName: liveRooms.anchorName,
        avatarUrl: liveRooms.avatarUrl
      })
      .from(liveRooms)
      .where(eq(liveRooms.notificationEnabled, true));

    if (roomsWithNotification.length === 0) {
      return NextResponse.json({
        success: true,
        message: '没有需要检测的直播间',
        checked: 0,
        notified: 0
      });
    }

    const results = {
      checked: 0,
      notified: 0,
      errors: [] as string[]
    };

    // 检测每个直播间的状态
    for (const room of roomsWithNotification) {
      try {
        results.checked++;

        // 获取缓存的状态
        const [cachedStatus] = await db
          .select()
          .from(liveStatusCache)
          .where(
            and(
              eq(liveStatusCache.platform, room.platform),
              eq(liveStatusCache.roomId, room.roomId)
            )
          )
          .limit(1);

        // 检查是否刚开播（状态从offline变为online）
        const isLive = cachedStatus?.isLive ?? false;
        const wasNotified = cachedStatus?.lastNotifiedAt !== null;

        // 如果正在直播且未通知过
        if (isLive && !wasNotified) {
          // 创建通知
          await db.insert(notifications).values({
            userId: room.userId,
            type: 'live_start',
            title: '直播开始',
            content: `${room.anchorName} 开始直播了！`,
            data: JSON.stringify({
              platform: room.platform,
              roomId: room.roomId,
              anchorName: room.anchorName,
              avatarUrl: room.avatarUrl
            }),
            isRead: false
          });

          // 更新通知时间
          await db
            .update(liveStatusCache)
            .set({ lastNotifiedAt: new Date() })
            .where(
              and(
                eq(liveStatusCache.platform, room.platform),
                eq(liveStatusCache.roomId, room.roomId)
              )
            );

          results.notified++;
          console.log(
            `[LiveNotification] 已通知: ${room.anchorName} (${room.platform}/${room.roomId})`
          );
        }

        // 如果直播已结束，清除通知标记（下次开播可以再次通知）
        if (!isLive && wasNotified) {
          await db
            .update(liveStatusCache)
            .set({ lastNotifiedAt: null })
            .where(
              and(
                eq(liveStatusCache.platform, room.platform),
                eq(liveStatusCache.roomId, room.roomId)
              )
            );
        }
      } catch (error: any) {
        results.errors.push(
          `${room.platform}/${room.roomId}: ${error.message}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `检测完成`,
      ...results
    });
  } catch (error) {
    console.error('直播提醒检测失败:', error);
    return NextResponse.json(
      { success: false, message: '检测失败' },
      { status: 500 }
    );
  }
}

// 获取用户的直播通知列表
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-Id');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: '未登录' },
        { status: 401 }
      );
    }

    const liveNotifications = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, parseInt(userId)),
          eq(notifications.type, 'live_start')
        )
      )
      .orderBy(notifications.createdAt)
      .limit(50);

    return NextResponse.json({
      success: true,
      data: liveNotifications
    });
  } catch (error) {
    console.error('获取直播通知失败:', error);
    return NextResponse.json(
      { success: false, message: '获取失败' },
      { status: 500 }
    );
  }
}
