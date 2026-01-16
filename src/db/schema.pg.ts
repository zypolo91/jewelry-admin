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

// VIP等级表
export const vipLevels = pgTable('vip_levels', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(), // VIP等级名称，如：普通会员、黄金会员、钻石会员
  level: integer('level').notNull().default(0), // 等级数值，0=非VIP
  price: numeric('price', { precision: 10, scale: 2 }).default('0'), // 开通价格
  duration: integer('duration').default(30), // 有效期（天）
  maxJewelries: integer('max_jewelries').default(50), // 最大珠宝数量
  maxCategories: integer('max_categories').default(10), // 最大分类数量
  maxChannels: integer('max_channels').default(10), // 最大渠道数量
  features: jsonb('features').$type<string[]>(), // VIP特权列表
  icon: varchar('icon', { length: 255 }), // VIP图标
  color: varchar('color', { length: 20 }), // VIP颜色
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdateFn(() => new Date())
});

// 用户VIP记录表
export const userVip = pgTable('user_vip', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  vipLevelId: integer('vip_level_id').notNull(),
  startAt: timestamp('start_at').notNull(),
  expireAt: timestamp('expire_at').notNull(),
  status: varchar('status', { length: 20 }).default('active'), // active, expired, cancelled
  orderNo: varchar('order_no', { length: 100 }), // 订单号
  payAmount: numeric('pay_amount', { precision: 10, scale: 2 }), // 实付金额
  payMethod: varchar('pay_method', { length: 50 }), // 支付方式
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdateFn(() => new Date())
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

// ==================== V2.0 新增表 ====================

// 成就定义表
export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 255 }),
  category: varchar('category', { length: 50 }).notNull(),
  conditionType: varchar('condition_type', { length: 50 }).notNull(),
  conditionValue: integer('condition_value').notNull(),
  conditionExtra: jsonb('condition_extra'),
  points: integer('points').default(10),
  rarity: varchar('rarity', { length: 20 }).default('common'),
  isHidden: boolean('is_hidden').default(false),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow()
});

// 用户成就记录表
export const userAchievements = pgTable('user_achievements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  achievementId: integer('achievement_id').notNull(),
  progress: integer('progress').default(0),
  unlockedAt: timestamp('unlocked_at'),
  isClaimed: boolean('is_claimed').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdateFn(() => new Date())
});

// 用户等级表
export const userLevels = pgTable('user_levels', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique(),
  level: integer('level').default(1),
  exp: integer('exp').default(0),
  totalPoints: integer('total_points').default(0),
  title: varchar('title', { length: 50 }).default('收藏新手'),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdateFn(() => new Date())
});

// 等级配置表
export const levelConfig = pgTable('level_config', {
  level: integer('level').primaryKey(),
  title: varchar('title', { length: 50 }).notNull(),
  expRequired: integer('exp_required').notNull(),
  privileges: jsonb('privileges')
});

// AI估价记录表
export const aiValuations = pgTable('ai_valuations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  jewelryId: integer('jewelry_id'),
  imageUrl: varchar('image_url', { length: 500 }).notNull(),
  category: varchar('category', { length: 50 }),
  material: varchar('material', { length: 100 }),
  qualityScore: numeric('quality_score', { precision: 3, scale: 2 }),
  estimatedMin: numeric('estimated_min', { precision: 12, scale: 2 }),
  estimatedMax: numeric('estimated_max', { precision: 12, scale: 2 }),
  confidence: numeric('confidence', { precision: 3, scale: 2 }),
  analysis: jsonb('analysis'),
  modelVersion: varchar('model_version', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow()
});

// AI鉴定记录表
export const aiAuthentications = pgTable('ai_authentications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  jewelryId: integer('jewelry_id'),
  imageUrls: jsonb('image_urls').$type<string[]>().notNull(),
  result: varchar('result', { length: 20 }).notNull(),
  confidence: numeric('confidence', { precision: 3, scale: 2 }),
  issues: jsonb('issues'),
  suggestions: text('suggestions'),
  modelVersion: varchar('model_version', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow()
});

// AI对话记录表
export const aiChats = pgTable('ai_chats', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  sessionId: varchar('session_id', { length: 100 }).notNull(),
  role: varchar('role', { length: 20 }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// AI配额表
export const aiQuotas = pgTable('ai_quotas', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  quotaType: varchar('quota_type', { length: 50 }).notNull(),
  totalQuota: integer('total_quota').notNull(),
  usedQuota: integer('used_quota').default(0),
  resetDate: date('reset_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdateFn(() => new Date())
});

// 话题表
export const topics = pgTable('topics', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 255 }),
  color: varchar('color', { length: 20 }),
  postCount: integer('post_count').default(0),
  isHot: boolean('is_hot').default(false),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow()
});

// 社区动态表
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  content: text('content').notNull(),
  images: jsonb('images').$type<string[]>(),
  jewelryIds: jsonb('jewelry_ids').$type<number[]>(),
  topicId: integer('topic_id'),
  type: varchar('type', { length: 20 }).default('normal'),
  visibility: varchar('visibility', { length: 20 }).default('public'),
  likeCount: integer('like_count').default(0),
  commentCount: integer('comment_count').default(0),
  shareCount: integer('share_count').default(0),
  favoriteCount: integer('favorite_count').default(0),
  isPinned: boolean('is_pinned').default(false),
  status: varchar('status', { length: 20 }).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdateFn(() => new Date())
});

// 评论表
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull(),
  userId: integer('user_id').notNull(),
  parentId: integer('parent_id'),
  content: text('content').notNull(),
  likeCount: integer('like_count').default(0),
  status: varchar('status', { length: 20 }).default('active'),
  createdAt: timestamp('created_at').defaultNow()
});

// 点赞表
export const likes = pgTable('likes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  targetType: varchar('target_type', { length: 20 }).notNull(),
  targetId: integer('target_id').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// 关注关系表
export const follows = pgTable('follows', {
  id: serial('id').primaryKey(),
  followerId: integer('follower_id').notNull(),
  followingId: integer('following_id').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// 收藏表
export const favorites = pgTable('favorites', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  postId: integer('post_id').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// 私信表
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  senderId: integer('sender_id').notNull(),
  receiverId: integer('receiver_id').notNull(),
  content: text('content').notNull(),
  type: varchar('type', { length: 20 }).default('text'), // text, image, emoji, file, collection, poke, quote
  isRead: boolean('is_read').default(false),
  replyToId: integer('reply_to_id'), // 引用消息ID
  fileUrl: varchar('file_url', { length: 500 }), // 文件/图片URL
  fileName: varchar('file_name', { length: 255 }), // 文件名
  fileSize: integer('file_size'), // 文件大小(bytes)
  collectionId: integer('collection_id'), // 藏品ID
  isDeleted: boolean('is_deleted').default(false), // 软删除
  createdAt: timestamp('created_at').defaultNow()
});

// 提醒配置表
export const reminders = pgTable('reminders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  jewelryId: integer('jewelry_id'),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  message: text('message'),
  triggerDate: date('trigger_date'),
  repeatType: varchar('repeat_type', { length: 20 }),
  isEnabled: boolean('is_enabled').default(true),
  lastTriggered: timestamp('last_triggered'),
  createdAt: timestamp('created_at').defaultNow()
});

// 通知表
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content'),
  data: jsonb('data'),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow()
});

// 主题皮肤表
export const themes = pgTable('themes', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  description: text('description'),
  preview: varchar('preview', { length: 255 }),
  colors: jsonb('colors'),
  isVip: boolean('is_vip').default(false),
  isPremium: boolean('is_premium').default(false),
  price: numeric('price', { precision: 10, scale: 2 }).default('0'),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

// 用户主题表
export const userThemes = pgTable('user_themes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  themeId: integer('theme_id').notNull(),
  isActive: boolean('is_active').default(false),
  purchasedAt: timestamp('purchased_at').defaultNow()
});

// 用户设置表
export const userSettings = pgTable('user_settings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique(),
  appLockEnabled: boolean('app_lock_enabled').default(false),
  appLockType: varchar('app_lock_type', { length: 20 }),
  appLockPin: varchar('app_lock_pin', { length: 255 }),
  privacyMode: boolean('privacy_mode').default(false),
  watermarkEnabled: boolean('watermark_enabled').default(false),
  notificationEnabled: boolean('notification_enabled').default(true),
  dailyReminderTime: varchar('daily_reminder_time', { length: 10 }),
  language: varchar('language', { length: 10 }).default('zh'),
  currency: varchar('currency', { length: 10 }).default('CNY'),
  extraSettings: jsonb('extra_settings'),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdateFn(() => new Date())
});

// 每日签到表
export const dailyCheckins = pgTable('daily_checkins', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  checkinDate: date('checkin_date').notNull(),
  streak: integer('streak').default(1),
  points: integer('points').default(0),
  createdAt: timestamp('created_at').defaultNow()
});

// 用户拉黑表
export const blocks = pgTable('blocks', {
  id: serial('id').primaryKey(),
  blockerId: integer('blocker_id').notNull(),
  blockedId: integer('blocked_id').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// 搜索关键词统计表
export const searchKeywords = pgTable('search_keywords', {
  id: serial('id').primaryKey(),
  keyword: varchar('keyword', { length: 100 }).notNull().unique(),
  searchCount: integer('search_count').default(1),
  lastSearchedAt: timestamp('last_searched_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow()
});

// ==================== V2.0 表关系 ====================

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements)
}));

export const userAchievementsRelations = relations(
  userAchievements,
  ({ one }) => ({
    user: one(users, {
      fields: [userAchievements.userId],
      references: [users.id]
    }),
    achievement: one(achievements, {
      fields: [userAchievements.achievementId],
      references: [achievements.id]
    })
  })
);

export const userLevelsRelations = relations(userLevels, ({ one }) => ({
  user: one(users, { fields: [userLevels.userId], references: [users.id] })
}));

export const aiValuationsRelations = relations(aiValuations, ({ one }) => ({
  user: one(users, { fields: [aiValuations.userId], references: [users.id] }),
  jewelry: one(jewelries, {
    fields: [aiValuations.jewelryId],
    references: [jewelries.id]
  })
}));

export const aiAuthenticationsRelations = relations(
  aiAuthentications,
  ({ one }) => ({
    user: one(users, {
      fields: [aiAuthentications.userId],
      references: [users.id]
    }),
    jewelry: one(jewelries, {
      fields: [aiAuthentications.jewelryId],
      references: [jewelries.id]
    })
  })
);

export const topicsRelations = relations(topics, ({ many }) => ({
  posts: many(posts)
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, { fields: [posts.userId], references: [users.id] }),
  topic: one(topics, { fields: [posts.topicId], references: [topics.id] }),
  comments: many(comments),
  favorites: many(favorites)
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
  post: one(posts, { fields: [favorites.postId], references: [posts.id] })
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id]
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id]
  })
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id]
  })
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id]
  })
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  user: one(users, { fields: [reminders.userId], references: [users.id] }),
  jewelry: one(jewelries, {
    fields: [reminders.jewelryId],
    references: [jewelries.id]
  })
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] })
}));

export const themesRelations = relations(themes, ({ many }) => ({
  userThemes: many(userThemes)
}));

export const userThemesRelations = relations(userThemes, ({ one }) => ({
  user: one(users, { fields: [userThemes.userId], references: [users.id] }),
  theme: one(themes, { fields: [userThemes.themeId], references: [themes.id] })
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, { fields: [userSettings.userId], references: [users.id] })
}));

export const blocksRelations = relations(blocks, ({ one }) => ({
  blocker: one(users, { fields: [blocks.blockerId], references: [users.id] }),
  blocked: one(users, { fields: [blocks.blockedId], references: [users.id] })
}));
