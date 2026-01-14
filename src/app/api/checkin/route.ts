import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dailyCheckins, userLevels } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { AchievementService } from '@/service/achievement.service';

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    const todayCheckin = await db.query.dailyCheckins.findFirst({
      where: and(
        eq(dailyCheckins.userId, user.id),
        eq(dailyCheckins.checkinDate, today)
      )
    });

    const recentCheckins = await db.query.dailyCheckins.findMany({
      where: eq(dailyCheckins.userId, user.id),
      orderBy: [desc(dailyCheckins.checkinDate)],
      limit: 30
    });

    const currentStreak = recentCheckins[0]?.streak || 0;

    return NextResponse.json({
      success: true,
      data: {
        checkedInToday: !!todayCheckin,
        currentStreak,
        recentCheckins
      }
    });
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

    const today = new Date().toISOString().split('T')[0];

    const existing = await db.query.dailyCheckins.findFirst({
      where: and(
        eq(dailyCheckins.userId, user.id),
        eq(dailyCheckins.checkinDate, today)
      )
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: '今日已签到' },
        { status: 400 }
      );
    }

    // 计算连续签到天数
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const yesterdayCheckin = await db.query.dailyCheckins.findFirst({
      where: and(
        eq(dailyCheckins.userId, user.id),
        eq(dailyCheckins.checkinDate, yesterdayStr)
      )
    });

    const streak = yesterdayCheckin ? (yesterdayCheckin.streak || 0) + 1 : 1;
    const points = Math.min(streak * 5, 50); // 最多50积分

    const [checkin] = await db
      .insert(dailyCheckins)
      .values({
        userId: user.id,
        checkinDate: today,
        streak,
        points
      })
      .returning();

    // 更新用户经验
    const level = await db.query.userLevels.findFirst({
      where: eq(userLevels.userId, user.id)
    });

    if (level) {
      await db
        .update(userLevels)
        .set({ exp: (level.exp || 0) + points })
        .where(eq(userLevels.id, level.id));
    }

    // 检查成就
    await AchievementService.checkAndUnlock({
      type: 'daily_checkin',
      userId: user.id,
      data: { streak }
    });

    return NextResponse.json({
      success: true,
      data: {
        streak,
        points,
        message: `签到成功！连续签到${streak}天，获得${points}积分`
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
