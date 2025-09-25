# 技术设计文档 - AI角色扮演聊天功能（核心版本）

## 1. 设计概述

### 1.1 设计目标
- 基于现有React + Ant Design Pro架构，无缝集成AI角色扮演聊天核心功能
- 实现高性能的实时语音交互体验，响应时间控制在3秒内
- 构建可扩展的模块化架构，为后续版本扩展（如收藏功能）做好准备
- 确保跨浏览器兼容性和移动端响应式体验
- 专注于MVP（最小可行产品），包含角色发现、搜索、详情展示、语音聊天和历史记录功能

### 1.2 设计原则
- **模块化设计**: 功能模块解耦，便于维护和扩展
- **性能优先**: 采用懒加载、缓存等策略优化用户体验
- **用户体验**: 直观的交互设计，流畅的语音对话体验
- **安全可靠**: 数据传输加密，用户隐私保护
- **代码复用**: 基于现有组件库和工具类进行扩展

### 1.3 核心功能范围（V1.0）
本版本专注于AI角色扮演聊天的核心功能，包括：
- ✅ **角色创建**: 用户可以创建自定义AI角色，设置个性化信息
- ✅ **声音模型选择**: 为角色选择预设的声音模型
- ✅ **角色管理**: 浏览、搜索和管理用户创建的角色
- ✅ **角色详情**: 查看角色完整信息和设置
- ✅ **文本聊天**: 与AI角色进行文字对话交流
- ✅ **语音聊天**: 与AI角色进行实时语音对话（可选模式）
- ❌ **聊天历史**: 暂不包含，计划在V2.0版本中添加
- ❌ **自定义声音训练**: 暂不包含，计划在V2.0版本中添加
- ❌ **社交分享**: 暂不包含，后续版本考虑

### 1.4 架构概览
```
┌─────────────────────────────────────────────────┐
│                   前端应用层                      │
├─────────────────────────────────────────────────┤
│    主页面    │  角色详情页  │  聊天页面  │  创建页面  │
│  (统一布局)   │             │           │           │
├─────────────────────────────────────────────────┤
│              业务组件层                          │
├─────────────────────────────────────────────────┤
│  RoleCard   │  ChatBox    │ HeaderActions │  等  │
├─────────────────────────────────────────────────┤
│              服务层                              │
├─────────────────────────────────────────────────┤
│ RoleService │ VoiceService │ ChatService │ 等   │
├─────────────────────────────────────────────────┤
│              基础设施层                          │
├─────────────────────────────────────────────────┤
│    HTTP请求   │   WebSocket   │   语音API   │    │
└─────────────────────────────────────────────────┘
```

## 2. 系统架构

### 2.1 前端架构

#### 2.1.1 页面路由设计
```typescript
// 在config/routes.ts中扩展现有路由 - 采用扁平化结构
export default [
  // ... 现有路由
  { path: '/welcome', component: './Welcome', hideInMenu: true },
  { path: '/home', component: './Role/Home', name: 'AI角色主页' },
  { 
    path: '/role/create', 
    component: './Role/Create', 
    name: '创建角色',
    hideInMenu: true,
    access: 'canUser'
  },
  { 
    path: '/role/edit/:id', 
    component: './Role/Edit', 
    name: '编辑角色',
    hideInMenu: true,
    access: 'canUser'
  },
  { 
    path: '/role/detail/:id', 
    component: './Role/Detail', 
    name: '角色详情',
    hideInMenu: true
  },
  { 
    path: '/role/chat/:id', 
    component: './Role/Chat', 
    name: '与角色聊天',
    hideInMenu: true,
    access: 'canUser'
  },
  { path: '/', redirect: '/home' },
  // ... 其他路由
];
```

#### 2.1.2 状态管理设计
基于UmiJS的model机制，创建以下状态管理模块：

```typescript
// src/models/roleModel.ts
export default {
  namespace: 'role',
  state: {
    currentRole: null,
    roleList: [],
    categories: [],
    searchHistory: [],
  },
  effects: {
    *fetchRoles({ payload }, { call, put }) { /* ... */ },
    *searchRoles({ payload }, { call, put }) { /* ... */ },
  },
  reducers: {
    setCurrentRole(state, { payload }) { /* ... */ },
    setRoleList(state, { payload }) { /* ... */ },
  },
};

// src/models/chatModel.ts  
export default {
  namespace: 'chat',
  state: {
    currentChat: null,
    chatHistory: [],
    chatMode: 'text', // 'text' | 'voice'
    isRecording: false,
    isPlaying: false,
    messages: [],
    isTyping: false,
  },
  effects: {
    *sendTextMessage({ payload }, { call, put }) { /* ... */ },
    *sendVoiceMessage({ payload }, { call, put }) { /* ... */ },
    *switchChatMode({ payload }, { call, put }) { /* ... */ },
  },
  reducers: {
    addMessage(state, { payload }) { /* ... */ },
    setChatMode(state, { payload }) { /* ... */ },
    setRecordingStatus(state, { payload }) { /* ... */ },
    setTypingStatus(state, { payload }) { /* ... */ },
  },
};
```

### 2.2 后端接口设计

#### 2.2.1 角色管理API类型定义
```typescript
// 扩展src/services/backend/typings.d.ts
declare namespace API {
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
  };

  type RoleCategory = {
    id: string;
    name: string;
    description: string;
    icon: string;
  };

  type SearchRoleParams = {
    keyword?: string;
    category?: string;
    page: number;
    pageSize: number;
  };

  type SearchRoleResponse = {
    roles: Role[];
    total: number;
    hasMore: boolean;
  };

}
```

#### 2.2.2 聊天相关API类型定义
```typescript
declare namespace API {
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
  };

  type SendMessageRequest = {
    roleId: number;
    content: string;
    type: 'text' | 'voice';
    voiceData?: string; // base64编码的音频数据
  };

  type SendMessageResponse = {
    message: ChatMessage;
    roleResponse: ChatMessage;
  };
}
```

### 2.3 数据流设计

#### 2.3.1 文本聊天数据流
```
用户文本输入 → 内容验证 → WebSocket发送 → AI对话生成 → 实时返回 → 界面展示
     ↓              ↓              ↓              ↓              ↓
   输入组件      前端验证      聊天服务API      AI处理服务      消息组件
```

#### 2.3.2 语音聊天数据流
```
用户语音输入 → 语音识别(STT) → 文本处理 → AI对话生成 → 语音合成(TTS) → 音频播放
     ↓              ↓              ↓              ↓              ↓
   录音组件      语音服务API      聊天服务API      语音合成API      音频播放组件
```

#### 2.3.3 实时通信架构
- **WebSocket连接**: 用于实时消息传输和状态同步（文本和语音）
- **HTTP请求**: 用于角色数据、历史记录等静态数据获取
- **语音数据流**: 采用分块传输优化大文件处理
- **消息类型支持**: 统一处理文本消息和语音消息

## 3. 技术栈选择

### 3.1 核心技术
- **前端框架**: React 18 + TypeScript（继承现有架构）
- **UI组件库**: Ant Design 5.x + Pro Components（继承现有）
- **构建工具**: UmiJS 4.x（继承现有）
- **状态管理**: UmiJS内置Model + React Hooks
- **路由管理**: UmiJS内置路由系统

### 3.2 语音技术栈
- **语音录制**: Web Audio API + MediaRecorder API
- **语音播放**: HTML5 Audio API
- **实时通信**: WebSocket
- **音频处理**: Web Audio API + AudioContext
- **语音格式**: WebM for recording, MP3/WAV for playback

### 3.3 新增依赖库
```json
{
  "dependencies": {
    "socket.io-client": "^4.7.0",
    "recordrtc": "^5.6.2", 
    "react-audio-player": "^0.17.0",
    "wavesurfer.js": "^7.0.0"
  }
}
```

## 4. 模块设计

### 4.1 页面结构设计

#### 4.1.1 主页面设计 (/home) - 新的统一布局
```typescript
// src/pages/Role/Home/index.tsx
const RoleHome: React.FC = () => {
  return (
    <PageContainer title={false} style={{ padding: '24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* 我的角色部分 */}
        <div style={{ marginBottom: 48 }}>
          <Title level={2}>
            <UserOutlined /> 我的角色
          </Title>
          <Row gutter={[16, 16]}>
            {myRoles.map((role) => (
              <Col xs={24} sm={12} md={8} lg={6} key={role.id}>
                <RoleCard 
                  role={role} 
                  onEdit={handleEditRole}
                  onChat={handleChatWithRole}
                  onView={handleViewRoleDetail}
                />
              </Col>
            ))}
          </Row>
        </div>

        {/* 发现角色部分 */}
        <div>
          <Title level={2}>
            <RobotOutlined /> 发现角色
          </Title>
          <Row gutter={[16, 16]}>
            {discoverRoles.map((role) => (
              <Col xs={24} sm={12} md={8} lg={6} key={role.id}>
                <RoleCard 
                  role={role} 
                  showCreator={true}
                  onChat={handleChatWithRole}
                  onView={handleViewRoleDetail}
                />
              </Col>
            ))}
          </Row>
        </div>
      </div>
    </PageContainer>
  );
};
```

**主页面特点**：
- 统一展示"我的角色"和"发现角色"两个部分
- 响应式网格布局，适配不同屏幕尺寸  
- 角色卡片支持查看详情、开始聊天、编辑等操作
- 移除了侧边栏导航，采用更简洁的主页面布局

#### 4.1.2 顶栏功能按钮设计 - 新增导航组件
```typescript
// src/components/RightContent/HeaderActions.tsx
const HeaderActions: React.FC = () => {
  const createMenuItems: MenuProps['items'] = [
    {
      key: 'role',
      icon: <RobotOutlined />,
      label: '创建角色',
      onClick: () => history.push('/role/create'),
    },
    {
      key: 'voice', 
      icon: <SoundOutlined />,
      label: '创建声音',
      onClick: () => message.info('创建声音功能将在下个版本中提供'),
      disabled: true, // V2.0版本功能占位
    },
  ];

  return (
    <Space size="middle">
      <Button 
        type="text" 
        icon={<CompassOutlined />} 
        onClick={() => history.push('/home')}
      >
        发现
      </Button>
      
      <Dropdown 
        menu={{ items: createMenuItems }}
        placement="bottomRight"
        trigger={['hover']}
      >
        <Button type="primary" icon={<PlusOutlined />}>
          创建
        </Button>
      </Dropdown>
    </Space>
  );
};
```

**顶栏按钮特点**：
- **发现按钮**：快速回到主页面
- **创建下拉菜单**：包含创建角色和创建声音（占位）选项
- **集成到应用布局**：通过app.tsx的avatarProps集成到顶栏

#### 4.1.2 聊天页面 (/role/chat/:id)
```typescript
// src/pages/Role/Chat/index.tsx
const RoleChat: React.FC = () => {
  const [chatMode, setChatMode] = useState<'text' | 'voice'>('text');

  return (
    <PageContainer>
      <ChatHeader />
      <ChatModeSwitch mode={chatMode} onChange={setChatMode} />
      <MessageList />
      {chatMode === 'text' ? (
        <TextChatInput />
      ) : (
        <VoiceControls />
      )}
    </PageContainer>
  );
};
```

### 4.2 核心组件设计

#### 4.2.1 角色卡片组件
```typescript
// src/components/Role/RoleCard/index.tsx
interface RoleCardProps {
  role: API.Role;
  onSelect?: (role: API.Role) => void;
  showActions?: boolean;
}

const RoleCard: React.FC<RoleCardProps> = ({
  role,
  onSelect,
  showActions = true
}) => {
  return (
    <Card
      hoverable
      cover={<img src={role.avatar} alt={role.name} />}
      actions={showActions ? [
        <MessageOutlined onClick={() => onSelect?.(role)} />,
        <MoreOutlined />
      ] : undefined}
    >
      <Card.Meta
        title={role.name}
        description={role.description}
      />
      <div className="role-tags">
        {role.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
      </div>
    </Card>
  );
};
```

#### 4.2.2 文本聊天输入组件
```typescript
// src/components/Chat/TextChatInput/index.tsx
interface TextChatInputProps {
  onSendMessage: (message: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

const TextChatInput: React.FC<TextChatInputProps> = ({
  onSendMessage,
  loading = false,
  disabled = false
}) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <div className="text-chat-input">
      <Input.TextArea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="输入消息..."
        autoSize={{ minRows: 1, maxRows: 4 }}
        onPressEnter={(e) => {
          if (!e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        disabled={disabled}
      />
      <Button
        type="primary"
        icon={<SendOutlined />}
        onClick={handleSend}
        loading={loading}
        disabled={disabled || !message.trim()}
      >
        发送
      </Button>
    </div>
  );
};
```

#### 4.2.3 语音控制组件
```typescript
// src/components/Voice/VoiceControls/index.tsx
interface VoiceControlsProps {
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlayMessage: (messageId: string) => void;
  isRecording: boolean;
  isPlaying: boolean;
}

const VoiceControls: React.FC<VoiceControlsProps> = ({
  onStartRecording,
  onStopRecording,
  isRecording,
  isPlaying
}) => {
  return (
    <div className="voice-controls">
      <Button
        type="primary"
        shape="circle"
        size="large"
        icon={isRecording ? <PauseOutlined /> : <AudioOutlined />}
        onClick={isRecording ? onStopRecording : onStartRecording}
        loading={isPlaying}
      />
      <div className="voice-status">
        {isRecording && <VoiceWaveform />}
      </div>
    </div>
  );
};
```

#### 4.2.4 聊天模式切换组件
```typescript
// src/components/Chat/ChatModeSwitch/index.tsx
interface ChatModeSwitchProps {
  mode: 'text' | 'voice';
  onChange: (mode: 'text' | 'voice') => void;
  disabled?: boolean;
}

const ChatModeSwitch: React.FC<ChatModeSwitchProps> = ({
  mode,
  onChange,
  disabled = false
}) => {
  return (
    <div className="chat-mode-switch">
      <Radio.Group
        value={mode}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        buttonStyle="solid"
      >
        <Radio.Button value="text">
          <MessageOutlined /> 文字聊天
        </Radio.Button>
        <Radio.Button value="voice">
          <AudioOutlined /> 语音聊天
        </Radio.Button>
      </Radio.Group>
    </div>
  );
};
```

### 4.3 服务层设计

#### 4.3.1 角色服务
```typescript
// src/services/backend/role.ts
export async function getRoles(params: API.SearchRoleParams) {
  return request<API.SearchRoleResponse>('/api/roles', {
    method: 'GET',
    params,
  });
}

export async function getRoleDetail(id: number) {
  return request<API.Role>(`/api/roles/${id}`, {
    method: 'GET',
  });
}

export async function searchRoles(params: API.SearchRoleParams) {
  return request<API.SearchRoleResponse>('/api/roles/search', {
    method: 'GET',
    params,
  });
}

export async function getRoleCategories() {
  return request<API.RoleCategory[]>('/api/roles/categories', {
    method: 'GET',
  });
}

```

#### 4.3.2 语音服务工具类
```typescript
// src/utils/voiceService.ts
export class VoiceService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  // 检查浏览器支持
  static isSupported(): boolean {
    return !!(navigator.mediaDevices && 
             navigator.mediaDevices.getUserMedia &&
             window.MediaRecorder);
  }

  // 请求麦克风权限
  async requestPermission(): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });
      return true;
    } catch (error) {
      console.error('麦克风权限被拒绝:', error);
      return false;
    }
  }

  // 开始录音
  async startRecording(): Promise<void> {
    if (!this.stream) {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        throw new Error('无法获取麦克风权限');
      }
    }

    this.mediaRecorder = new MediaRecorder(this.stream!, {
      mimeType: 'audio/webm;codecs=opus'
    });
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.audioChunks = [];
    this.mediaRecorder.start(100); // 每100ms收集一次数据
  }

  // 停止录音
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('录音器未初始化'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { 
          type: 'audio/webm;codecs=opus' 
        });
        this.audioChunks = [];
        resolve(audioBlob);
      };

      this.mediaRecorder.onerror = (event) => {
        reject(new Error('录音失败'));
      };

      this.mediaRecorder.stop();
      
      // 停止音频流
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
    });
  }

  // 播放音频
  async playAudio(audioUrl: string): Promise<HTMLAudioElement> {
    const audio = new Audio(audioUrl);
    audio.preload = 'auto';
    
    return new Promise((resolve, reject) => {
      audio.oncanplaythrough = () => resolve(audio);
      audio.onerror = () => reject(new Error('音频加载失败'));
      audio.load();
    });
  }

  // 清理资源
  cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.mediaRecorder) {
      this.mediaRecorder = null;
    }
    this.audioChunks = [];
  }
}
```

#### 4.3.3 聊天服务
```typescript
// src/services/backend/chat.ts
export async function sendMessage(body: API.SendMessageRequest) {
  return request<API.SendMessageResponse>('/api/chat/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
  });
}

export async function uploadVoiceMessage(roleId: number, audioBlob: Blob) {
  const formData = new FormData();
  formData.append('roleId', roleId.toString());
  formData.append('audio', audioBlob, 'voice.webm');
  
  return request<API.SendMessageResponse>('/api/chat/voice', {
    method: 'POST',
    data: formData,
  });
}

export async function getChatHistory(roleId: number) {
  return request<API.ChatSession[]>(`/api/chat/sessions/${roleId}`, {
    method: 'GET',
  });
}

export async function deleteChatSession(sessionId: string) {
  return request(`/api/chat/sessions/${sessionId}`, {
    method: 'DELETE',
  });
}
```

## 5. 接口设计

### 5.1 RESTful API规范

#### 5.1.1 角色相关接口
```
GET /api/roles                    # 获取角色列表
GET /api/roles/:id               # 获取角色详情
GET /api/roles/categories        # 获取角色分类
GET /api/roles/search            # 搜索角色
```

#### 5.1.2 聊天相关接口
```
POST /api/chat/messages          # 发送文本消息
POST /api/chat/voice             # 发送语音消息
GET /api/chat/sessions/:roleId   # 获取聊天历史
DELETE /api/chat/sessions/:sessionId  # 删除聊天记录
```

### 5.2 WebSocket事件定义

#### 5.2.1 客户端发送事件
```typescript
// WebSocket连接管理
// src/utils/socketService.ts
import { io, Socket } from 'socket.io-client';

export class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(roleId: number): void {
    const token = TokenManager.getAccessToken();
    
    this.socket = io('/chat', {
      query: { roleId },
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket连接成功');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket连接断开');
      this.handleReconnect();
    });

    this.socket.on('message', (message: API.ChatMessage) => {
      // 处理接收到的消息（文本或语音）
      this.handleMessage(message);
    });

    this.socket.on('typing', (data: { isTyping: boolean }) => {
      // 处理角色正在输入状态
      this.handleTypingStatus(data.isTyping);
    });
  }

  // 发送文本消息
  sendTextMessage(message: API.SendMessageRequest): void {
    if (this.socket?.connected) {
      this.socket.emit('sendTextMessage', message);
    }
  }

  // 发送语音消息
  sendVoiceMessage(message: API.SendMessageRequest): void {
    if (this.socket?.connected) {
      this.socket.emit('sendVoiceMessage', message);
    }
  }

  // 通知开始输入
  startTyping(): void {
    if (this.socket?.connected) {
      this.socket.emit('startTyping');
    }
  }

  // 通知停止输入
  stopTyping(): void {
    if (this.socket?.connected) {
      this.socket.emit('stopTyping');
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.socket?.connect();
      }, 1000 * this.reconnectAttempts);
    }
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}
```

#### 5.2.2 服务端推送事件
```typescript
// 接收文本消息
socket.on('textMessage', (message: API.ChatMessage) => {
  // 处理文本消息
});

// 接收语音消息
socket.on('voiceMessage', (message: API.ChatMessage) => {
  // 处理语音消息，包含audioUrl
});

// 角色正在输入（文本模式）
socket.on('roleTyping', (data: { roleId: number, isTyping: boolean }) => {
  // 显示"正在输入..."状态
});

// 角色正在思考（语音模式）
socket.on('roleThinking', (data: { roleId: number, isThinking: boolean }) => {
  // 显示"正在思考..."状态
});

// 语音合成进度
socket.on('voiceSynthesisProgress', (data: { 
  messageId: string, 
  progress: number, 
  status: 'processing' | 'ready' | 'error' 
}) => {
  // 更新语音合成进度
});

// 连接状态
socket.on('connectionStatus', (status: 'connected' | 'disconnected') => {
  // 更新连接状态
});

// 错误处理
socket.on('error', (error: { code: string, message: string }) => {
  // 处理错误
});
```

## 6. 性能优化

### 6.1 加载优化

#### 6.1.1 代码分割
```typescript
// 路由级别的懒加载
import { lazy } from 'react';

const RoleDiscover = lazy(() => import('./pages/Role/Discover'));
const RoleChat = lazy(() => import('./pages/Role/Chat'));
const RoleDetail = lazy(() => import('./pages/Role/Detail'));

// 在路由配置中使用
{
  path: '/role/chat/:id',
  component: RoleChat,
}
```

#### 6.1.2 资源优化策略
- **图片懒加载**: 角色头像使用Intersection Observer
- **音频预加载**: 热门角色语音样本预加载
- **缓存策略**: 角色数据本地缓存5分钟
- **压缩优化**: 音频文件使用高压缩比格式

### 6.2 运行时优化

#### 6.2.1 React性能优化
```typescript
// 使用React.memo优化角色卡片渲染
const RoleCard = React.memo<RoleCardProps>(({ role, onSelect }) => {
  const handleClick = useCallback(() => {
    onSelect?.(role);
  }, [role, onSelect]);

  return (
    <Card onClick={handleClick}>
      {/* 卡片内容 */}
    </Card>
  );
});

// 使用useMemo缓存计算结果
const filteredRoles = useMemo(() => {
  return roles.filter(role => 
    role.category === selectedCategory &&
    role.name.toLowerCase().includes(searchKeyword.toLowerCase())
  );
}, [roles, selectedCategory, searchKeyword]);
```

#### 6.2.2 音频性能优化
```typescript
// 音频对象池管理
class AudioPool {
  private pool: HTMLAudioElement[] = [];
  private maxSize = 5;

  getAudio(): HTMLAudioElement {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return new Audio();
  }

  releaseAudio(audio: HTMLAudioElement): void {
    if (this.pool.length < this.maxSize) {
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';
      this.pool.push(audio);
    }
  }
}
```

### 6.3 缓存策略

#### 6.3.1 数据缓存
```typescript
// 使用React Query进行数据缓存
import { useQuery } from 'react-query';

const useRoles = (category?: string) => {
  return useQuery(
    ['roles', category],
    () => getRoles({ category, page: 1, pageSize: 20 }),
    {
      staleTime: 5 * 60 * 1000, // 5分钟内数据被认为是新鲜的
      cacheTime: 10 * 60 * 1000, // 缓存保持10分钟
      refetchOnWindowFocus: false,
    }
  );
};
```

## 7. 安全设计

### 7.1 身份认证集成
```typescript
// 扩展现有的TokenManager
export class TokenManager {
  // ... 现有方法

  // 为WebSocket连接提供认证
  static getSocketAuthToken(): string | null {
    return this.getAccessToken();
  }

  // 检查是否有聊天权限
  static canAccessChat(): boolean {
    return this.hasToken() && this.getUserId() !== null;
  }
}
```

### 7.2 输入验证和安全
```typescript
// 消息内容验证
export const validateMessage = (content: string): { valid: boolean; error?: string } => {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: '消息内容不能为空' };
  }
  
  if (content.length > 1000) {
    return { valid: false, error: '消息内容不能超过1000字符' };
  }

  // 基础的敏感词过滤（实际项目中应使用专业的过滤服务）
  const sensitiveWords = ['敏感词1', '敏感词2']; // 示例
  const hasSensitiveWord = sensitiveWords.some(word => 
    content.toLowerCase().includes(word.toLowerCase())
  );
  
  if (hasSensitiveWord) {
    return { valid: false, error: '消息包含不当内容' };
  }

  return { valid: true };
};

// 音频文件验证
export const validateAudioFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/ogg'];
  
  if (file.size > maxSize) {
    return { valid: false, error: '音频文件不能超过10MB' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: '不支持的音频格式' };
  }
  
  return { valid: true };
};
```

## 8. 部署架构

### 8.1 构建配置优化

#### 8.1.2 生产环境配置
```typescript
// config/config.prod.ts
export default {
  define: {
    API_BASE_URL: 'https://api.yourdomain.com',
    WS_BASE_URL: 'wss://api.yourdomain.com',
  },
  hash: true,
  publicPath: '/static/',
  
  // 代码分割优化
  chunks: ['vendors', 'commons', 'umi'],
  chainWebpack(config) {
    config.optimization.splitChunks({
      chunks: 'all',
      cacheGroups: {
        vendors: {
          name: 'vendors',
          test: /[\\/]node_modules[\\/]/,
          priority: 10,
          chunks: 'all',
        },
        commons: {
          name: 'commons',
          chunks: 'all',
          minChunks: 2,
          priority: 5,
        },
      },
    });
  },
};
```

### 8.2 错误处理和监控

#### 8.2.1 全局错误处理
```typescript
// src/utils/errorHandler.ts
export class ErrorHandler {
  static handleApiError(error: any): string {
    if (error.response) {
      // 服务器响应错误
      switch (error.response.status) {
        case 401:
          TokenManager.clearTokens();
          window.location.href = '/user/login';
          return '登录已过期，请重新登录';
        case 403:
          return '权限不足';
        case 404:
          return '请求的资源不存在';
        case 500:
          return '服务器内部错误';
        default:
          return error.response.data?.message || '请求失败';
      }
    } else if (error.request) {
      // 网络错误
      return '网络连接失败，请检查网络设置';
    } else {
      // 其他错误
      return error.message || '未知错误';
    }
  }

  static handleVoiceError(error: any): string {
    if (error.name === 'NotAllowedError') {
      return '麦克风权限被拒绝，请在浏览器设置中允许麦克风访问';
    } else if (error.name === 'NotFoundError') {
      return '未找到麦克风设备';
    } else if (error.name === 'NotSupportedError') {
      return '当前浏览器不支持语音功能';
    }
    return '语音功能异常，请稍后重试';
  }
}
```

### 8.3 监控和日志

#### 8.3.1 性能监控
```typescript
// src/utils/monitor.ts
export class PerformanceMonitor {
  // 页面加载性能监控
  static trackPageLoad(pageName: string): void {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;
      
      // 发送到监控服务
      this.sendMetric('page_load_time', {
        page: pageName,
        loadTime,
        timestamp: Date.now(),
      });
    }
  }

  // API响应时间监控
  static trackApiCall(api: string, duration: number, success: boolean): void {
    this.sendMetric('api_call', {
      api,
      duration,
      success,
      timestamp: Date.now(),
    });
  }

  // 语音功能使用监控
  static trackVoiceUsage(action: 'start_record' | 'stop_record' | 'play_audio', roleId?: number): void {
    this.sendMetric('voice_usage', {
      action,
      roleId,
      timestamp: Date.now(),
    });
  }

  private static sendMetric(event: string, data: any): void {
    // 实际项目中应发送到监控服务
    console.log(`[Monitor] ${event}:`, data);
  }
}
```

通过这个详细的技术设计文档，我们为AI角色扮演聊天功能提供了完整的技术实现指南，确保能够在现有架构基础上高质量地实现所有需求功能。