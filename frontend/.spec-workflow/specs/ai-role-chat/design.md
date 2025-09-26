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
- ✅ **实时语音通话**: 与AI角色进行基于WebSocket的实时语音对话
- ✅ **聊天历史**: 保存和查看与各个角色的对话记录
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
采用页面级状态管理方案，使用React Hooks进行本地状态管理：

```typescript
// 页面级状态管理示例

// 角色相关页面
const RoleHomePage = () => {
  const [roleList, setRoleList] = useState<API.Role[]>([]);
  const [categories, setCategories] = useState<API.RoleCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [roles, cats] = await Promise.all([
          roleAPI.getRoleList(),
          roleAPI.getCategories()
        ]);
        setRoleList(roles);
        setCategories(cats);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
};

// 聊天页面
const ChatPage = () => {
  const [messages, setMessages] = useState<API.ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatMode, setChatMode] = useState<'text' | 'voice'>('text');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const sendMessage = async (content: string) => {
    const response = await chatAPI.sendMessage({ content, roleId });
    setMessages(prev => [...prev, response.userMessage, response.aiMessage]);
  };
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
    type: 'text';
    sender: 'user' | 'role';
    timestamp: string;
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
    type: 'text';
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

#### 2.3.2 实时语音聊天数据流（基于WebSocket）
```
用户音频流 → 阿里云STT → 识别文本 → 后端LLM处理 → 阿里云TTS → 音频流 → 前端播放
     ↓              ↓              ↓              ↓              ↓              ↓
   音频捕获      实时语音识别    文本传输      AI对话服务     语音合成服务    音频播放器
   
详细流程：
前端音频采集 → WebSocket直连阿里云STT → 文本返回前端 → 前端发送文本到后端 → 后端调用LLM → 后端调用TTS → 音频流返回前端
```


#### 2.3.3 WebSocket连接架构
```
前端 ←WebSocket1→ 阿里云STT     前端 ←WebSocket2→ 后端服务
  ↓                                ↓
音频流传输                      文本/音频流传输
```

**架构组件**：
- **前端音频处理**: MediaRecorder API进行音频捕获和分片
- **WebSocket连接1**: 前端直连阿里云STT服务进行音频识别
- **WebSocket连接2**: 前端与后端进行文本和音频流传输
- **后端AI服务**: 集成LLM对话和TTS的服务
- **阿里云服务**: STT语音识别、LLM大模型、TTS语音合成

**核心功能**：
- 音频实时分片传输到阿里云STT（100ms分片）
- 前端直接获取STT识别结果
- 文本通过后端进行LLM处理
- TTS音频流实时返回前端播放
- 音频质量优化（AEC、NS、AGC）
- 实时音量监测和可视化

## 3. 技术栈选择

### 3.1 核心技术
- **前端框架**: React 18 + TypeScript（继承现有架构）
- **UI组件库**: Ant Design 5.x + Pro Components（继承现有）
- **构建工具**: UmiJS 4.x（继承现有）
- **状态管理**: React Hooks + 页面级状态管理
- **路由管理**: UmiJS内置路由系统

### 3.2 实时语音技术栈
- **实时通信**: 双WebSocket连接（前端↔阿里云STT，前端↔后端）
- **音频捕获**: MediaRecorder API + MediaStream
- **音频播放**: Web Audio API + AudioBufferSourceNode
- **数据传输**: WebSocket Binary (音频分片传输到阿里云STT)
- **音频格式**: PCM 16kHz 16bit单声道 (阿里云STT要求)
- **文本传输**: WebSocket JSON (前端↔后端文本交互)
- **音频处理**: 
  - 回声消除 (AEC)
  - 噪声抑制 (NS) 
  - 自动增益控制 (AGC)
  - 实时音频分片

### 3.3 新增依赖库
```json
{
  "dependencies": {
    // 无需新增依赖，使用浏览器原生API
  }
}
```

### 3.4 后端服务技术栈
- **服务器框架**: Node.js + Express (或其他后端框架)
- **实时通信**: WebSocket (与前端进行文本和音频流交互)
- **AI服务**: 阿里云LLM大模型API
- **语音服务**: 阿里云TTS实时语音合成API
- **音频处理**: FFmpeg (音频格式转换和处理)
- **认证**: 阿里云AccessKey + JWT用户认证

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
        <RealtimeVoiceControls />
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


#### 4.3.3 阿里云STT直连服务使用示例
```typescript
// src/utils/alicloudSTTService.ts 使用示例
import { getAlicloudSTTService } from '@/utils/alicloudSTTService';

const sttService = getAlicloudSTTService({
  sampleRate: 16000, // 阿里云要求配置
  channels: 1,
  encoding: 'pcm',
  chunkDuration: 100, // 100ms分片
});

// 设置事件处理器
sttService.setHandlers({
  onStatusChange: (status) => {
    console.log('STT状态变化:', status);
    setSTTStatus(status);
  },
  onVolumeChange: (volume) => {
    // 更新音量指示器
    setVolumeLevel(volume);
  },
  onTextReceived: (text) => {
    // 处理接收到的识别文本
    console.log('收到STT识别文本:', text);
    // 发送文本到后端进行LLM处理
    sendTextToBackend(text);
  },
  onError: (error) => {
    console.error('STT服务错误:', error);
    message.error(error.message);
  },
});

// 发送文本到后端处理
const sendTextToBackend = async (text: string) => {
  try {
    // 通过WebSocket发送到后端
    backendSocket.send(JSON.stringify({
      type: 'chat_message',
      content: text,
      roleId,
      sessionId
    }));
  } catch (error) {
    console.error('发送文本到后端失败:', error);
  }
};

// 开始语音识别
const handleStartVoiceRecognition = async () => {
  try {
    await sttService.startRecognition(roleId, sessionId);
  } catch (error) {
    console.error('开始语音识别失败:', error);
  }
};

// 结束语音识别
const handleStopVoiceRecognition = async () => {
  try {
    await sttService.stopRecognition();
  } catch (error) {
    console.error('结束语音识别失败:', error);
  }
};
```

#### 4.3.4 聊天服务
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
GET /api/chat/sessions/:roleId   # 获取聊天历史
DELETE /api/chat/sessions/:sessionId  # 删除聊天记录
```

### 5.2 WebSocket流式音频事件定义

#### 5.2.1 WebSocket流式音频服务
```typescript
// WebSocket流式音频连接管理
// src/utils/socketService.ts
export class SocketService {
  private socket: WebSocket | null = null;
  private status: ConnectionStatus = 'disconnected';

  // 发送语音流开始信号
  public sendVoiceStreamStart(roleId: number, sessionId: string): boolean {
    return this.sendMessage({
      type: 'voice_stream_start',
      payload: { roleId, sessionId },
    });
  }

  // 发送音频数据
  public sendAudioData(roleId: number, sessionId: string, audioData: ArrayBuffer): boolean {
    // 创建包含元数据的二进制消息
    const metadata = JSON.stringify({
      type: 'voice_stream_data',
      roleId,
      sessionId,
      timestamp: new Date().toISOString(),
    });
    
    const metadataBuffer = new TextEncoder().encode(metadata);
    const metadataLength = new Uint32Array([metadataBuffer.length]);
    
    // 组合元数据长度 + 元数据 + 音频数据
    const combinedBuffer = new ArrayBuffer(4 + metadataBuffer.length + audioData.byteLength);
    const view = new Uint8Array(combinedBuffer);
    
    view.set(new Uint8Array(metadataLength.buffer), 0);
    view.set(metadataBuffer, 4);
    view.set(new Uint8Array(audioData), 4 + metadataBuffer.length);
    
    this.socket.send(combinedBuffer);
    return true;
  }

  // 处理接收到的音频数据
  private handleAudioData(data: ArrayBuffer): void {
    const metadataLength = new Uint32Array(data.slice(0, 4))[0];
    const metadataBuffer = data.slice(4, 4 + metadataLength);
    const metadata = JSON.parse(new TextDecoder().decode(metadataBuffer));
    const audioData = data.slice(4 + metadataLength);
    
    this.handlers.onVoiceStreamData?.(
      metadata.roleId,
      metadata.sessionId,
      audioData
    );
  }
}
```

#### 5.2.2 流式音频事件处理
```typescript
// 流式音频事件类型
interface StreamingAudioEvents {
  // 语音流开始
  'voice_stream_start': (data: { roleId: number, sessionId: string }) => void;
  
  // 语音流结束
  'voice_stream_end': (data: { roleId: number, sessionId: string, duration: number }) => void;
  
  // 音频数据传输（二进制）
  'voice_stream_data': (data: { roleId: number, sessionId: string, audioData: ArrayBuffer }) => void;
  
  // 文本消息
  'chat_message': (data: { roleId: number, sessionId: string, message: any, timestamp: number }) => void;
  
  // 输入状态
  'typing_start': (data: { roleId: number, sessionId: string }) => void;
  'typing_stop': (data: { roleId: number, sessionId: string }) => void;
}

// 前端事件处理器设置
const socketService = getSocketService();
socketService.setHandlers({
  onVoiceStreamStart: (roleId, sessionId) => {
    console.log('语音流开始:', roleId, sessionId);
  },
  onVoiceStreamData: (roleId, sessionId, audioData) => {
    // 播放接收到的音频数据
    audioPlayer.playAudioChunk(audioData);
  },
  onVoiceStreamEnd: (roleId, sessionId, duration) => {
    console.log('语音流结束:', roleId, sessionId, duration);
  }
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
- **压缩优化**: 实时音频流使用高效压缩

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

## 9. 后端服务架构

### 9.1 后端处理概述
后端负责接收前端发送的识别文本，调用阿里云LLM生成回复，然后调用阿里云TTS生成音频流返回前端。

### 9.2 后端服务架构
```
后端WebSocket服务 (Node.js + Express)
├── 连接管理
│   ├── 前端WebSocket连接处理
│   ├── 会话状态管理
│   └── 断线重连机制
├── 文本处理
│   ├── 接收前端STT识别文本
│   ├── 角色上下文管理
│   └── 对话历史维护
├── AI服务集成
│   ├── 阿里云LLM调用
│   ├── 角色个性化回复
│   └── 上下文传递
└── 音频输出
    ├── 阿里云TTS实时合成
    ├── 音频流分片发送
    └── 质量自适应
```

### 9.3 技术要求
- **Node.js**: >= 16.0.0
- **音频处理**: FFmpeg for audio format conversion
- **STT服务**: 前端直连阿里云实时STT服务
- **TTS服务**: 阿里云实时TTS API
- **AI服务**: 阿里云LLM大模型API
- **认证**: 阿里云AccessKey认证

## 10. 总结

通过这个详细的技术设计文档，我们为AI角色扮演聊天功能提供了完整的技术实现指南，基于前端直连阿里云STT和后端集成LLM+TTS的架构设计，确保能够在现有架构基础上高质量地实现所有需求功能。

主要技术亮点：
- 基于现有Ant Design Pro架构的无缝集成
- 前端直连阿里云STT实现低延迟语音识别
- 双WebSocket连接架构（前端↔阿里云STT，前端↔后端）
- 后端专注于LLM对话和TTS音频生成
- 完善的状态管理和错误处理机制
- 良好的可扩展性和维护性
- 充分利用阿里云AI服务的技术优势