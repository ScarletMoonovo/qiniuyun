// @ts-ignore
/* eslint-disable */
// API 更新时间：
// API 唯一标识：
import * as api from './api';
import * as user from './user';
import * as role from './role';
import * as chat from './chat';

export default {
  api,
  user,
  role,
  chat,
};

// 也导出具名导出以便直接使用
export * from './api';
export * from './user';
export * from './role';
export * from './chat';
