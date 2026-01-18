import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { reminders, jewelries } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// 获取保养提醒列表
export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // upcoming, overdue, all

    // 获取用户的保养提醒
    let reminderList: any[] = await db
      .select()
      .from(reminders)
      .where(
        and(eq(reminders.userId, user.id), eq(reminders.type, 'maintenance'))
      )
      .orderBy(reminders.triggerDate);

    const now = new Date();
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 根据类型筛选
    if (type === 'upcoming') {
      reminderList = reminderList.filter(
        (r: any) =>
          r.triggerDate &&
          new Date(r.triggerDate) >= now &&
          new Date(r.triggerDate) <= weekLater
      );
    } else if (type === 'overdue') {
      reminderList = reminderList.filter(
        (r: any) =>
          r.triggerDate && new Date(r.triggerDate) < now && !r.isEnabled
      );
    }

    // 获取保养指南
    const maintenanceGuides = getMaintenanceGuides();

    return NextResponse.json({
      success: true,
      data: {
        reminders: reminderList.map((r: any) => ({
          ...r,
          remindAt: r.triggerDate // 兼容前端字段名
        })),
        guides: maintenanceGuides,
        summary: {
          total: reminderList.length,
          upcoming: reminderList.filter(
            (r) =>
              r.triggerDate &&
              new Date(r.triggerDate) >= now &&
              new Date(r.triggerDate) <= weekLater
          ).length,
          overdue: reminderList.filter(
            (r) =>
              r.triggerDate && new Date(r.triggerDate) < now && !r.isEnabled
          ).length
        }
      }
    });
  } catch (error: any) {
    console.error('获取保养提醒失败:', error);
    return NextResponse.json(
      { success: false, message: error.message || '获取保养提醒失败' },
      { status: 500 }
    );
  }
}

// 创建保养提醒
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
    const { jewelryId, title, description, remindAt, repeatType } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, message: '请输入提醒标题' },
        { status: 400 }
      );
    }

    // 验证珠宝归属
    if (jewelryId) {
      const jewelry = await db.query.jewelries.findFirst({
        where: and(eq(jewelries.id, jewelryId), eq(jewelries.userId, user.id))
      });

      if (!jewelry) {
        return NextResponse.json(
          { success: false, message: '珠宝不存在或无权限' },
          { status: 404 }
        );
      }
    }

    const [reminder] = await db
      .insert(reminders)
      .values({
        userId: user.id,
        jewelryId: jewelryId || null,
        type: 'maintenance',
        title,
        message: description || null,
        triggerDate: remindAt
          ? new Date(remindAt).toISOString().split('T')[0]
          : null,
        repeatType: repeatType || 'none',
        isEnabled: true
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: reminder
    });
  } catch (error: any) {
    console.error('创建保养提醒失败:', error);
    return NextResponse.json(
      { success: false, message: error.message || '创建保养提醒失败' },
      { status: 500 }
    );
  }
}

// 更新保养提醒（标记完成/修改）
export async function PUT(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, isCompleted, title, description, remindAt } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: '提醒ID不能为空' },
        { status: 400 }
      );
    }

    // 验证提醒归属
    const existingReminder = await db.query.reminders.findFirst({
      where: and(eq(reminders.id, id), eq(reminders.userId, user.id))
    });

    if (!existingReminder) {
      return NextResponse.json(
        { success: false, message: '提醒不存在或无权限' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (isCompleted !== undefined) {
      // isCompleted=true 表示已完成，对应 isEnabled=false
      updateData.isEnabled = !isCompleted;
      if (isCompleted) {
        updateData.lastTriggered = new Date();

        // 如果是重复提醒，创建下一次提醒
        if (
          existingReminder.repeatType &&
          existingReminder.repeatType !== 'none' &&
          existingReminder.triggerDate
        ) {
          const nextRemindAt = calculateNextRemindDate(
            new Date(existingReminder.triggerDate),
            existingReminder.repeatType
          );

          await db.insert(reminders).values({
            userId: user.id,
            jewelryId: existingReminder.jewelryId,
            type: 'maintenance',
            title: existingReminder.title,
            message: existingReminder.message,
            triggerDate: nextRemindAt.toISOString().split('T')[0],
            repeatType: existingReminder.repeatType,
            isEnabled: true
          });
        }
      }
    }
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.message = description;
    if (remindAt !== undefined)
      updateData.triggerDate = new Date(remindAt).toISOString().split('T')[0];

    const [updatedReminder] = await db
      .update(reminders)
      .set(updateData)
      .where(eq(reminders.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedReminder
    });
  } catch (error: any) {
    console.error('更新保养提醒失败:', error);
    return NextResponse.json(
      { success: false, message: error.message || '更新保养提醒失败' },
      { status: 500 }
    );
  }
}

// 删除保养提醒
export async function DELETE(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: '提醒ID不能为空' },
        { status: 400 }
      );
    }

    // 验证提醒归属
    const existingReminder = await db.query.reminders.findFirst({
      where: and(eq(reminders.id, parseInt(id)), eq(reminders.userId, user.id))
    });

    if (!existingReminder) {
      return NextResponse.json(
        { success: false, message: '提醒不存在或无权限' },
        { status: 404 }
      );
    }

    await db.delete(reminders).where(eq(reminders.id, parseInt(id)));

    return NextResponse.json({
      success: true,
      message: '删除成功'
    });
  } catch (error: any) {
    console.error('删除保养提醒失败:', error);
    return NextResponse.json(
      { success: false, message: error.message || '删除保养提醒失败' },
      { status: 500 }
    );
  }
}

// 计算下一次提醒日期
function calculateNextRemindDate(currentDate: Date, repeatType: string): Date {
  const next = new Date(currentDate);

  switch (repeatType) {
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      break;
  }

  return next;
}

// 获取保养指南
function getMaintenanceGuides() {
  return [
    {
      material: '黄金',
      icon: '🥇',
      tips: [
        '避免接触化妆品、香水、漂白剂等化学物品',
        '洗澡、游泳、运动时建议取下',
        '用软布轻轻擦拭保持光泽',
        '定期用温水加中性洗涤剂清洗',
        '单独存放，避免与其他首饰摩擦'
      ],
      frequency: '每月清洁1次，每年专业保养1次',
      warning: '黄金较软，避免重压和拉扯'
    },
    {
      material: '铂金',
      icon: '⚪',
      tips: [
        '可用温肥皂水清洗，软毛刷轻刷',
        '避免接触含氯的清洁剂',
        '定期检查镶嵌是否牢固',
        '可送专业店进行抛光处理',
        '与黄金分开存放'
      ],
      frequency: '每2-3个月清洁1次',
      warning: '铂金表面可能产生细微划痕，属正常现象'
    },
    {
      material: '钻石',
      icon: '💎',
      tips: [
        '钻石亲油，需定期清洁以保持火彩',
        '用软毛牙刷蘸温水轻刷',
        '避免大力撞击，可能造成崩裂',
        '每年检查镶嵌是否松动',
        '存放时避免钻石间相互摩擦'
      ],
      frequency: '每月清洁1次，每年检查镶嵌',
      warning: '虽然钻石硬度高，但韧性一般，避免撞击'
    },
    {
      material: '翡翠',
      icon: '🟢',
      tips: [
        '避免高温和阳光直射',
        '避免接触化学物品和油污',
        '用清水冲洗，软布擦干',
        '定期补充水分，可用湿布包裹',
        '避免摔落和撞击'
      ],
      frequency: '每周用清水冲洗，每月用湿布保养',
      warning: '翡翠怕高温，切勿用热水或蒸汽清洗'
    },
    {
      material: '珍珠',
      icon: '🫧',
      tips: [
        '珍珠最怕干燥，需保持适当湿度',
        '避免接触香水、发胶等化学品',
        '佩戴后用柔软湿布轻擦',
        '定期用清水浸泡10分钟',
        '避免与硬物接触，单独存放'
      ],
      frequency: '每次佩戴后擦拭，每月清水浸泡',
      warning: '珍珠有机质易损，是最娇贵的宝石之一'
    },
    {
      material: '白银',
      icon: '🥈',
      tips: [
        '银饰氧化变黑是正常现象',
        '用专用银布或银洗水清洁',
        '不戴时密封保存减少氧化',
        '避免接触硫化物（如鸡蛋、温泉）',
        '可用牙膏轻轻擦拭恢复光泽'
      ],
      frequency: '每周擦拭，变黑时清洁',
      warning: '镀层银饰不可用银洗水，会损坏镀层'
    }
  ];
}
