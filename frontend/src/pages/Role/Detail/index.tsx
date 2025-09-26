import { deleteRole, getRoleDetail, getRoleStats } from '@/services/backend/role';
import {
  CalendarOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  FireOutlined,
  HeartOutlined,
  MessageOutlined,
  ShareAltOutlined,
  SoundOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  message,
  Modal,
  Row,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useState } from 'react';
import { history, useParams } from 'umi';
import './index.less';

const { Title, Paragraph, Text } = Typography;

const RoleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [role, setRole] = useState<API.Role | null>(null);
  const [stats, setStats] = useState<{
    totalChats: number;
    totalMessages: number;
    avgRating: number;
    lastChatAt: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isFavorited, setIsFavorited] = useState(false);

  // 获取角色详情
  useEffect(() => {
    const fetchRoleDetail = async () => {
      if (!id) {
        setError('角色ID不存在');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getRoleDetail({ id: parseInt(id) });
        if (response?.role) {
          setRole(response.role);
          // 获取角色统计信息
          fetchRoleStats(parseInt(id));
        } else {
          setError('角色不存在');
        }
      } catch (error: any) {
        console.error('获取角色详情失败:', error);
        setError(error?.message || '获取角色详情失败');
      } finally {
        setLoading(false);
      }
    };

    fetchRoleDetail();
  }, [id]);

  // 获取角色统计信息
  const fetchRoleStats = async (roleId: number) => {
    try {
      setStatsLoading(true);
      const response = await getRoleStats(roleId);
      if (response) {
        setStats(response);
      }
    } catch (error) {
      console.error('获取角色统计失败:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // 事件处理函数
  const handleBack = () => {
    history.back();
  };

  const handleStartChat = () => {
    if (role) {
      history.push(`/role/chat/${role.id}`);
    }
  };

  const handleEdit = () => {
    if (role) {
      history.push(`/role/edit/${role.id}`);
    }
  };

  const handleDelete = () => {
    if (!role) return;

    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除角色"${role.name}"吗？此操作不可恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteRole(role.id);
          message.success('角色删除成功');
          history.push('/role/home');
        } catch (error: any) {
          message.error(error?.message || '删除角色失败');
        }
      },
    });
  };

  const handleFavorite = () => {
    // TODO: 实现收藏功能
    setIsFavorited(!isFavorited);
    message.success(isFavorited ? '已取消收藏' : '已添加到收藏');
  };

  const handleShare = () => {
    // TODO: 实现分享功能
    if (navigator.share) {
      navigator.share({
        title: `AI角色 - ${role?.name}`,
        text: role?.description,
        url: window.location.href,
      });
    } else {
      // 复制链接到剪贴板
      navigator.clipboard.writeText(window.location.href);
      message.success('链接已复制到剪贴板');
    }
  };

  // 检查是否为角色创建者
  const isOwner = () => {
    // TODO: 实现用户权限检查
    // const currentUserId = getCurrentUserId();
    // return role?.creatorId === currentUserId;
    return true; // 临时返回true，实际需要根据用户权限判断
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 页面加载中
  if (loading) {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" tip="加载角色信息中..." />
        </div>
      </PageContainer>
    );
  }

  // 错误状态
  if (error || !role) {
    return (
      <PageContainer>
        <Card>
          <Alert
            message="加载失败"
            description={error || '角色不存在'}
            type="error"
            showIcon
            action={
              <Space>
                <Button size="small" onClick={() => window.location.reload()}>
                  重新加载
                </Button>
                <Button size="small" onClick={handleBack}>
                  返回
                </Button>
              </Space>
            }
          />
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      header={{
        title: role.name,
        onBack: handleBack,
        extra: [
          <Button key="share" icon={<ShareAltOutlined />} onClick={handleShare}>
            分享
          </Button>,
          <Button
            key="favorite"
            icon={<HeartOutlined />}
            type={isFavorited ? 'primary' : 'default'}
            onClick={handleFavorite}
          >
            {isFavorited ? '已收藏' : '收藏'}
          </Button>,
          <Button
            key="chat"
            type="primary"
            icon={<MessageOutlined />}
            onClick={handleStartChat}
            size="large"
          >
            开始聊天
          </Button>,
        ],
      }}
      className="role-detail-page"
    >
      <Row gutter={[24, 24]}>
        {/* 左侧主要信息 */}
        <Col xs={24} lg={16}>
          {/* 角色基本信息卡片 */}
          <Card className="role-info-card">
            <div className="role-header">
              <Avatar
                size={120}
                src={role.avatar}
                icon={<UserOutlined />}
                className="role-avatar"
              />
              <div className="role-basic-info">
                <Title level={2} style={{ margin: 0 }}>
                  {role.name}
                </Title>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  {role.category}
                </Text>
                <div style={{ marginTop: 12 }}>
                  <Space wrap>
                    {role.tags?.map((tag, index) => (
                      <Tag key={index} color="blue" style={{ fontSize: '13px' }}>
                        {tag}
                      </Tag>
                    ))}
                  </Space>
                </div>
                {isOwner() && (
                  <div style={{ marginTop: 16 }}>
                    <Space>
                      <Button icon={<EditOutlined />} onClick={handleEdit}>
                        编辑角色
                      </Button>
                      <Button danger onClick={handleDelete}>
                        删除角色
                      </Button>
                    </Space>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* 角色描述 */}
          <Card title="角色介绍" style={{ marginTop: 24 }}>
            <Paragraph style={{ fontSize: '15px', lineHeight: 1.8 }}>{role.description}</Paragraph>
          </Card>

          {/* 性格特征 */}
          <Card title="性格特征" style={{ marginTop: 24 }}>
            <Paragraph style={{ fontSize: '15px', lineHeight: 1.8 }}>{role.personality}</Paragraph>
          </Card>

          {/* 角色背景 */}
          <Card title="角色背景" style={{ marginTop: 24 }}>
            <Paragraph style={{ fontSize: '15px', lineHeight: 1.8 }}>{role.background}</Paragraph>
          </Card>

          {/* 开场白 */}
          {role.quotes && role.quotes.length > 0 && (
            <Card title="开场白" style={{ marginTop: 24 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {role.quotes.map((quote, index) => (
                  <Card
                    key={index}
                    size="small"
                    style={{
                      background: '#f8f9fa',
                      border: '1px solid #e9ecef',
                      fontStyle: 'italic',
                    }}
                  >
                    "{quote}"
                  </Card>
                ))}
              </Space>
            </Card>
          )}
        </Col>

        {/* 右侧统计信息 */}
        <Col xs={24} lg={8}>
          {/* 角色统计 */}
          <Card title="角色统计" loading={statsLoading}>
            {stats ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Statistic
                  title="总对话次数"
                  value={stats.totalChats}
                  prefix={<MessageOutlined />}
                />
                <Divider />
                <Statistic title="总消息数" value={stats.totalMessages} prefix={<FireOutlined />} />
                <Divider />
                <Statistic title="平均评分" value={stats.avgRating} precision={1} suffix="/ 5.0" />
                {stats.lastChatAt && (
                  <>
                    <Divider />
                    <div>
                      <Text type="secondary">最后聊天时间</Text>
                      <br />
                      <Text>{formatDate(stats.lastChatAt)}</Text>
                    </div>
                  </>
                )}
              </Space>
            ) : (
              <Text type="secondary">暂无统计数据</Text>
            )}
          </Card>

          {/* 创建者信息 */}
          {role.creator && (
            <Card title="创建者" style={{ marginTop: 24 }}>
              <Space>
                <Avatar size={40} src={role.creator.avatar} icon={<UserOutlined />} />
                <div>
                  <div style={{ fontWeight: 500 }}>{role.creator.name}</div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    创建者
                  </Text>
                </div>
              </Space>
            </Card>
          )}

          {/* 角色详细信息 */}
          <Card title="详细信息" style={{ marginTop: 24 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="人气值">
                <Text strong>{role.popularity || 0}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="声音模型">
                <Space>
                  <SoundOutlined />
                  <Text>{role.voiceStyle}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                <Space>
                  <CalendarOutlined />
                  <Text>{formatDate(role.createdAt)}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                <Text>{formatDate(role.updatedAt)}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 快速操作 */}
          <Card title="快速操作" style={{ marginTop: 24 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<MessageOutlined />}
                onClick={handleStartChat}
                block
                size="large"
              >
                开始聊天
              </Button>
              <Button icon={<HeartOutlined />} onClick={handleFavorite} block>
                {isFavorited ? '取消收藏' : '添加收藏'}
              </Button>
              <Button icon={<ShareAltOutlined />} onClick={handleShare} block>
                分享角色
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default RoleDetail;
