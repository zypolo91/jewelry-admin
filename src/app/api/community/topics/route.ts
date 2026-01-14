import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { topics } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const topicList = await db.query.topics.findMany({
      orderBy: [desc(topics.sortOrder)]
    });

    return NextResponse.json({ success: true, data: topicList });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
