import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { topics, posts, likes, comments } from '@/db/schema';
import { desc, eq, sql, gte, and } from 'drizzle-orm';

// 热门话题算法：基于近7天的帖子数、点赞数、评论数加权计算热度值
// 热度 = 帖子数 * 10 + 点赞数 * 3 + 评论数 * 5
async function calculateTopicHeat(topicId: number): Promise<number> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // 获取该话题下近7天的帖子
  const recentPosts = await db.query.posts.findMany({
    where: and(eq(posts.topicId, topicId), gte(posts.createdAt, sevenDaysAgo))
  });

  const postCount = recentPosts.length;
  let totalLikes = 0;
  let totalComments = 0;

  for (const post of recentPosts) {
    totalLikes += post.likeCount || 0;
    totalComments += post.commentCount || 0;
  }

  // 热度算法：帖子权重10，点赞权重3，评论权重5
  return postCount * 10 + totalLikes * 3 + totalComments * 5;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hot = searchParams.get('hot') === 'true';

    const topicList = await db.query.topics.findMany({
      orderBy: [desc(topics.sortOrder)]
    });

    if (hot) {
      // 计算每个话题的热度并排序
      const topicsWithHeat = await Promise.all(
        topicList.map(async (topic: any) => {
          const heat = await calculateTopicHeat(topic.id);
          return { ...topic, heat };
        })
      );

      // 按热度排序，取前10
      topicsWithHeat.sort((a, b) => b.heat - a.heat);
      return NextResponse.json({
        success: true,
        data: topicsWithHeat.slice(0, 10)
      });
    }

    return NextResponse.json({ success: true, data: topicList });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// 创建话题
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, icon, color, description } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: '话题名称不能为空' },
        { status: 400 }
      );
    }

    const [topic] = await db
      .insert(topics)
      .values({
        name,
        icon: icon || '💬',
        color: color || '#6366F1',
        description,
        postCount: 0,
        sortOrder: 0
      })
      .returning();

    return NextResponse.json({ success: true, data: topic });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
