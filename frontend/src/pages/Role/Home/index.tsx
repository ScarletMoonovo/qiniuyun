import {
  EditOutlined,
  ExclamationCircleOutlined,
  MessageOutlined,
  PlusOutlined,
  RobotOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Input,
  message,
  Modal,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useState } from 'react';
import { history } from 'umi';
// import { RoleCard } from '@/components/Role';
// import { deleteRole, getMyRoles, getRoleList, searchRoles } from '@/services/backend/character';
import './index.less';

const { Title } = Typography;
const { Search } = Input;

// 角色分类选项
const roleCategories = [
  { label: '全部分类', value: '' },
  { label: '智能助手', value: 'assistant' },
  { label: '教育导师', value: 'education' },
  { label: '心理咨询', value: 'counselor' },
  { label: '创意伙伴', value: 'creative' },
  { label: '生活顾问', value: 'lifestyle' },
  { label: '专业顾问', value: 'professional' },
  { label: '娱乐陪伴', value: 'entertainment' },
  { label: '其他', value: 'other' },
];

const RoleHome: React.FC = () => {
  // 状态管理
  const [myRoles, setMyRoles] = useState<API.Character[]>([]);
  const [discoverRoles, setDiscoverRoles] = useState<API.Character[]>([]);
  const [searchResults, setSearchResults] = useState<API.Character[]>([]);
  const [loading, setLoading] = useState({
    myRoles: false,
    discover: false,
    search: false,
  });

  // 搜索和筛选状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);

  // 分页状态
  const [pagination, setPagination] = useState({
    myRoles: { page: 1, pageSize: 8, total: 0, hasMore: true },
    discover: { page: 1, pageSize: 12, total: 0, hasMore: true },
    search: { page: 1, pageSize: 12, total: 0, hasMore: true },
  });

  // 事件处理函数
  const handleCreateRole = () => {
    history.push('/role/create');
  };

  const handleEditRole = (role: API.Character) => {
    history.push(`/role/edit/${role.id}`);
  };

  const handleChatWithRole = (role: API.Character) => {
    history.push(`/role/chat/${role.id}`);
  };

  const handleViewRoleDetail = (role: API.Character) => {
    history.push(`/role/detail/${role.id}`);
  };

  const handleDeleteRole = (role: API.Character) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除角色"${role.name}"吗？此操作不可恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          // TODO: 实现删除角色接口
          // await deleteRole(role.id);
          message.success('角色删除成功');
          // 重新加载我的角色列表
          loadMyRoles();
        } catch (error: any) {
          message.error(error?.message || '删除角色失败');
        }
      },
    });
  };

  // 数据加载函数
  const loadMyRoles = async (page = 1) => {
    try {
      setLoading((prev) => ({ ...prev, myRoles: true }));
      // TODO: 实现获取我的角色接口
      // const response = await getMyRoles({
      //   page,
      //   pageSize: pagination.myRoles.pageSize,
      // });

      // 临时模拟数据
      const mockMyRoles: API.Character[] = [
        {
          id: 1,
          name: '我的AI助手',
          avatar: '',
          description: '这是我创建的第一个AI助手角色',
          background: '专业的AI助手，能够帮助用户解决各种问题',
          open_line: '你好，我是你的专属AI助手',
          tags: ['助手', '智能', '专业'],
          is_public: true,
          user_id: 1,
          created_at: Date.now() - 86400000,
          updated_at: Date.now(),
        },
        {
          id: 2,
          name: '学习伙伴',
          avatar: '',
          description: '陪伴学习的AI角色',
          background: '专注于教育和学习辅导的AI角色',
          open_line: '让我们一起学习吧！',
          tags: ['教育', '学习', '陪伴'],
          is_public: false,
          user_id: 1,
          created_at: Date.now() - 172800000,
          updated_at: Date.now(),
        },
      ];

      if (page === 1) {
        setMyRoles(mockMyRoles);
      } else {
        setMyRoles((prev) => [...prev, ...mockMyRoles]);
      }

      setPagination((prev) => ({
        ...prev,
        myRoles: {
          ...prev.myRoles,
          page,
          total: mockMyRoles.length,
          hasMore: false,
        },
      }));
    } catch (error: any) {
      console.error('加载我的角色失败:', error);
      message.error('加载我的角色失败');
    } finally {
      setLoading((prev) => ({ ...prev, myRoles: false }));
    }
  };

  const loadDiscoverRoles = async (page = 1) => {
    try {
      setLoading((prev) => ({ ...prev, discover: true }));
      // TODO: 实现获取角色列表接口
      // const response = await getRoleList({
      //   page,
      //   pageSize: pagination.discover.pageSize,
      //   category: selectedCategory || undefined,
      // });

      // 临时模拟数据
      const mockDiscoverRoles: API.Character[] = [
        {
          id: 3,
          name: '智能客服',
          avatar: '',
          description: '专业的客服AI，能够解答各种问题',
          background: '具有丰富客服经验的AI角色',
          open_line: '您好，有什么可以帮助您的吗？',
          tags: ['客服', '专业', '耐心'],
          is_public: true,
          user_id: 2,
          created_at: Date.now() - 259200000,
          updated_at: Date.now(),
        },
        {
          id: 4,
          name: '创意写手',
          avatar: '',
          description: '擅长创意写作的AI角色',
          background: '专注于创意写作和文案创作',
          open_line: '让我们一起创作精彩的内容吧！',
          tags: ['创意', '写作', '文案'],
          is_public: true,
          user_id: 3,
          created_at: Date.now() - 345600000,
          updated_at: Date.now(),
        },
        {
          id: 5,
          name: '心理咨询师',
          avatar: '',
          description: '温暖的心理咨询AI',
          background: '专业的心理咨询和情感支持',
          open_line: '我在这里倾听您的心声',
          tags: ['心理', '咨询', '温暖'],
          is_public: true,
          user_id: 4,
          created_at: Date.now() - 432000000,
          updated_at: Date.now(),
        },
      ];

      // 根据分类筛选
      const filteredRoles = selectedCategory
        ? mockDiscoverRoles.filter(
            (role) =>
              role.tags?.some((tag) => tag.includes(selectedCategory)) ||
              role.description.includes(selectedCategory),
          )
        : mockDiscoverRoles;

      if (page === 1) {
        setDiscoverRoles(filteredRoles);
      } else {
        setDiscoverRoles((prev) => [...prev, ...filteredRoles]);
      }

      setPagination((prev) => ({
        ...prev,
        discover: {
          ...prev.discover,
          page,
          total: filteredRoles.length,
          hasMore: false,
        },
      }));
    } catch (error: any) {
      console.error('加载发现角色失败:', error);
      message.error('加载角色列表失败');
    } finally {
      setLoading((prev) => ({ ...prev, discover: false }));
    }
  };

  const performSearch = async (keyword: string, page = 1) => {
    if (!keyword.trim()) {
      setIsSearchMode(false);
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, search: true }));
      setIsSearchMode(true);

      // TODO: 实现搜索角色接口
      // const response = await searchRoles({
      //   keyword: keyword.trim(),
      //   category: selectedCategory || undefined,
      //   page,
      //   pageSize: pagination.search.pageSize,
      // });

      // 临时模拟搜索结果
      const allRoles = [...myRoles, ...discoverRoles];
      const searchResults = allRoles.filter(
        (role) =>
          role.name.toLowerCase().includes(keyword.toLowerCase()) ||
          role.description.toLowerCase().includes(keyword.toLowerCase()) ||
          role.tags?.some((tag) => tag.toLowerCase().includes(keyword.toLowerCase())),
      );

      if (page === 1) {
        setSearchResults(searchResults);
      } else {
        setSearchResults((prev) => [...prev, ...searchResults]);
      }

      setPagination((prev) => ({
        ...prev,
        search: {
          ...prev.search,
          page,
          total: searchResults.length,
          hasMore: false,
        },
      }));
    } catch (error: any) {
      console.error('搜索角色失败:', error);
      message.error('搜索失败，请重试');
    } finally {
      setLoading((prev) => ({ ...prev, search: false }));
    }
  };

  // 搜索处理
  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    performSearch(value);
  };

  const handleClearSearch = () => {
    setSearchKeyword('');
    setIsSearchMode(false);
    setSearchResults([]);
  };

  // 筛选处理
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (isSearchMode && searchKeyword) {
      performSearch(searchKeyword);
    } else {
      loadDiscoverRoles();
    }
  };

  // 初始化数据加载
  useEffect(() => {
    loadMyRoles();
    loadDiscoverRoles();
  }, []);

  // 分页加载更多
  const handleLoadMore = (type: 'myRoles' | 'discover' | 'search') => {
    const currentPagination = pagination[type];
    if (!currentPagination.hasMore) return;

    const nextPage = currentPagination.page + 1;

    switch (type) {
      case 'myRoles':
        loadMyRoles(nextPage);
        break;
      case 'discover':
        loadDiscoverRoles(nextPage);
        break;
      case 'search':
        performSearch(searchKeyword, nextPage);
        break;
    }
  };

  // 渲染我的角色横向卡片
  const renderMyRolesSection = () => {
    const isLoading = loading.myRoles;
    const roles = myRoles;

    if (isLoading && roles.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      );
    }

    if (roles.length === 0) {
      return (
        <Card>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="您还没有创建任何角色">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateRole}>
              创建第一个角色
            </Button>
          </Empty>
        </Card>
      );
    }

    return (
      <>
        {/* 横向滚动的角色卡片 */}
        <div
          className="my-roles-scroll"
          style={{
            overflowX: 'auto',
            paddingBottom: 16,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 16,
              minWidth: 'max-content',
              paddingRight: 16,
            }}
          >
            {roles.map((role) => (
              <Card
                key={role.id}
                hoverable
                className="my-role-card"
                style={{
                  width: 320,
                  flexShrink: 0,
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
                styles={{ body: { padding: 16 } }}
                onClick={() => handleViewRoleDetail(role)}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <Avatar
                    size={60}
                    src={role.avatar}
                    icon={<UserOutlined />}
                    style={{ flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '16px',
                        marginBottom: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {role.name}
                    </div>
                    <div
                      style={{
                        color: '#666',
                        fontSize: '13px',
                        marginBottom: 8,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {role.description}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Space size={4}>
                        {role.tags?.slice(0, 2).map((tag, index) => (
                          <Tag key={index} color="blue" style={{ fontSize: '12px' }}>
                            {tag}
                          </Tag>
                        ))}
                        {role.tags && role.tags.length > 2 && (
                          <Tag color="default" style={{ fontSize: '12px' }}>
                            +{role.tags.length - 2}
                          </Tag>
                        )}
                      </Space>
                      <Space size={8}>
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditRole(role);
                          }}
                        />
                        <Button
                          type="primary"
                          size="small"
                          icon={<MessageOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChatWithRole(role);
                          }}
                        >
                          聊天
                        </Button>
                      </Space>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* 查看更多按钮 */}
        {pagination.myRoles.hasMore && (
          <div style={{ textAlign: 'center' }}>
            <Button loading={loading.myRoles} onClick={() => handleLoadMore('myRoles')}>
              查看更多我的角色
            </Button>
          </div>
        )}
      </>
    );
  };

  // 渲染角色网格
  const renderRoleGrid = (roles: API.Character[], type: 'myRoles' | 'discover' | 'search') => {
    const isLoading =
      loading[type === 'search' ? 'search' : type === 'myRoles' ? 'myRoles' : 'discover'];
    const currentPagination = pagination[type];

    if (isLoading && roles.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      );
    }

    if (roles.length === 0) {
      const emptyConfig = {
        myRoles: {
          description: '您还没有创建任何角色',
          buttonText: '创建第一个角色',
          action: handleCreateRole,
        },
        discover: {
          description: '暂无角色数据',
          buttonText: '刷新页面',
          action: () => loadDiscoverRoles(),
        },
        search: {
          description: `没有找到与"${searchKeyword}"相关的角色`,
          buttonText: '清除搜索',
          action: handleClearSearch,
        },
      };

      const config = emptyConfig[type];
      return (
        <Card>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={config.description}>
            <Button
              type="primary"
              icon={type === 'myRoles' ? <PlusOutlined /> : undefined}
              onClick={config.action}
            >
              {config.buttonText}
            </Button>
          </Empty>
        </Card>
      );
    }

    return (
      <>
        <Row gutter={[16, 16]}>
          {roles.map((role) => (
            <Col xs={24} sm={12} md={8} lg={6} key={role.id}>
              <Card
                hoverable
                style={{ height: '100%' }}
                styles={{ body: { padding: 16 } }}
                onClick={() => handleViewRoleDetail(role)}
              >
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                  <Avatar size={64} src={role.avatar} icon={<UserOutlined />} />
                </div>
                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: 4 }}>
                    {role.name}
                  </div>
                  <div
                    style={{
                      color: '#666',
                      fontSize: '13px',
                      marginBottom: 12,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {role.description}
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <Space size={4} wrap>
                    {role.tags?.slice(0, 3).map((tag, index) => (
                      <Tag key={index} color="blue" style={{ fontSize: '12px' }}>
                        {tag}
                      </Tag>
                    ))}
                  </Space>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  {type === 'myRoles' && (
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditRole(role);
                      }}
                    >
                      编辑
                    </Button>
                  )}
                  <Button
                    type="primary"
                    size="small"
                    icon={<MessageOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChatWithRole(role);
                    }}
                  >
                    聊天
                  </Button>
                </div>
                {type !== 'myRoles' && (
                  <div
                    style={{
                      marginTop: 8,
                      textAlign: 'center',
                      fontSize: '12px',
                      color: '#999',
                    }}
                  >
                    创建者: 用户{role.user_id}
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>

        {/* 加载更多按钮 */}
        {currentPagination.hasMore && (
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Button size="large" loading={isLoading} onClick={() => handleLoadMore(type)}>
              加载更多 ({currentPagination.total - roles.length} 个剩余)
            </Button>
          </div>
        )}
      </>
    );
  };

  return (
    <PageContainer title={false} style={{ padding: '24px' }} className="role-home-page">
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* 搜索区域 */}
        <Card style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Search
              placeholder="搜索角色名称、描述或标签..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onSearch={handleSearch}
              onClear={handleClearSearch}
              style={{ flex: 1 }}
            />
            {isSearchMode && <Button onClick={handleClearSearch}>清除搜索</Button>}
          </div>
        </Card>

        {/* 内容区域 */}
        {isSearchMode ? (
          /* 搜索结果 */
          <div>
            <Title level={3} style={{ marginBottom: 24 }}>
              <SearchOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              搜索结果 ({pagination.search.total} 个)
            </Title>
            {renderRoleGrid(searchResults, 'search')}
          </div>
        ) : (
          /* 分段式布局 */
          <>
            {/* 我的角色段落 */}
            <div style={{ marginBottom: 48 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 24,
                }}
              >
                <Title level={2} style={{ margin: 0 }}>
                  <UserOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  我的角色 ({pagination.myRoles.total})
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
              {renderMyRolesSection()}
            </div>

            {/* 全部角色段落 */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 24,
                }}
              >
                <Title level={2} style={{ margin: 0 }}>
                  <RobotOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                  发现角色 ({pagination.discover.total})
                </Title>
                {/* 标签筛选器 */}
                <Space wrap className="category-filters">
                  {roleCategories.slice(1).map((category) => (
                    <Tag.CheckableTag
                      key={category.value}
                      checked={selectedCategory === category.value}
                      onChange={(checked) => handleCategoryChange(checked ? category.value : '')}
                    >
                      {category.label}
                    </Tag.CheckableTag>
                  ))}
                </Space>
              </div>
              {renderRoleGrid(discoverRoles, 'discover')}
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
};

export default RoleHome;
