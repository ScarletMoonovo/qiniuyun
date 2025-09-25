// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 此处后端没有提供注释 POST /api/avatar */
export async function postAvatar(options?: { [key: string]: any }) {
  return request<string>('/api/avatar', {
    method: 'POST',
    ...(options || {}),
  });
}
