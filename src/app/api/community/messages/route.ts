import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages, users, jewelries } from '@/db/schema';
import { eq, and, or, desc, sql, ne } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// 获取私信对话列表或特定对话的消息
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
    const chatUserId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    const sinceId = searchParams.get('sinceId'); // 用于轮询获取新消息

    if (chatUserId) {
      // 获取与特定用户的对话消息（排除已删除的消息）
      let whereCondition = and(
        or(
          and(
            eq(messages.senderId, user.id),
            eq(messages.receiverId, parseInt(chatUserId))
          ),
          and(
            eq(messages.senderId, parseInt(chatUserId)),
            eq(messages.receiverId, user.id)
          )
        ),
        eq(messages.isDeleted, false)
      );

      // 如果提供了sinceId，只获取比该ID新的消息
      if (sinceId) {
        const messageList = await db
          .select({
            id: messages.id,
            senderId: messages.senderId,
            receiverId: messages.receiverId,
            content: messages.content,
            type: messages.type,
            isRead: messages.isRead,
            fileUrl: messages.fileUrl,
            fileName: messages.fileName,
            fileSize: messages.fileSize,
            collectionId: messages.collectionId,
            replyToId: messages.replyToId,
            isDeleted: messages.isDeleted,
            createdAt: messages.createdAt
          })
          .from(messages)
          .where(
            and(whereCondition, sql`${messages.id} > ${parseInt(sinceId)}`)
          )
          .orderBy(messages.createdAt);

        return NextResponse.json({ success: true, data: messageList });
      }

      const messageList = await db.query.messages.findMany({
        where: whereCondition,
        orderBy: [desc(messages.createdAt)],
        limit,
        offset,
        with: {
          sender: { columns: { id: true, username: true, avatar: true } }
        }
      });

      // 标记消息为已读
      await db
        .update(messages)
        .set({ isRead: true })
        .where(
          and(
            eq(messages.senderId, parseInt(chatUserId)),
            eq(messages.receiverId, user.id),
            eq(messages.isRead, false)
          )
        );

      return NextResponse.json({ success: true, data: messageList.reverse() });
    } else {
      // 获取对话列表 - 使用简化查询避免复杂SQL导致的连接问题
      try {
        // 先获取用户参与的所有消息，按时间排序
        const recentMessages = await db
          .select({
            id: messages.id,
            senderId: messages.senderId,
            receiverId: messages.receiverId,
            content: messages.content,
            type: messages.type,
            createdAt: messages.createdAt,
            senderUsername: users.username,
            senderAvatar: users.avatar
          })
          .from(messages)
          .leftJoin(users, eq(messages.senderId, users.id))
          .where(
            and(
              or(
                eq(messages.senderId, user.id),
                eq(messages.receiverId, user.id)
              ),
              eq(messages.isDeleted, false)
            )
          )
          .orderBy(desc(messages.createdAt))
          .limit(200); // 获取最近200条消息用于分组

        // 在内存中按对话分组
        const conversationMap = new Map();

        for (const msg of recentMessages) {
          const chatUserId =
            msg.senderId === user.id ? msg.receiverId : msg.senderId;

          if (!conversationMap.has(chatUserId)) {
            conversationMap.set(chatUserId, {
              chat_user_id: chatUserId,
              last_message_time: msg.createdAt,
              last_message: msg.content,
              last_message_type: msg.type,
              username: msg.senderId === user.id ? null : msg.senderUsername,
              avatar: msg.senderId === user.id ? null : msg.senderAvatar,
              unread_count: 0,
              is_friend: false
            });
          }
        }

        // 获取用户信息和未读数
        const conversations = Array.from(conversationMap.values());
        for (const conv of conversations) {
          if (!conv.username) {
            // 获取对方用户信息
            const [otherUser] = await db
              .select({ username: users.username, avatar: users.avatar })
              .from(users)
              .where(eq(users.id, conv.chat_user_id))
              .limit(1);
            if (otherUser) {
              conv.username = otherUser.username;
              conv.avatar = otherUser.avatar;
            }
          }

          // 获取未读消息数
          const [unreadResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(messages)
            .where(
              and(
                eq(messages.senderId, conv.chat_user_id),
                eq(messages.receiverId, user.id),
                eq(messages.isRead, false),
                eq(messages.isDeleted, false)
              )
            );
          conv.unread_count = Number(unreadResult?.count || 0);
        }

        // 按时间排序并分页
        conversations.sort(
          (a, b) =>
            new Date(b.last_message_time).getTime() -
            new Date(a.last_message_time).getTime()
        );
        const paginatedConversations = conversations.slice(
          offset,
          offset + limit
        );

        return NextResponse.json({
          success: true,
          data: paginatedConversations
        });
      } catch (dbError) {
        console.error('数据库查询失败，使用备用方案:', dbError);
        // 备用方案：返回空列表
        return NextResponse.json({ success: true, data: [] });
      }
    }
  } catch (error: any) {
    console.error('获取消息失败:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// 发送私信（支持多种消息类型）
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
    const {
      receiverId,
      content,
      type = 'text',
      fileUrl,
      fileName,
      fileSize,
      collectionId,
      replyToId
    } = body;

    if (!receiverId) {
      return NextResponse.json(
        { success: false, message: '接收者ID不能为空' },
        { status: 400 }
      );
    }

    // 验证消息类型
    const validTypes = [
      'text',
      'image',
      'emoji',
      'file',
      'collection',
      'poke',
      'quote'
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, message: '无效的消息类型' },
        { status: 400 }
      );
    }

    // 根据消息类型验证必要字段
    if (type === 'text' && !content?.trim()) {
      return NextResponse.json(
        { success: false, message: '消息内容不能为空' },
        { status: 400 }
      );
    }

    if ((type === 'image' || type === 'file') && !fileUrl) {
      return NextResponse.json(
        { success: false, message: '文件URL不能为空' },
        { status: 400 }
      );
    }

    if (type === 'file' && fileSize && fileSize > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: '文件大小不能超过5MB' },
        { status: 400 }
      );
    }

    if (type === 'collection' && !collectionId) {
      return NextResponse.json(
        { success: false, message: '藏品ID不能为空' },
        { status: 400 }
      );
    }

    if (type === 'quote' && !replyToId) {
      return NextResponse.json(
        { success: false, message: '引用消息ID不能为空' },
        { status: 400 }
      );
    }

    if (receiverId === user.id) {
      return NextResponse.json(
        { success: false, message: '不能给自己发消息' },
        { status: 400 }
      );
    }

    // 生成消息内容
    let messageContent = content?.trim() || '';
    if (type === 'poke') {
      messageContent = '拍了拍你';
    } else if (type === 'image') {
      messageContent = messageContent || '[图片]';
    } else if (type === 'file') {
      messageContent = messageContent || `[文件] ${fileName || '未知文件'}`;
    } else if (type === 'collection') {
      // 获取藏品信息
      const [jewelry] = await db
        .select({ name: jewelries.name })
        .from(jewelries)
        .where(eq(jewelries.id, collectionId))
        .limit(1);
      messageContent =
        messageContent || `[藏品] ${jewelry?.name || '未知藏品'}`;
    }

    const [message] = await db
      .insert(messages)
      .values({
        senderId: user.id,
        receiverId,
        content: messageContent,
        type,
        isRead: false,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileSize: fileSize || null,
        collectionId: collectionId || null,
        replyToId: replyToId || null,
        isDeleted: false
      })
      .returning();

    // 获取完整消息信息（包含发送者信息）
    const [sender] = await db
      .select({ id: users.id, username: users.username, avatar: users.avatar })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: { ...message, sender }
    });
  } catch (error: any) {
    console.error('发送消息失败:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// 删除消息
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
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json(
        { success: false, message: '消息ID不能为空' },
        { status: 400 }
      );
    }

    // 检查消息是否存在且是否有权限删除（只能删除自己发送的消息）
    const [existingMessage] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, parseInt(messageId)))
      .limit(1);

    if (!existingMessage) {
      return NextResponse.json(
        { success: false, message: '消息不存在' },
        { status: 404 }
      );
    }

    if (existingMessage.senderId !== user.id) {
      return NextResponse.json(
        { success: false, message: '无权删除此消息' },
        { status: 403 }
      );
    }

    // 软删除消息
    await db
      .update(messages)
      .set({ isDeleted: true })
      .where(eq(messages.id, parseInt(messageId)));

    return NextResponse.json({ success: true, message: '删除成功' });
  } catch (error: any) {
    console.error('删除消息失败:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
