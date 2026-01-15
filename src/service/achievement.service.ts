import { db } from '@/db';
import {
  achievements,
  userAchievements,
  userLevels,
  jewelries,
  aiAuthentications,
  aiValuations,
  posts,
  likes,
  comments,
  dailyCheckins
} from '@/db/schema';
import { eq, and, count, sum, gte, desc } from 'drizzle-orm';

/**
 * 成就系统事件类型
 * - jewelry_added: 添加珠宝时触发
 * - jewelry_deleted: 删除珠宝时触发
 * - value_updated: 更新珠宝价值时触发
 * - daily_checkin: 每日签到时触发
 * - share: 分享内容时触发
 * - post_created: 发布动态时触发
 * - post_liked: 动态被点赞时触发
 * - comment_received: 收到评论时触发
 * - ai_auth: 使用AI真伪鉴定时触发
 * - ai_valuation: 使用AI估价时触发
 * - follow_gained: 获得粉丝时触发
 */
export interface AchievementEvent {
  type:
    | 'jewelry_added'
    | 'jewelry_deleted'
    | 'value_updated'
    | 'daily_checkin'
    | 'share'
    | 'post_created'
    | 'post_liked'
    | 'comment_received'
    | 'ai_auth'
    | 'ai_valuation'
    | 'follow_gained';
  userId: number;
  data?: any;
}

/**
 * 成就系统算法说明：
 *
 * 1. 进度计算 (calculateProgress)
 *    - 根据成就的 conditionType 从用户统计数据中获取对应值
 *    - 支持的条件类型：jewelry_count, total_value, ai_auth_count, ai_valuation_count,
 *      post_count, likes_received, comments_received, checkin_streak, follower_count
 *
 * 2. 解锁判定
 *    - 当 progress >= conditionValue 时解锁成就
 *    - 解锁后记录 unlockedAt 时间戳
 *
 * 3. 经验值计算 (calculateExperience)
 *    - 基础经验 = 成就积分 * 10
 *    - 稀有度加成：普通1x, 稀有1.5x, 史诗2x, 传说3x
 *
 * 4. 等级系统
 *    - 每100经验升1级
 *    - 升级时更新 userLevels 表
 *
 * 5. 触发时机
 *    - 在对应操作完成后调用 checkAndUnlock
 *    - 返回新解锁的成就列表用于前端通知
 */

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
    // 珠宝数量
    const jewelryCount = await db
      .select({ count: count() })
      .from(jewelries)
      .where(eq(jewelries.userId, userId));

    // 珠宝总价值
    const totalValue = await db
      .select({ sum: sum(jewelries.currentValue) })
      .from(jewelries)
      .where(eq(jewelries.userId, userId));

    // AI鉴定次数
    const aiAuthCount = await db
      .select({ count: count() })
      .from(aiAuthentications)
      .where(eq(aiAuthentications.userId, userId));

    // AI估价次数
    const aiValuationCount = await db
      .select({ count: count() })
      .from(aiValuations)
      .where(eq(aiValuations.userId, userId));

    // 发帖数量
    const postCount = await db
      .select({ count: count() })
      .from(posts)
      .where(eq(posts.userId, userId));

    // 获得的点赞数（所有帖子的点赞总和）
    const userPosts = await db.query.posts.findMany({
      where: eq(posts.userId, userId),
      columns: { id: true, likeCount: true, commentCount: true }
    });
    const likesReceived = userPosts.reduce(
      (acc: number, p: any) => acc + (p.likeCount || 0),
      0
    );

    // 获得的评论数
    const commentsReceived = userPosts.reduce(
      (acc: number, p: any) => acc + (p.commentCount || 0),
      0
    );

    // 签到连续天数
    const checkinStreak = await this.getCheckinStreak(userId);

    return {
      jewelryCount: Number(jewelryCount[0]?.count) || 0,
      totalValue: Number(totalValue[0]?.sum) || 0,
      aiAuthCount: Number(aiAuthCount[0]?.count) || 0,
      aiValuationCount: Number(aiValuationCount[0]?.count) || 0,
      postCount: Number(postCount[0]?.count) || 0,
      likesReceived,
      commentsReceived,
      checkinStreak
    };
  }

  // 计算签到连续天数
  static async getCheckinStreak(userId: number): Promise<number> {
    try {
      const checkins = await db.query.dailyCheckins.findMany({
        where: eq(dailyCheckins.userId, userId),
        orderBy: [desc(dailyCheckins.checkinDate)],
        limit: 30
      });

      if (checkins.length === 0) return 0;

      let streak = 1;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < checkins.length - 1; i++) {
        const current = new Date(checkins[i].checkinDate);
        const next = new Date(checkins[i + 1].checkinDate);
        current.setHours(0, 0, 0, 0);
        next.setHours(0, 0, 0, 0);

        const diffDays =
          (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays === 1) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    } catch {
      return 0;
    }
  }

  static calculateProgress(achievement: any, stats: any): number {
    switch (achievement.conditionType) {
      case 'jewelry_count':
        return stats.jewelryCount;
      case 'total_value':
        return stats.totalValue;
      case 'ai_auth_count':
        return stats.aiAuthCount;
      case 'ai_valuation_count':
        return stats.aiValuationCount;
      case 'post_count':
        return stats.postCount;
      case 'likes_received':
        return stats.likesReceived;
      case 'comments_received':
        return stats.commentsReceived;
      case 'checkin_streak':
        return stats.checkinStreak;
      default:
        return 0;
    }
  }

  // 计算成就解锁获得的经验值
  static calculateExperience(achievement: any): number {
    const baseExp = (achievement.points || 10) * 10;
    const rarityMultiplier: Record<string, number> = {
      common: 1,
      rare: 1.5,
      epic: 2,
      legendary: 3
    };
    return Math.floor(baseExp * (rarityMultiplier[achievement.rarity] || 1));
  }

  // 更新用户等级
  static async updateUserLevel(userId: number, expGained: number) {
    try {
      let userLevel = await db.query.userLevels.findFirst({
        where: eq(userLevels.userId, userId)
      });

      if (!userLevel) {
        await db.insert(userLevels).values({
          userId,
          level: 1,
          experience: expGained,
          totalPoints: 0
        });
        return;
      }

      const newExp = (userLevel.experience || 0) + expGained;
      const expPerLevel = 100;
      const newLevel = Math.floor(newExp / expPerLevel) + 1;

      await db
        .update(userLevels)
        .set({
          experience: newExp,
          level: newLevel
        })
        .where(eq(userLevels.userId, userId));
    } catch (error) {
      console.error('更新用户等级失败:', error);
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
