import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userAchievements, userLevels, achievements } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const achievementId = parseInt(id);

    const userAchievement = await db.query.userAchievements.findFirst({
      where: and(
        eq(userAchievements.userId, user.id),
        eq(userAchievements.achievementId, achievementId)
      )
    });

    if (!userAchievement) {
      return NextResponse.json(
        { success: false, message: '成就不存在' },
        { status: 404 }
      );
    }

    if (!userAchievement.unlockedAt) {
      return NextResponse.json(
        { success: false, message: '成就尚未解锁' },
        { status: 400 }
      );
    }

    if (userAchievement.isClaimed) {
      return NextResponse.json(
        { success: false, message: '奖励已领取' },
        { status: 400 }
      );
    }

    const achievement = await db.query.achievements.findFirst({
      where: eq(achievements.id, achievementId)
    });

    if (!achievement) {
      return NextResponse.json(
        { success: false, message: '成就定义不存在' },
        { status: 404 }
      );
    }

    // 更新成就为已领取
    await db
      .update(userAchievements)
      .set({ isClaimed: true })
      .where(eq(userAchievements.id, userAchievement.id));

    // 更新用户等级和积分
    const level = await db.query.userLevels.findFirst({
      where: eq(userLevels.userId, user.id)
    });

    const points = achievement.points || 10;
    const exp = points * 2;

    if (level) {
      const newExp = (level.exp || 0) + exp;
      const newPoints = (level.totalPoints || 0) + points;
      let newLevel = level.level || 1;
      let newTitle = level.title || '收藏新手';

      // 简单的等级计算
      if (newExp >= 10000) {
        newLevel = 5;
        newTitle = '珠宝大师';
      } else if (newExp >= 2000) {
        newLevel = 4;
        newTitle = '鉴赏专家';
      } else if (newExp >= 500) {
        newLevel = 3;
        newTitle = '收藏达人';
      } else if (newExp >= 100) {
        newLevel = 2;
        newTitle = '珠宝爱好者';
      }

      await db
        .update(userLevels)
        .set({
          exp: newExp,
          totalPoints: newPoints,
          level: newLevel,
          title: newTitle
        })
        .where(eq(userLevels.id, level.id));
    }

    return NextResponse.json({
      success: true,
      data: {
        reward: { points, exp },
        message: `恭喜获得 ${points} 积分和 ${exp} 经验值！`
      }
    });
  } catch (error: any) {
    console.error('领取成就奖励失败:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
