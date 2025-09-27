declare namespace API {
  type CaptchaRequest = {
    email: string;
  };

  type ChangePwdRequest = {
    password: string;
  };

  type Character = {
    id: number;
    background: string;
    name: string;
    avatar: string;
    description: string;
    open_line: string;
    tags: string[];
    is_public: boolean;
    user_id: number;
    created_at: number;
    updated_at: number;
  };

  type chatParams = {
    session_id: number;
  };

  type getSessionParams = {
    cursor: number;
    pageSize: number;
  };

  type GetSessionResponse = {
    sessions: Session[];
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

  type NewCharacterRequest = {
    background: string;
    name: string;
    avatar: string;
    description: string;
    open_line: string;
    voice: number;
    tags: number[];
    is_public: boolean;
  };

  type NewCharacterResponse = {
    character: Character;
  };

  type NewSessionRequest = {
    character_id: number;
  };

  type NewSessionResponse = {
    session_id: number;
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

  type Session = {
    session_id: number;
    user_id: number;
    character_id: number;
    title: string;
    created_at: number;
    updated_at: number;
  };

  type Tag = {
    id: number;
    name: string;
  };

  type UploadTokenResponse = {
    token: string;
    key: string;
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
