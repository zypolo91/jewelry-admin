import { getDatabaseDialect } from './dialect';
import * as mysqlSchema from './schema.mysql';
import * as pgSchema from './schema.pg';

const dialect = getDatabaseDialect();
const schema = dialect === 'postgres' ? pgSchema : mysqlSchema;

export const users = schema.users as any;
export const roles = schema.roles as any;
export const permissions = schema.permissions as any;
export const rolePermissions = schema.rolePermissions as any;
export const systemLogs = schema.systemLogs as any;
export const jewelryCategories = schema.jewelryCategories as any;
export const purchaseChannels = schema.purchaseChannels as any;
export const jewelries = schema.jewelries as any;
export const jewelryValueHistory = schema.jewelryValueHistory as any;
export const vipLevels = schema.vipLevels as any;
export const userVip = schema.userVip as any;

export const systemLogsRelations = schema.systemLogsRelations as any;
export const usersRelations = schema.usersRelations as any;
export const rolesRelations = schema.rolesRelations as any;
export const permissionsRelations = schema.permissionsRelations as any;
export const rolePermissionsRelations = schema.rolePermissionsRelations as any;
export const jewelryCategoriesRelations =
  schema.jewelryCategoriesRelations as any;
export const purchaseChannelsRelations =
  schema.purchaseChannelsRelations as any;
export const jewelriesRelations = schema.jewelriesRelations as any;
export const jewelryValueHistoryRelations =
  schema.jewelryValueHistoryRelations as any;

// V2.0 新增表导出
export const achievements = schema.achievements as any;
export const userAchievements = schema.userAchievements as any;
export const userLevels = schema.userLevels as any;
export const levelConfig = schema.levelConfig as any;
export const aiValuations = schema.aiValuations as any;
export const aiAuthentications = schema.aiAuthentications as any;
export const aiChats = schema.aiChats as any;
export const aiQuotas = schema.aiQuotas as any;
export const topics = schema.topics as any;
export const posts = schema.posts as any;
export const comments = schema.comments as any;
export const likes = schema.likes as any;
export const follows = schema.follows as any;
export const favorites = schema.favorites as any;
export const messages = schema.messages as any;
export const reminders = schema.reminders as any;
export const notifications = schema.notifications as any;
export const themes = schema.themes as any;
export const userThemes = schema.userThemes as any;
export const userSettings = schema.userSettings as any;
export const dailyCheckins = schema.dailyCheckins as any;

// V2.0 关系导出
export const achievementsRelations = schema.achievementsRelations as any;
export const userAchievementsRelations =
  schema.userAchievementsRelations as any;
export const userLevelsRelations = schema.userLevelsRelations as any;
export const aiValuationsRelations = schema.aiValuationsRelations as any;
export const aiAuthenticationsRelations =
  schema.aiAuthenticationsRelations as any;
export const topicsRelations = schema.topicsRelations as any;
export const postsRelations = schema.postsRelations as any;
export const commentsRelations = schema.commentsRelations as any;
export const favoritesRelations = schema.favoritesRelations as any;
export const followsRelations = schema.followsRelations as any;
export const messagesRelations = schema.messagesRelations as any;
export const remindersRelations = schema.remindersRelations as any;
export const notificationsRelations = schema.notificationsRelations as any;
export const themesRelations = schema.themesRelations as any;
export const userThemesRelations = schema.userThemesRelations as any;
export const userSettingsRelations = schema.userSettingsRelations as any;
export const blocks = schema.blocks as any;
export const searchKeywords = schema.searchKeywords as any;
export const blocksRelations = schema.blocksRelations as any;
export const userPreferences = schema.userPreferences as any;
export const userViewHistory = schema.userViewHistory as any;

// 证书机构相关表
export const certInstitutions = schema.certInstitutions as any;
export const certKnowledge = schema.certKnowledge as any;
export const certVerifications = schema.certVerifications as any;
export const certImageFeatures = schema.certImageFeatures as any;

// 图片标签表
export const jewelryImageTags = schema.jewelryImageTags as any;
export const jewelryImageTagsRelations =
  schema.jewelryImageTagsRelations as any;

// 直播间相关表
export const liveRooms = schema.liveRooms as any;
export const liveStatusCache = schema.liveStatusCache as any;
export const liveHistory = schema.liveHistory as any;
export const liveRoomsRelations = schema.liveRoomsRelations as any;
export const liveStatusCacheRelations = schema.liveStatusCacheRelations as any;
export const liveHistoryRelations = schema.liveHistoryRelations as any;
