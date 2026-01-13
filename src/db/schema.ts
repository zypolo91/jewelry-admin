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
