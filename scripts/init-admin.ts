import { db } from '../src/db';
import { users, roles, rolePermissions, permissions } from '../src/db/schema';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { surperAdmin } from '../src/config/surper-admin';
import { getDatabaseDialect } from '../src/db/dialect';

dotenv.config({ path: '.env.local' });
dotenv.config();

const dialect = getDatabaseDialect();

async function initSuperAdminRole() {
  console.log('开始初始化超级管理员角色...');

  const roleExists = await db
    .select()
    .from(roles)
    .where(eq(roles.name, '超级管理员'));

  const superAdminRole =
    roleExists.length > 0
      ? roleExists[0]
      : (
          await (dialect === 'postgres'
            ? db
                .insert(roles)
                .values({
                  name: '超级管理员',
                  description: '系统超级管理员，拥有所有权限',
                  isSuper: true
                })
                .returning({ id: roles.id })
            : db
                .insert(roles)
                .values({
                  name: '超级管理员',
                  description: '系统超级管理员，拥有所有权限',
                  isSuper: true
                })
                .$returningId())
        )[0];

  await syncFilePermissions(superAdminRole.id);

  console.log('超级管理员角色就绪');
  return superAdminRole;
}

async function upsertPermissionByCode(input: {
  code: string;
  name: string;
  description: string;
  parentId: number | null;
  sortOrder: number;
}): Promise<number> {
  const existing = await db
    .select({ id: permissions.id })
    .from(permissions)
    .where(eq(permissions.code, input.code))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(permissions).values({
      name: input.name,
      code: input.code,
      description: input.description,
      parentId: input.parentId,
      sortOrder: input.sortOrder
    });
  } else {
    await db
      .update(permissions)
      .set({
        name: input.name,
        description: input.description,
        parentId: input.parentId,
        sortOrder: input.sortOrder
      })
      .where(eq(permissions.id, existing[0].id));
  }

  const row = await db
    .select({ id: permissions.id })
    .from(permissions)
    .where(eq(permissions.code, input.code))
    .limit(1);

  return row[0].id as number;
}

async function syncFilePermissions(roleId: number) {
  console.log('同步文件管理权限...');

  const systemId = await upsertPermissionByCode({
    code: 'system',
    name: '系统管理',
    description: '系统管理权限',
    parentId: null,
    sortOrder: 200
  });

  const fileGroupId = await upsertPermissionByCode({
    code: 'system.file',
    name: '文件管理',
    description: '文件管理权限',
    parentId: systemId,
    sortOrder: 220
  });

  const filePermissionIds: number[] = [];

  filePermissionIds.push(
    await upsertPermissionByCode({
      code: 'system.file.read',
      name: '查看文件',
      description: '查看文件列表和详情',
      parentId: fileGroupId,
      sortOrder: 221
    })
  );
  filePermissionIds.push(
    await upsertPermissionByCode({
      code: 'system.file.upload',
      name: '上传文件',
      description: '上传文件',
      parentId: fileGroupId,
      sortOrder: 222
    })
  );
  filePermissionIds.push(
    await upsertPermissionByCode({
      code: 'system.file.delete',
      name: '删除文件',
      description: '删除文件',
      parentId: fileGroupId,
      sortOrder: 223
    })
  );
  filePermissionIds.push(
    await upsertPermissionByCode({
      code: 'system.file.folder.create',
      name: '创建文件夹',
      description: '创建文件夹',
      parentId: fileGroupId,
      sortOrder: 224
    })
  );
  filePermissionIds.push(
    await upsertPermissionByCode({
      code: 'system.file.folder.delete',
      name: '删除文件夹',
      description: '删除文件夹',
      parentId: fileGroupId,
      sortOrder: 225
    })
  );

  // 修正 PG 序列（仅在表使用 serial 且出现手动插入时需要，这里防御性处理）
  if (dialect === 'postgres') {
    await db.execute(
      sql`select setval(pg_get_serial_sequence('permissions', 'id'), (select max(id) from permissions))`
    );
  }

  // 给超级管理员角色补齐权限
  const existingRolePerms = await db
    .select({ permissionId: rolePermissions.permissionId })
    .from(rolePermissions)
    .where(eq(rolePermissions.roleId, roleId));

  const existingSet = new Set(
    (existingRolePerms || []).map((r: any) => r.permissionId as number)
  );

  const toInsert = filePermissionIds
    .filter((id) => !existingSet.has(id))
    .map((permissionId) => ({ roleId, permissionId }));

  if (toInsert.length > 0) {
    await db.insert(rolePermissions).values(toInsert as any);
  }

  console.log('文件管理权限同步完成');
}

async function initSuperAdminUser(roleId: number) {
  console.log('开始初始化超级管理员账号...');

  const adminPassword = surperAdmin.password;
  const saltRounds = Number(process.env.SALT_ROUNDS || 12);
  const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

  const adminExists = await db
    .select()
    .from(users)
    .where(eq(users.email, surperAdmin.email));

  if (adminExists.length > 0) {
    console.log('超级管理员账号已存在');
    return;
  }

  await db.insert(users).values({
    email: surperAdmin.email,
    username: surperAdmin.username,
    password: hashedPassword,
    avatar: '/avatars/admin.jpg',
    roleId,
    status: 'active',
    isSuperAdmin: true
  });

  console.log('超级管理员账号创建成功！');
  console.log('邮箱: ' + surperAdmin.email);
  console.log('用户名: ' + surperAdmin.username);
  console.log('请使用环境变量中配置的密码登录');
}

async function main() {
  try {
    console.log('开始初始化系统...');
    const superAdminRole = await initSuperAdminRole();
    await initSuperAdminUser(superAdminRole.id);
    console.log('系统初始化完成！');
    process.exit(0);
  } catch (error) {
    console.error('初始化失败:', error);
    process.exit(1);
  }
}

main();
