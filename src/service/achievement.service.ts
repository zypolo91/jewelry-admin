import { db } from '@/db';
import { achievements, userAchievements, jewelries } from '@/db/schema';
import { eq, and, count, sum } from 'drizzle-orm';

export interface AchievementEvent {
  type:
    | 'jewelry_added'
    | 'jewelry_deleted'
    | 'value_updated'
    | 'daily_checkin'
    | 'share'
    | 'post_created';
  userId: number;
  data?: any;
}

export class AchievementService {
  static async checkAndUnlock(event: AchievementEvent): Promise<any[]> {
    const unlockedAchievements: any[] = [];
    const { userId, type } = event;

    const userStats = await this.getUserStats(userId);
    const allAchievements = await db.query.achievements.findMany();

    for (const achievement of allAchievements) {
      const existing = await db.query.userAchievements.findFirst({
        where: and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievement.id)
        )
      });

      if (existing?.unlockedAt) continue;

      const progress = this.calculateProgress(achievement, userStats);
      const isUnlocked = progress >= achievement.conditionValue;

      if (existing) {
        await db
          .update(userAchievements)
          .set({
            progress,
            unlockedAt: isUnlocked ? new Date() : null
          })
          .where(eq(userAchievements.id, existing.id));
      } else {
        await db.insert(userAchievements).values({
          userId,
          achievementId: achievement.id,
          progress,
          unlockedAt: isUnlocked ? new Date() : null
        });
      }

      if (isUnlocked && !existing?.unlockedAt) {
        unlockedAchievements.push(achievement);
      }
    }

    return unlockedAchievements;
  }

  static async getUserStats(userId: number) {
    const jewelryCount = await db
      .select({ count: count() })
      .from(jewelries)
      .where(eq(jewelries.userId, userId));

    const totalValue = await db
      .select({ sum: sum(jewelries.currentValue) })
      .from(jewelries)
      .where(eq(jewelries.userId, userId));

    return {
      jewelryCount: jewelryCount[0]?.count || 0,
      totalValue: Number(totalValue[0]?.sum) || 0
    };
  }

  static calculateProgress(achievement: any, stats: any): number {
    switch (achievement.conditionType) {
      case 'jewelry_count':
        return stats.jewelryCount;
      case 'total_value':
        return stats.totalValue;
      default:
        return 0;
    }
  }

  static async initUserAchievements(userId: number) {
    const allAchievements = await db.query.achievements.findMany();
    const userStats = await this.getUserStats(userId);

    for (const achievement of allAchievements) {
      const existing = await db.query.userAchievements.findFirst({
        where: and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievement.id)
        )
      });

      if (!existing) {
        const progress = this.calculateProgress(achievement, userStats);
        await db.insert(userAchievements).values({
          userId,
          achievementId: achievement.id,
          progress,
          unlockedAt: progress >= achievement.conditionValue ? new Date() : null
        });
      }
    }
  }
}
