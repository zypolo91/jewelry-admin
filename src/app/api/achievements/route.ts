import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { achievements, userAchievements, userLevels } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
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

    // 获取所有成就定义
    const allAchievements = await db.query.achievements.findMany({
      orderBy: [desc(achievements.sortOrder)]
    });

    // 获取用户成就进度
    const userAchievementList = await db.query.userAchievements.findMany({
      where: eq(userAchievements.userId, user.id)
    });

    const userAchievementMap = new Map(
      userAchievementList.map((ua: (typeof userAchievementList)[number]) => [
        ua.achievementId,
        ua
      ])
    );

    // 获取用户等级
    let level = await db.query.userLevels.findFirst({
      where: eq(userLevels.userId, user.id)
    });

    if (!level) {
      const [newLevel] = await db
        .insert(userLevels)
        .values({
          userId: user.id,
          level: 1,
          exp: 0,
          totalPoints: 0,
          title: '收藏新手'
        })
        .returning();
      level = newLevel;
    }

    const result = allAchievements.map(
      (a: (typeof allAchievements)[number]) => {
        const ua = userAchievementMap.get(a.id) as
          | (typeof userAchievementList)[number]
          | undefined;
        return {
          id: a.id,
          code: a.code,
          name: a.name,
          description: a.description,
          icon: a.icon,
          category: a.category,
          points: a.points,
          rarity: a.rarity,
          isHidden: a.isHidden,
          target: a.conditionValue,
          progress: ua?.progress || 0,
          isUnlocked: !!ua?.unlockedAt,
          unlockedAt: ua?.unlockedAt,
          isClaimed: ua?.isClaimed || false
        };
      }
    );

    const unlockedCount = result.filter(
      (r: (typeof result)[number]) => r.isUnlocked
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        achievements: result,
        userLevel: level,
        stats: {
          totalPoints: level.totalPoints,
          unlockedCount,
          totalCount: allAchievements.length
        }
      }
    });
  } catch (error: any) {
    console.error('获取成就列表失败:', error);
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
    const {
      code,
      name,
      description,
      icon,
      category,
      conditionType,
      conditionValue,
      points,
      rarity
    } = body;

    if (
      !code ||
      !name ||
      !category ||
      !conditionType ||
      conditionValue === undefined
    ) {
      return NextResponse.json(
        { success: false, message: '参数不完整' },
        { status: 400 }
      );
    }

    const [achievement] = await db
      .insert(achievements)
      .values({
        code,
        name,
        description,
        icon,
        category,
        conditionType,
        conditionValue,
        points: points || 10,
        rarity: rarity || 'common'
      })
      .returning();

    return NextResponse.json({ success: true, data: achievement });
  } catch (error: any) {
    console.error('创建成就失败:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
