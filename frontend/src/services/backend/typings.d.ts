declare namespace API {
  type CaptchaRequest = {
    email: string;
  };

  type ChangePwdRequest = {
    password: string;
  };

  type getUserByNameParams = {
    name: string;
    cursor: number;
    pageSize: number;
  };

  type GetUserByNameResponse = {
    users: User[];
  };

  type getUserParams = {
    id: string;
  };

  type GetUserResponse = {
    user: User;
  };

  type LoginRequest = {
    email: string;
    password?: string;
    captcha?: string;
  };

  type LoginResponse = {
    id: number;
    accessToken: string;
    refreshToken: string;
  };

  type RefreshResponse = {
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
    birthday?: number;
    sex?: '[male';
    signature?: string;
  };
}
