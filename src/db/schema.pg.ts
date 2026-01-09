import {
  pgTable,
  varchar,
  integer,
  timestamp,
  boolean,
  text,
  jsonb,
  uniqueIndex,
  serial,
  numeric,
  date
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 50 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  avatar: varchar('avatar', { length: 255 }).default('/avatars/default.jpg'),
  roleId: integer('role_id').notNull(),
  isSuperAdmin: boolean('is_super_admin').default(false),
  status: varchar('status', { length: 20 }).default('active'), // active, disabled
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdateFn(() => new Date())
});

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  isSuper: boolean('is_super').default(false),
  description: varchar('description', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdateFn(() => new Date())
});

// 权限表
export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  description: varchar('description', { length: 255 }),
  parentId: integer('parent_id'), // 父权限ID，null表示顶级权限
  sortOrder: integer('sort_order').default(0), // 排序字段
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdateFn(() => new Date())
});

// 角色-权限关联表
export const rolePermissions = pgTable(
  'role_permissions',
  {
    id: serial('id').primaryKey(),
    roleId: integer('role_id').notNull(),
    permissionId: integer('permission_id').notNull(),
    createdAt: timestamp('created_at').defaultNow()
  },
  (t) => ({
    unq: uniqueIndex('role_permission_unique').on(t.roleId, t.permissionId)
  })
);

// 系统日志表
export const systemLogs = pgTable('system_logs', {
  id: serial('id').primaryKey(),
  level: varchar('level', { length: 20 }).notNull(), // info, warn, error, debug
  action: varchar('action', { length: 100 }).notNull(), // 操作类型
  module: varchar('module', { length: 50 }).notNull(), // 模块名称
  message: text('message').notNull(), // 日志消息
  details: jsonb('details'), // 详细信息 JSON
  userId: integer('user_id'), // 操作用戶ID
  userAgent: varchar('user_agent', { length: 500 }), // 用户代理
  ip: varchar('ip', { length: 45 }), // IP地址
  requestId: varchar('request_id', { length: 100 }), // 请求ID
  duration: integer('duration'), // 执行时间(毫秒)
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

export const jewelryCategories = pgTable('jewelry_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  icon: varchar('icon', { length: 255 }),
  color: varchar('color', { length: 20 }),
  sortOrder: integer('sort_order').default(0),
  isSystem: boolean('is_system').default(false),
  userId: integer('user_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdateFn(() => new Date())
});

export const purchaseChannels = pgTable('purchase_channels', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  icon: varchar('icon', { length: 255 }),
  sortOrder: integer('sort_order').default(0),
  isSystem: boolean('is_system').default(false),
  userId: integer('user_id'),
  remark: text('remark'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdateFn(() => new Date())
});

export const jewelries = pgTable('jewelries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  categoryId: integer('category_id').notNull(),
  images: jsonb('images').$type<string[]>(),
  coverImage: varchar('cover_image', { length: 500 }),
  purchasePrice: numeric('purchase_price', {
    precision: 12,
    scale: 2
  }).notNull(),
  purchaseDate: date('purchase_date').notNull(),
  channelId: integer('channel_id').notNull(),
  sellerName: varchar('seller_name', { length: 100 }),
  currentValue: numeric('current_value', { precision: 12, scale: 2 }),
  valueUpdatedAt: timestamp('value_updated_at'),
  specifications: jsonb('specifications').$type<Record<string, string>>(),
  qualityGrade: varchar('quality_grade', { length: 20 }),
  certificateNo: varchar('certificate_no', { length: 100 }),
  certificateImages: jsonb('certificate_images').$type<string[]>(),
  status: varchar('status', { length: 20 }).default('collected'),
  remark: text('remark'),
  extraData: jsonb('extra_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdateFn(() => new Date())
});

export const jewelryValueHistory = pgTable('jewelry_value_history', {
  id: serial('id').primaryKey(),
  jewelryId: integer('jewelry_id').notNull(),
  value: numeric('value', { precision: 12, scale: 2 }).notNull(),
  source: varchar('source', { length: 50 }),
  remark: text('remark'),
  createdAt: timestamp('created_at').defaultNow()
});

export const jewelryCategoriesRelations = relations(
  jewelryCategories,
  ({ many }) => ({
    jewelries: many(jewelries)
  })
);

export const purchaseChannelsRelations = relations(
  purchaseChannels,
  ({ many }) => ({
    jewelries: many(jewelries)
  })
);

export const jewelriesRelations = relations(jewelries, ({ one, many }) => ({
  category: one(jewelryCategories, {
    fields: [jewelries.categoryId],
    references: [jewelryCategories.id]
  }),
  channel: one(purchaseChannels, {
    fields: [jewelries.channelId],
    references: [purchaseChannels.id]
  }),
  valueHistory: many(jewelryValueHistory)
}));

export const jewelryValueHistoryRelations = relations(
  jewelryValueHistory,
  ({ one }) => ({
    jewelry: one(jewelries, {
      fields: [jewelryValueHistory.jewelryId],
      references: [jewelries.id]
    })
  })
);
