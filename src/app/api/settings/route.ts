import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
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

    let settings = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, user.id)
    });

    if (!settings) {
      const [newSettings] = await db
        .insert(userSettings)
        .values({
          userId: user.id,
          appLockEnabled: false,
          privacyMode: false,
          watermarkEnabled: false,
          notificationEnabled: true,
          language: 'zh',
          currency: 'CNY'
        })
        .returning();
      settings = newSettings;
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

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

    const existing = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, user.id)
    });

    if (existing) {
      await db
        .update(userSettings)
        .set(body)
        .where(eq(userSettings.id, existing.id));
    } else {
      await db.insert(userSettings).values({ userId: user.id, ...body });
    }

    return NextResponse.json({ success: true, message: '设置已保存' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
