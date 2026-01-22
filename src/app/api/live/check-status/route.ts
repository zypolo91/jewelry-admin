import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { liveRooms, liveStatusCache } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

// 批量检测直播状态并更新缓存
// 这个API会被定时任务调用，检测所有直播间的实时状态

interface DouyinRoomStatus {
  isLive: boolean;
  title?: string;
  viewerCount?: number;
  cover?: string;
}

// 检测抖音直播间状态
async function checkDouyinStatus(roomId: string): Promise<DouyinRoomStatus> {
  try {
    const response = await fetch(
      `https://live.douyin.com/webcast/room/web/enter/?aid=6383&app_name=douyin_web&live_id=1&device_platform=web&language=zh-CN&browser_language=zh-CN&browser_platform=Win32&browser_name=Edge&browser_version=125.0.0.0&web_rid=${roomId}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
          Referer: 'https://live.douyin.com/'
        }
      }
    );

    if (!response.ok) {
      return { isLive: false };
    }

    const data = await response.json();
    const roomData = data?.data?.data?.[0];

    if (!roomData) {
      return { isLive: false };
    }

    const status = roomData.status;
    const isLive = status === 2; // 2 = 直播中

    return {
      isLive,
      title: roomData.title,
      viewerCount: roomData.room_view_stats?.display_value,
      cover: roomData.cover?.url_list?.[0]
    };
  } catch (error) {
    console.error(`检测抖音直播间 ${roomId} 失败:`, error);
    return { isLive: false };
  }
}

export async function POST(request: NextRequest) {
  try {
    // 验证调用来源
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    // 获取所有需要检测的直播间（去重）
    const rooms = await db
      .selectDistinct({
        platform: liveRooms.platform,
        roomId: liveRooms.roomId
      })
      .from(liveRooms);

    if (rooms.length === 0) {
      return NextResponse.json({
        success: true,
        message: '没有需要检测的直播间',
        checked: 0
      });
    }

    const results = {
      checked: 0,
      online: 0,
      offline: 0,
      errors: [] as string[]
    };

    // 检测每个直播间
    for (const room of rooms) {
      try {
        results.checked++;

        let status: DouyinRoomStatus = { isLive: false };

        // 根据平台调用不同的检测方法
        if (room.platform === 'douyin') {
          status = await checkDouyinStatus(room.roomId);
        }
        // TODO: 添加其他平台支持

        if (status.isLive) {
          results.online++;
        } else {
          results.offline++;
        }

        // 更新或插入状态缓存
        const existing = await db
          .select()
          .from(liveStatusCache)
          .where(
            and(
              eq(liveStatusCache.platform, room.platform),
              eq(liveStatusCache.roomId, room.roomId)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(liveStatusCache)
            .set({
              isLive: status.isLive,
              title: status.title || existing[0].title,
              viewerCount: status.viewerCount || 0,
              cover: status.cover || existing[0].cover,
              lastCheckedAt: new Date()
            })
            .where(
              and(
                eq(liveStatusCache.platform, room.platform),
                eq(liveStatusCache.roomId, room.roomId)
              )
            );
        } else {
          await db.insert(liveStatusCache).values({
            platform: room.platform,
            roomId: room.roomId,
            isLive: status.isLive,
            title: status.title,
            viewerCount: status.viewerCount || 0,
            cover: status.cover,
            lastCheckedAt: new Date()
          });
        }
      } catch (error: any) {
        results.errors.push(
          `${room.platform}/${room.roomId}: ${error.message}`
        );
      }

      // 添加延迟避免请求过快
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return NextResponse.json({
      success: true,
      message: '状态检测完成',
      ...results
    });
  } catch (error) {
    console.error('直播状态检测失败:', error);
    return NextResponse.json(
      { success: false, message: '检测失败' },
      { status: 500 }
    );
  }
}
