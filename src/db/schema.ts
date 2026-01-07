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

export const systemLogsRelations = schema.systemLogsRelations as any;
export const usersRelations = schema.usersRelations as any;
export const rolesRelations = schema.rolesRelations as any;
export const permissionsRelations = schema.permissionsRelations as any;
export const rolePermissionsRelations = schema.rolePermissionsRelations as any;

