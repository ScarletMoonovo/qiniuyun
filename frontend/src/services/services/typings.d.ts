declare namespace API {
  type CaptchaRequest = {
    email: string;
  };

  type ChangePwdRequest = {
    password: string;
  };

  type EmailCaptchaLoginRequest = {
    email: string;
    captcha: string;
  };

  type getUserByNameParams = {
    name: string;
    cursor: number;
    pageSize: number;
  };

  type GetUserByNameResponse = {
    users: User[];
  };

  type getUserInfoParams = {
    id: string;
  };

  type LoginRequest = {
    email: string;
    password: string;
  };

  type LoginResponse = {
    id: number;
    accessToken: string;
    refreshToken: string;
  };

  type RegisterRequest = {
    email: string;
    captcha: string;
    name: string;
    password: string;
  };

  type RegisterResponse = {
    id: number;
    accessToken: string;
    refreshToken: string;
  };

  type User = {
    id: number;
    name: string;
    avatar: string;
    follow_count: number;
    follower_count: number;
    is_follow: boolean;
  };

  type UserExtend = {
    birthday?: number;
    sex?: '[male';
    signature?: string;
    company?: string;
  };

  type UserInfo = {
    id?: number;
    name?: string;
    avatar?: string;
    follow_count?: number;
    follower_count?: number;
    is_follow?: boolean;
    birthday?: number;
    sex?: '[male';
    signature?: string;
    company?: string;
  };
}
