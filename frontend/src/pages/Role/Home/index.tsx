import { PageContainer } from '@ant-design/pro-components';
import { Card, Row, Col, Button, Typography, Space, Empty, Avatar } from 'antd';
import { PlusOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';
import { history } from 'umi';
import { useState, useEffect } from 'react';

const { Title, Paragraph } = Typography;

// 临时模拟数据
const mockMyRoles = [
  {
    id: 1,
    name: '智能助手小爱',
    avatar: '',
    description: '一个温柔体贴的AI助手，可以帮助你处理日常事务',
    category: 'assistant',
    tags: ['助手', '温柔', '贴心'],
    createdAt: '2024-01-15',
  },
  {
    id: 2,
    name: '历史学者',
    avatar: '',
    description: '博学的历史专家，对各个历史时期都有深入了解',
    category: 'education',
    tags: ['历史', '学者', '博学'],
    createdAt: '2024-01-10',
  },
];

const mockDiscoverRoles = [
  {
    id: 3,
    name: '心理咨询师',
    avatar: '',
    description: '专业的心理咨询师，能够倾听和理解你的困扰',
    category: 'counselor',
    tags: ['心理', '倾听', '专业'],
    creator: { name: '用户A' },
    popularity: 128,
  },
  {
    id: 4,
    name: '编程导师',
    avatar: '',
    description: '经验丰富的编程老师，可以指导各种编程问题',
    category: 'education',
    tags: ['编程', '教学', '技术'],
    creator: { name: '用户B' },
    popularity: 95,
  },
  {
    id: 5,
    name: '创意写手',
    avatar: '',
    description: '富有想象力的创意写手，擅长各种文体创作',
    category: 'creative',
    tags: ['创作', '想象力', '文学'],
    creator: { name: '用户C' },
    popularity: 76,
  },
  {
    id: 6,
    name: '旅行向导',
    avatar: '',
    description: '熟悉世界各地的旅行专家，为你规划完美行程',
    category: 'travel',
    tags: ['旅行', '向导', '规划'],
    creator: { name: '用户D' },
    popularity: 54,
  },
];

const RoleCard: React.FC<{
  role: any;
  showCreator?: boolean;
  onEdit?: (role: any) => void;
  onChat?: (role: any) => void;
  onView?: (role: any) => void;
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
  const [myRoles, setMyRoles] = useState(mockMyRoles);
  const [discoverRoles, setDiscoverRoles] = useState(mockDiscoverRoles);

  const handleCreateRole = () => {
    history.push('/role/create');
  };

  const handleEditRole = (role: any) => {
    history.push(`/role/edit/${role.id}`);
  };

  const handleChatWithRole = (role: any) => {
    history.push(`/role/chat/${role.id}`);
  };

  const handleViewRoleDetail = (role: any) => {
    history.push(`/role/detail/${role.id}`);
  };

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
          
          {myRoles.length > 0 ? (
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
