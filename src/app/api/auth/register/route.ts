import { db } from '@/db';
import { roles, users } from '@/db/schema';
import { getDatabaseDialect } from '@/db/dialect';
import { logger } from '@/lib/logger';
import { errorResponse, successResponse } from '@/service/response';
import bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { eq } from 'drizzle-orm';

const DEFAULT_ROLE_NAME = '移动端用户';

async function ensureDefaultRole() {
  const exists = await db
    .select()
    .from(roles)
    .where(eq(roles.name, DEFAULT_ROLE_NAME))
    .limit(1);

  if (exists.length) return exists[0];

  const dialect = getDatabaseDialect();

  if (dialect === 'postgres') {
    const created = await db
      .insert(roles)
      .values({
        name: DEFAULT_ROLE_NAME,
        description: '移动端注册用户',
        isSuper: false
      })
      .returning({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        isSuper: roles.isSuper
      });

    return created[0];
  }

  const insertedId = await db
    .insert(roles)
    .values({
      name: DEFAULT_ROLE_NAME,
      description: '移动端注册用户',
      isSuper: false
    })
    .$returningId();

  const roleId = Array.isArray(insertedId)
    ? Number((insertedId as any[])[0])
    : Number(insertedId as number);

  return {
    id: roleId,
    name: DEFAULT_ROLE_NAME,
    description: '移动端注册用户',
    isSuper: false
  };
}

export async function POST(request: Request) {
  try {
    const { email, password, username } = await request.json();

    if (!email || !password || !username) {
      return errorResponse('请填写完整的注册信息');
    }

    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length) {
      await logger.warn('用户认证', '用户注册', '注册失败：邮箱已存在', {
        email,
        username,
        reason: '邮箱已存在',
        timestamp: new Date().toISOString()
      });
      return errorResponse('该邮箱已注册');
    }

    const role = await ensureDefaultRole();
    const saltRounds = Number(process.env.SALT_ROUNDS || 12);
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const dialect = getDatabaseDialect();

    let newUserId: number;

    if (dialect === 'postgres') {
      const inserted = await db
        .insert(users)
        .values({
          email,
          username,
          password: hashedPassword,
          roleId: role.id,
          status: 'active',
          avatar: '/avatars/default.jpg',
          isSuperAdmin: false
        })
        .returning({ id: users.id });

      newUserId = inserted[0].id;
    } else {
      const insertedId = await db
        .insert(users)
        .values({
          email,
          username,
          password: hashedPassword,
          roleId: role.id,
          status: 'active',
          avatar: '/avatars/default.jpg',
          isSuperAdmin: false
        })
        .$returningId();

      newUserId = Array.isArray(insertedId)
        ? Number((insertedId as any[])[0])
        : Number(insertedId as number);
    }

    const token = sign(
      {
        id: newUserId,
        email,
        username,
        roleId: role.id,
        avatar: '/avatars/default.jpg',
        isSuperAdmin: false
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    );

    await logger.info(
      '用户认证',
      '用户注册',
      '用户注册成功',
      {
        userId: newUserId,
        username,
        email,
        roleId: role.id,
        registerTime: new Date().toISOString(),
        tokenExpiry: '24小时'
      },
      newUserId
    );

    const response = successResponse({
      message: '注册成功',
      user: {
        id: newUserId,
        email,
        username,
        avatar: '/avatars/default.jpg',
        roleId: role.id,
        status: 'active',
        isSuperAdmin: false
      },
      token
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24
    });

    return response;
  } catch (error) {
    await logger.error('用户认证', '用户注册', '注册过程发生服务器错误', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return errorResponse('服务器错误');
  }
}
