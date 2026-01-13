import {
  mysqlTable,
  varchar,
  int,
  timestamp,
  boolean,
  text,
  json,
  unique,
  decimal,
  date
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

export const jewelryCategories = mysqlTable('jewelry_categories', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 50 }).notNull(),
  icon: varchar('icon', { length: 255 }),
  color: varchar('color', { length: 20 }),
  sortOrder: int('sort_order').default(0),
  isSystem: boolean('is_system').default(false),
  userId: int('user_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const purchaseChannels = mysqlTable('purchase_channels', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 50 }).notNull(),
  icon: varchar('icon', { length: 255 }),
  sortOrder: int('sort_order').default(0),
  isSystem: boolean('is_system').default(false),
  userId: int('user_id'),
  remark: text('remark'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const jewelries = mysqlTable('jewelries', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  categoryId: int('category_id').notNull(),
  images: json('images').$type<string[]>(),
  coverImage: varchar('cover_image', { length: 500 }),
  purchasePrice: decimal('purchase_price', {
    precision: 12,
    scale: 2
  }).notNull(),
  purchaseDate: date('purchase_date').notNull(),
  channelId: int('channel_id').notNull(),
  sellerName: varchar('seller_name', { length: 100 }),
  currentValue: decimal('current_value', { precision: 12, scale: 2 }),
  valueUpdatedAt: timestamp('value_updated_at'),
  specifications: json('specifications').$type<Record<string, string>>(),
  qualityGrade: varchar('quality_grade', { length: 20 }),
  certificateNo: varchar('certificate_no', { length: 100 }),
  certificateImages: json('certificate_images').$type<string[]>(),
  status: varchar('status', { length: 20 }).default('collected'),
  remark: text('remark'),
  extraData: json('extra_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

export const jewelryValueHistory = mysqlTable('jewelry_value_history', {
  id: int('id').primaryKey().autoincrement(),
  jewelryId: int('jewelry_id').notNull(),
  value: decimal('value', { precision: 12, scale: 2 }).notNull(),
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

// VIP等级表
export const vipLevels = mysqlTable('vip_levels', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 50 }).notNull(),
  level: int('level').notNull().default(0),
  price: decimal('price', { precision: 10, scale: 2 }).default('0'),
  duration: int('duration').default(30),
  maxJewelries: int('max_jewelries').default(50),
  maxCategories: int('max_categories').default(10),
  maxChannels: int('max_channels').default(10),
  features: json('features').$type<string[]>(),
  icon: varchar('icon', { length: 255 }),
  color: varchar('color', { length: 20 }),
  sortOrder: int('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

// 用户VIP记录表
export const userVip = mysqlTable('user_vip', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  vipLevelId: int('vip_level_id').notNull(),
  startAt: timestamp('start_at').notNull(),
  expireAt: timestamp('expire_at').notNull(),
  status: varchar('status', { length: 20 }).default('active'),
  orderNo: varchar('order_no', { length: 100 }),
  payAmount: decimal('pay_amount', { precision: 10, scale: 2 }),
  payMethod: varchar('pay_method', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

// VIP等级关系
export const vipLevelsRelations = relations(vipLevels, ({ many }) => ({
  userVips: many(userVip)
}));

// 用户VIP关系
export const userVipRelations = relations(userVip, ({ one }) => ({
  vipLevel: one(vipLevels, {
    fields: [userVip.vipLevelId],
    references: [vipLevels.id]
  })
}));
