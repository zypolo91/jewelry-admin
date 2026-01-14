import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { reminders } from '@/db/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const upcoming = searchParams.get('upcoming') === 'true';

    let whereConditions = [eq(reminders.userId, user.id)];
    if (type) whereConditions.push(eq(reminders.type, type));
    if (upcoming) {
      const today = new Date().toISOString().split('T')[0];
      whereConditions.push(gte(reminders.triggerDate, today));
    }

    const reminderList = await db.query.reminders.findMany({
      where: and(...whereConditions),
      orderBy: [desc(reminders.triggerDate)],
      with: { jewelry: true }
    });

    return NextResponse.json({ success: true, data: reminderList });
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

    const body = await request.json();
    const { jewelryId, type, title, message, triggerDate, repeatType } = body;

    if (!type || !title) {
      return NextResponse.json(
        { success: false, message: '参数不完整' },
        { status: 400 }
      );
    }

    const [reminder] = await db
      .insert(reminders)
      .values({
        userId: user.id,
        jewelryId: jewelryId || null,
        type,
        title,
        message,
        triggerDate,
        repeatType: repeatType || 'once',
        isEnabled: true
      })
      .returning();

    return NextResponse.json({ success: true, data: reminder });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
