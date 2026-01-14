import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { themes, userThemes } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);

    const themeList = await db.query.themes.findMany({
      where: eq(themes.isActive, true),
      orderBy: [desc(themes.sortOrder)]
    });

    let userOwnedThemes: number[] = [];
    let activeThemeId: number | null = null;

    if (user) {
      const owned = await db.query.userThemes.findMany({
        where: eq(userThemes.userId, user.id)
      });
      userOwnedThemes = owned.map((t: any) => t.themeId);
      const active = owned.find((t: any) => t.isActive);
      activeThemeId = active?.themeId || null;
    }

    const result = themeList.map((t: any) => ({
      ...t,
      isOwned: userOwnedThemes.includes(t.id),
      isActive: t.id === activeThemeId
    }));

    return NextResponse.json({ success: true, data: result });
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
    const { themeId } = body;

    if (!themeId) {
      return NextResponse.json(
        { success: false, message: '请选择主题' },
        { status: 400 }
      );
    }

    // 检查是否已拥有
    const owned = await db.query.userThemes.findFirst({
      where: and(
        eq(userThemes.userId, user.id),
        eq(userThemes.themeId, themeId)
      )
    });

    if (!owned) {
      // 购买/获取主题
      await db
        .insert(userThemes)
        .values({ userId: user.id, themeId, isActive: false });
    }

    // 设置为当前主题
    await db
      .update(userThemes)
      .set({ isActive: false })
      .where(eq(userThemes.userId, user.id));
    await db
      .update(userThemes)
      .set({ isActive: true })
      .where(
        and(eq(userThemes.userId, user.id), eq(userThemes.themeId, themeId))
      );

    return NextResponse.json({ success: true, message: '主题已应用' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
