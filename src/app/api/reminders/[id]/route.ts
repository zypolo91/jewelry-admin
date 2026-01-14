import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { reminders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(
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
    const reminderId = parseInt(id);
    const reminder = await db.query.reminders.findFirst({
      where: eq(reminders.id, reminderId)
    });

    if (!reminder || reminder.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: '提醒不存在' },
        { status: 404 }
      );
    }

    const body = await request.json();
    await db.update(reminders).set(body).where(eq(reminders.id, reminderId));

    return NextResponse.json({ success: true, message: '更新成功' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const reminderId = parseInt(id);
    const reminder = await db.query.reminders.findFirst({
      where: eq(reminders.id, reminderId)
    });

    if (!reminder || reminder.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: '提醒不存在' },
        { status: 404 }
      );
    }

    await db.delete(reminders).where(eq(reminders.id, reminderId));

    return NextResponse.json({ success: true, message: '删除成功' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
