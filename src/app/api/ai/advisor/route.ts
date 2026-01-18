import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { aiQuotas } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { zhipuAIService, ChatMessage } from '@/service/zhipu-ai.service';
import { getCurrentUser } from '@/lib/auth';

// AI珠宝顾问 - 多轮对话
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
    const { messages, topic } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, message: '请提供对话消息' },
        { status: 400 }
      );
    }

    // 检查AI顾问配额
    const quota = await db.query.aiQuotas.findFirst({
      where: and(
        eq(aiQuotas.userId, user.id),
        eq(aiQuotas.quotaType, 'advisor')
      )
    });

    if (quota && quota.usedQuota >= quota.totalQuota) {
      return NextResponse.json(
        {
          success: false,
          message: '本月AI顾问咨询次数已用完',
          quotaRemaining: 0
        },
        { status: 429 }
      );
    }

    // 根据主题选择系统提示词
    const systemPrompt = getSystemPromptByTopic(topic);

    // 构建对话消息，将系统提示作为第一条用户消息
    const chatMessages: ChatMessage[] = messages.map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }));

    // 在第一条消息前添加系统上下文
    if (chatMessages.length > 0 && chatMessages[0].role === 'user') {
      chatMessages[0].content = `${systemPrompt}\n\n用户问题：${chatMessages[0].content}`;
    }

    // 调用GLM-4 AI服务
    const response = await zhipuAIService.chat(chatMessages);

    // 更新配额
    if (quota) {
      await db
        .update(aiQuotas)
        .set({ usedQuota: (quota.usedQuota || 0) + 1 })
        .where(eq(aiQuotas.id, quota.id));
    }

    const quotaRemaining = quota
      ? quota.totalQuota - (quota.usedQuota || 0) - 1
      : 999;

    return NextResponse.json({
      success: true,
      data: {
        reply: response,
        topic: topic || 'general'
      },
      quotaRemaining
    });
  } catch (error: any) {
    console.error('AI顾问咨询失败:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'AI顾问咨询失败' },
      { status: 500 }
    );
  }
}

// 获取顾问话题列表
export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const topics = [
      {
        id: 'purchase',
        name: '购买建议',
        icon: '💎',
        description: '根据预算和需求推荐珠宝',
        examples: [
          '预算5万元，想买一枚求婚钻戒，有什么建议？',
          '送给妈妈60岁生日礼物，买什么珠宝好？',
          '第一次买翡翠，应该注意什么？'
        ]
      },
      {
        id: 'maintenance',
        name: '保养指南',
        icon: '🧹',
        description: '各类珠宝的保养方法',
        examples: [
          '黄金项链怎么清洗？',
          '翡翠手镯日常如何保养？',
          '钻戒可以戴着洗澡吗？'
        ]
      },
      {
        id: 'matching',
        name: '搭配推荐',
        icon: '👗',
        description: '根据场合推荐佩戴搭配',
        examples: [
          '参加婚礼应该戴什么首饰？',
          '职场面试戴什么耳环合适？',
          '日常通勤怎么搭配项链？'
        ]
      },
      {
        id: 'knowledge',
        name: '珠宝知识',
        icon: '📚',
        description: '珠宝相关知识问答',
        examples: [
          '钻石4C是什么意思？',
          '翡翠A货、B货、C货有什么区别？',
          '18K金和铂金哪个更好？'
        ]
      },
      {
        id: 'appraisal',
        name: '估值咨询',
        icon: '💰',
        description: '珠宝价值评估建议',
        examples: [
          '这颗1克拉钻石大概值多少钱？',
          '老黄金首饰怎么估价？',
          '翡翠手镯的价值主要看什么？'
        ]
      },
      {
        id: 'general',
        name: '综合咨询',
        icon: '💬',
        description: '其他珠宝相关问题',
        examples: ['怎么辨别真假黄金？', '网购珠宝靠谱吗？', '珠宝证书怎么看？']
      }
    ];

    // 获取用户配额
    const quota = await db.query.aiQuotas.findFirst({
      where: and(
        eq(aiQuotas.userId, user.id),
        eq(aiQuotas.quotaType, 'advisor')
      )
    });

    return NextResponse.json({
      success: true,
      data: {
        topics,
        quota: {
          total: quota?.totalQuota || 20,
          used: quota?.usedQuota || 0,
          remaining: (quota?.totalQuota || 20) - (quota?.usedQuota || 0)
        }
      }
    });
  } catch (error: any) {
    console.error('获取话题列表失败:', error);
    return NextResponse.json(
      { success: false, message: error.message || '获取话题列表失败' },
      { status: 500 }
    );
  }
}

function getSystemPromptByTopic(topic?: string): string {
  const basePrompt = `你是"宝宝顾问"，何宝宝的百宝箱App的专属AI珠宝顾问。
你精通各类珠宝知识，包括钻石、黄金、翡翠、和田玉、彩色宝石等。
回答要专业、准确、友好，避免过于冗长。
如果用户问题不属于珠宝领域，礼貌地引导回珠宝话题。`;

  const topicPrompts: Record<string, string> = {
    purchase: `${basePrompt}
当前话题：购买建议
- 根据用户预算和需求推荐合适的珠宝
- 分析不同选择的优缺点
- 提供实用的购买技巧
- 提醒购买注意事项和防骗要点`,

    maintenance: `${basePrompt}
当前话题：保养指南
- 提供不同材质珠宝的保养方法
- 说明日常佩戴注意事项
- 解答清洁和存放问题
- 提醒定期检查和保养时机`,

    matching: `${basePrompt}
当前话题：搭配推荐
- 根据场合推荐合适的珠宝搭配
- 考虑服装、肤色、脸型等因素
- 提供时尚搭配建议
- 分享流行趋势`,

    knowledge: `${basePrompt}
当前话题：珠宝知识
- 解答珠宝相关的专业知识
- 用通俗易懂的语言解释专业术语
- 介绍珠宝的历史文化
- 分享有趣的珠宝故事`,

    appraisal: `${basePrompt}
当前话题：估值咨询
- 说明影响珠宝价值的因素
- 提供估价参考和思路
- 解释市场价格波动
- 提醒估值是参考，非专业鉴定`,

    general: basePrompt
  };

  return topicPrompts[topic || 'general'] || basePrompt;
}
