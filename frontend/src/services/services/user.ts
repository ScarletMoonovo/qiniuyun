// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 此处后端没有提供注释 GET /auth/github */
export async function githubOauth(options?: { [key: string]: any }) {
  return request<string>('/auth/github', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /auth/github/callback */
export async function githubCallback(options?: { [key: string]: any }) {
  return request<string>('/auth/github/callback', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /avatar */
export async function postAvatar(options?: { [key: string]: any }) {
  return request<string>('/avatar', {
    method: 'POST',
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /captcha */
export async function sendCaptcha(body: API.CaptchaRequest, options?: { [key: string]: any }) {
  return request<string>('/captcha', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /login */
export async function login(body: API.LoginRequest, options?: { [key: string]: any }) {
  return request<API.LoginResponse>('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /login/captcha */
export async function loginEmail(
  body: API.EmailCaptchaLoginRequest,
  options?: { [key: string]: any },
) {
  return request<API.LoginResponse>('/login/captcha', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /register */
export async function register(body: API.RegisterRequest, options?: { [key: string]: any }) {
  return request<API.RegisterResponse>('/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 PUT /user */
export async function updateUserinfo(body: API.UserExtend, options?: { [key: string]: any }) {
  return request<string>('/user', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /user/${param0} */
export async function getUserInfo(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getUserInfoParams,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.UserInfo>(`/user/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /user/name */
export async function getUserByName(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getUserByNameParams,
  options?: { [key: string]: any },
) {
  return request<API.GetUserByNameResponse>('/user/name', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 PUT /user/password */
export async function changePwd(body: API.ChangePwdRequest, options?: { [key: string]: any }) {
  return request<string>('/user/password', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
