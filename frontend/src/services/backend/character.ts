// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 此处后端没有提供注释 POST /api/character */
export async function newCharacter(
  body: API.NewCharacterRequest,
  options?: { [key: string]: any },
) {
  return request<API.NewCharacterResponse>('/api/character', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
