import { PageContainer } from '@ant-design/pro-components';
import { Card, Row, Col, Button, Typography, Space, Empty, Avatar, Spin } from 'antd';
import { PlusOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';
import { history } from 'umi';
import { useEffect, useState } from 'react';

const { Title, Paragraph } = Typography;

// 临时模拟数据，待状态管理完善后移除
const mockMyRoles: API.Role[] = [
  {
    id: 10,
    name: '智能助手小爱',
    avatar: '',
    description: '一个温柔体贴的AI助手，可以帮助你处理日常事务',
    category: 'assistant',
    tags: ['助手', '温柔', '贴心'],
    personality: '温柔、体贴、高效',
    background: '专为用户日常生活服务的智能助手',
    quotes: ['你好！我是小爱，有什么可以帮助你的吗？'],
    voiceStyle: 'gentle_female',
    popularity: 0,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    creatorId: 100,
  },
];

const mockDiscoverRoles: API.Role[] = [
  {
    id: 1,
    name: '心理咨询师',
    avatar: '',
    description: '专业的心理咨询师，能够倾听和理解你的困扰',
    category: 'counselor',
    tags: ['心理', '倾听', '专业'],
    personality: '温柔、耐心、专业',
    background: '拥有10年心理咨询经验的专业咨询师',
    quotes: ['你好，我是你的心理咨询师，有什么困扰可以和我分享'],
    voiceStyle: 'gentle_female',
    popularity: 128,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    creatorId: 1,
    creator: { id: 1, name: '用户A', avatar: '', birthday: undefined, sex: undefined, signature: undefined },
  },
  {
    id: 2,
    name: '编程导师',
    avatar: '',
    description: '经验丰富的编程老师，可以指导各种编程问题',
    category: 'education',
    tags: ['编程', '教学', '技术'],
    personality: '严谨、逻辑清晰、有耐心',
    background: '资深软件工程师，有丰富的教学经验',
    quotes: ['Hello! 我是你的编程导师，让我们一起探索代码的世界'],
    voiceStyle: 'mature_male',
    popularity: 95,
    createdAt: '2024-01-14T15:20:00Z',
    updatedAt: '2024-01-14T15:20:00Z',
    creatorId: 2,
    creator: { id: 2, name: '用户B', avatar: '', birthday: undefined, sex: undefined, signature: undefined },
  },
];

const RoleCard: React.FC<{
  role: API.Role;
  showCreator?: boolean;
  onEdit?: (role: API.Role) => void;
  onChat?: (role: API.Role) => void;
  onView?: (role: API.Role) => void;
}> = ({ role, showCreator = false, onEdit, onChat, onView }) => {
  return (
    <Card
      hoverable
      style={{ height: '100%' }}
      cover={
        <div style={{ 
          height: 120, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Avatar size={60} icon={<RobotOutlined />} />
        </div>
      }
      actions={[
        <Button 
          type="link" 
          onClick={() => onView?.(role)}
        >
          查看详情
        </Button>,
        <Button 
          type="link" 
          onClick={() => onChat?.(role)}
        >
          开始聊天
        </Button>,
        ...(onEdit ? [
          <Button 
            type="link" 
            onClick={() => onEdit(role)}
          >
            编辑
          </Button>
        ] : [])
      ]}
    >
      <Card.Meta
        title={role.name}
        description={
          <div>
            <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 8 }}>
              {role.description}
            </Paragraph>
            <Space wrap>
              {role.tags?.slice(0, 3).map((tag: string) => (
                <span key={tag} style={{ 
                  background: '#f0f0f0', 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  fontSize: '12px',
                  color: '#666'
                }}>
                  {tag}
                </span>
              ))}
            </Space>
            {showCreator && role.creator && (
              <div style={{ marginTop: 8, fontSize: '12px', color: '#999' }}>
                创建者: {role.creator.name} • 热度: {role.popularity}
              </div>
            )}
          </div>
        }
      />
    </Card>
  );
};

const RoleHome: React.FC = () => {
  const [myRoles, setMyRoles] = useState<API.Role[]>([]);
  const [discoverRoles, setDiscoverRoles] = useState<API.Role[]>([]);
  const [loading, setLoading] = useState({ myRoles: true, roleList: true });

  const handleCreateRole = () => {
    history.push('/role/create');
  };

  const handleEditRole = (role: API.Role) => {
    history.push(`/role/edit/${role.id}`);
  };

  const handleChatWithRole = (role: API.Role) => {
    history.push(`/role/chat/${role.id}`);
  };

  const handleViewRoleDetail = (role: API.Role) => {
    history.push(`/role/detail/${role.id}`);
  };

  useEffect(() => {
    // 模拟加载数据
    setLoading({ myRoles: true, roleList: true });
    
    setTimeout(() => {
      setMyRoles(mockMyRoles);
      setLoading(prev => ({ ...prev, myRoles: false }));
    }, 1000);

    setTimeout(() => {
      setDiscoverRoles(mockDiscoverRoles);
      setLoading(prev => ({ ...prev, roleList: false }));
    }, 1200);
  }, []);

  return (
    <PageContainer
      title={false}
      style={{ padding: '24px' }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* 我的角色部分 */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 24 
          }}>
            <Title level={2} style={{ margin: 0 }}>
              <UserOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              我的角色
            </Title>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleCreateRole}
              size="large"
            >
              创建新角色
            </Button>
          </div>
          
          {loading.myRoles ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
            </div>
          ) : myRoles.length > 0 ? (
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
          ) : (
            <Card>
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="您还没有创建任何角色"
              >
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={handleCreateRole}
                >
                  创建第一个角色
                </Button>
              </Empty>
            </Card>
          )}
        </div>

        {/* 发现角色部分 */}
        <div>
          <Title level={2} style={{ marginBottom: 24 }}>
            <RobotOutlined style={{ marginRight: 8, color: '#52c41a' }} />
            发现角色
          </Title>
          
          {loading.roleList ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
            </div>
          ) : (
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
          )}
          
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Button size="large">
              查看更多角色
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default RoleHome;
