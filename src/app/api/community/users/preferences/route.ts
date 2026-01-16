import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userPreferences } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

/**
 * 获取用户偏好设置
 * GET /api/community/users/preferences
 */
export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const [pref] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: pref || {
        reducedCategories: [],
        reducedTopics: [],
        blockedUsers: [],
        notInterestedPosts: []
      }
    });
  } catch (error) {
    console.error('获取用户偏好失败:', error);
    return NextResponse.json({ error: '获取用户偏好失败' }, { status: 500 });
  }
}

/**
 * 更新用户偏好设置
 * POST /api/community/users/preferences
 *
 * Body:
 * - action: 'reduce_category' | 'reduce_topic' | 'not_interested' | 'block_user'
 * - value: string | number (分类名/话题名/帖子ID/用户ID)
 */
export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body = await request.json();
    const { action, value } = body;

    if (!action || value === undefined) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    // 获取当前偏好或创建新的
    let [currentPref] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    if (!currentPref) {
      // 创建新的偏好记录
      const [newPref] = await db
        .insert(userPreferences)
        .values({
          userId: user.id,
          reducedCategories: [],
          reducedTopics: [],
          blockedUsers: [],
          notInterestedPosts: []
        })
        .returning();
      currentPref = newPref;
    }

    // 根据action更新对应的偏好
    let updateData: any = { updatedAt: new Date() };

    switch (action) {
      case 'reduce_category':
        const reducedCategories =
          (currentPref.reducedCategories as string[]) || [];
        if (!reducedCategories.includes(value)) {
          updateData.reducedCategories = [...reducedCategories, value];
        }
        break;

      case 'reduce_topic':
        const reducedTopics = (currentPref.reducedTopics as string[]) || [];
        if (!reducedTopics.includes(value)) {
          updateData.reducedTopics = [...reducedTopics, value];
        }
        break;

      case 'not_interested':
        const notInterestedPosts =
          (currentPref.notInterestedPosts as number[]) || [];
        if (!notInterestedPosts.includes(value)) {
          updateData.notInterestedPosts = [...notInterestedPosts, value];
        }
        break;

      case 'block_user':
        const blockedUsers = (currentPref.blockedUsers as number[]) || [];
        if (!blockedUsers.includes(value)) {
          updateData.blockedUsers = [...blockedUsers, value];
        }
        break;

      case 'unblock_user':
        const currentBlockedUsers =
          (currentPref.blockedUsers as number[]) || [];
        updateData.blockedUsers = currentBlockedUsers.filter(
          (id: number) => id !== value
        );
        break;

      case 'restore_category':
        const currentReducedCategories =
          (currentPref.reducedCategories as string[]) || [];
        updateData.reducedCategories = currentReducedCategories.filter(
          (cat: string) => cat !== value
        );
        break;

      default:
        return NextResponse.json({ error: '无效的操作类型' }, { status: 400 });
    }

    // 更新偏好
    await db
      .update(userPreferences)
      .set(updateData)
      .where(eq(userPreferences.userId, user.id));

    return NextResponse.json({
      success: true,
      message: '偏好已更新'
    });
  } catch (error) {
    console.error('更新用户偏好失败:', error);
    return NextResponse.json({ error: '更新用户偏好失败' }, { status: 500 });
  }
}
