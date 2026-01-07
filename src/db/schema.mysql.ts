import {
  mysqlTable,
  varchar,
  int,
  timestamp,
  boolean,
  text,
  json,
  unique
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 50 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  avatar: varchar('avatar', { length: 255 }).default('/avatars/default.jpg'),
  roleId: int('role_id').notNull(),
  isSuperAdmin: boolean('is_super_admin').default(false),
  status: varchar('status', { length: 20 }).default('active'), // active, disabled
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

export const roles = mysqlTable('roles', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 50 }).notNull(),
  isSuper: boolean('is_super').default(false),
  description: varchar('description', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

// 权限表
export const permissions = mysqlTable('permissions', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 50 }).notNull(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  description: varchar('description', { length: 255 }),
  parentId: int('parent_id'), // 父权限ID，null表示顶级权限
  sortOrder: int('sort_order').default(0), // 排序字段
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

// 角色-权限关联表
export const rolePermissions = mysqlTable(
  'role_permissions',
  {
    id: int('id').primaryKey().autoincrement(),
    roleId: int('role_id').notNull(),
    permissionId: int('permission_id').notNull(),
    createdAt: timestamp('created_at').defaultNow()
  },
  (t) => ({
    unq: unique('role_permission_unique').on(t.roleId, t.permissionId)
  })
);

// 系统日志表
export const systemLogs = mysqlTable('system_logs', {
  id: int('id').primaryKey().autoincrement(),
  level: varchar('level', { length: 20 }).notNull(), // info, warn, error, debug
  action: varchar('action', { length: 100 }).notNull(), // 操作类型
  module: varchar('module', { length: 50 }).notNull(), // 模块名称
  message: text('message').notNull(), // 日志消息
  details: json('details'), // 详细信息 JSON
  userId: int('user_id'), // 操作用戶ID
  userAgent: varchar('user_agent', { length: 500 }), // 用户代理
  ip: varchar('ip', { length: 45 }), // IP地址
  requestId: varchar('request_id', { length: 100 }), // 请求ID
  duration: int('duration'), // 执行时间(毫秒)
  createdAt: timestamp('created_at').defaultNow()
});

// 系统日志关系
export const systemLogsRelations = relations(systemLogs, ({ one }) => ({
  user: one(users, {
    fields: [systemLogs.userId],
    references: [users.id]
  })
}));

// 定义表关系
export const usersRelations = relations(users, ({ one }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id]
  })
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
  rolePermissions: many(rolePermissions)
}));

export const permissionsRelations = relations(permissions, ({ many, one }) => ({
  rolePermissions: many(rolePermissions),
  parent: one(permissions, {
    fields: [permissions.parentId],
    references: [permissions.id]
  }),
  children: many(permissions, { relationName: 'parent_child' })
}));

export const rolePermissionsRelations = relations(
  rolePermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolePermissions.roleId],
      references: [roles.id]
    }),
    permission: one(permissions, {
      fields: [rolePermissions.permissionId],
      references: [permissions.id]
    })
  })
);

