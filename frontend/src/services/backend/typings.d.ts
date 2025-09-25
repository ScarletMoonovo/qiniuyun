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

  // 角色相关类型定义
  type Role = {
    id: number;
    name: string;
    avatar: string;
    description: string;
    category: string;
    tags: string[];
    personality: string;
    background: string;
    quotes: string[];
    voiceStyle: string;
    popularity: number;
    createdAt: string;
    updatedAt: string;
    creatorId: number;
    creator?: User;
  };

  type RoleCategory = {
    id: string;
    name: string;
    description: string;
    icon: string;
  };

  type CreateRoleRequest = {
    name: string;
    avatar?: string;
    description: string;
    category: string;
    tags: string[];
    personality: string;
    background: string;
    quotes: string[];
    voiceStyle: string;
  };

  type UpdateRoleRequest = {
    id: number;
    name?: string;
    avatar?: string;
    description?: string;
    category?: string;
    tags?: string[];
    personality?: string;
    background?: string;
    quotes?: string[];
    voiceStyle?: string;
  };

  type SearchRoleParams = {
    keyword?: string;
    category?: string;
    tags?: string[];
    page: number;
    pageSize: number;
  };

  type SearchRoleResponse = {
    roles: Role[];
    total: number;
    hasMore: boolean;
  };

  type GetRoleParams = {
    id: number;
  };

  type GetRoleResponse = {
    role: Role;
  };

  type GetRoleListParams = {
    page: number;
    pageSize: number;
    category?: string;
  };

  type GetRoleListResponse = {
    roles: Role[];
    total: number;
    hasMore: boolean;
  };

  type GetMyRolesParams = {
    page: number;
    pageSize: number;
  };

  type GetMyRolesResponse = {
    roles: Role[];
    total: number;
    hasMore: boolean;
  };

  // 聊天相关类型定义
  type ChatMessage = {
    id: string;
    roleId: number;
    userId: number;
    content: string;
    type: 'text' | 'voice';
    sender: 'user' | 'role';
    timestamp: string;
    voiceUrl?: string;
    duration?: number;
  };

  type ChatSession = {
    id: string;
    roleId: number;
    userId: number;
    title: string;
    messages: ChatMessage[];
    createdAt: string;
    updatedAt: string;
    lastMessageAt: string;
    role?: Role;
  };

  type SendTextMessageRequest = {
    roleId: number;
    sessionId?: string;
    content: string;
  };

  type SendVoiceMessageRequest = {
    roleId: number;
    sessionId?: string;
    voiceData: Blob;
    duration: number;
  };

  type SendMessageResponse = {
    message: ChatMessage;
    sessionId: string;
  };

  type GetChatHistoryParams = {
    sessionId?: string;
    roleId?: number;
    page: number;
    pageSize: number;
  };

  type GetChatHistoryResponse = {
    sessions: ChatSession[];
    total: number;
    hasMore: boolean;
  };

  type GetChatMessagesParams = {
    sessionId: string;
    page: number;
    pageSize: number;
  };

  type GetChatMessagesResponse = {
    messages: ChatMessage[];
    total: number;
    hasMore: boolean;
  };

  type CreateChatSessionRequest = {
    roleId: number;
    title?: string;
  };

  type CreateChatSessionResponse = {
    session: ChatSession;
  };

  // 语音相关类型定义
  type VoiceModel = {
    id: string;
    name: string;
    description: string;
    language: string;
    gender: 'male' | 'female' | 'neutral';
    sampleUrl: string;
    isDefault: boolean;
  };

  type GetVoiceModelsResponse = {
    models: VoiceModel[];
  };

  type VoiceToTextRequest = {
    voiceData: Blob;
    language?: string;
  };

  type VoiceToTextResponse = {
    text: string;
    confidence: number;
  };

  type TextToVoiceRequest = {
    text: string;
    voiceModelId: string;
    speed?: number;
    pitch?: number;
  };

  type TextToVoiceResponse = {
    voiceUrl: string;
    duration: number;
  };

  // WebSocket消息类型定义
  type WebSocketMessage = {
    type: 'chat_message' | 'typing_start' | 'typing_stop' | 'error' | 'connection';
    payload: any;
    timestamp: string;
  };

  type ChatWebSocketMessage = {
    type: 'chat_message';
    payload: {
      message: ChatMessage;
      sessionId: string;
    };
  };

  type TypingWebSocketMessage = {
    type: 'typing_start' | 'typing_stop';
    payload: {
      roleId: number;
      sessionId: string;
    };
  };

  // 通用响应类型
  type BaseResponse<T = any> = {
    code: number;
    message: string;
    data: T;
    success: boolean;
  };

  // 登录用户类型（简化版本）
  type LoginUserVO = User;
}
