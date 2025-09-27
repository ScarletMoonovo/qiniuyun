// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 此处后端没有提供注释 GET /api/tags */
export async function getTags(options?: { [key: string]: any }) {
  return request<API.Tag[]>('/api/tags', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /api/upload/token */
export async function uploadToken(options?: { [key: string]: any }) {
  return request<API.UploadTokenResponse>('/api/upload/token', {
    method: 'POST',
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /api/user/tags */
export async function getUserTags(options?: { [key: string]: any }) {
  return request<API.Tag[]>('/api/user/tags', {
    method: 'GET',
    ...(options || {}),
  });
}
