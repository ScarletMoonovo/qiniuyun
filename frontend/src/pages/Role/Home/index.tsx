import { PageContainer } from '@ant-design/pro-components';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Typography, 
  Space, 
  Empty, 
  Spin, 
  Input, 
  Select, 
  Tabs, 
  message,
  Modal
} from 'antd';
import { 
  PlusOutlined, 
  UserOutlined, 
  RobotOutlined, 
  SearchOutlined,
  FilterOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { history } from 'umi';
import { useEffect, useState } from 'react';
import { RoleCard } from '@/components/Role';
import { getMyRoles, getRoleList, searchRoles, deleteRole } from '@/services/backend/role';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

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

// 排序选项
const sortOptions = [
  { label: '最新创建', value: 'created_desc' },
  { label: '最受欢迎', value: 'popularity_desc' },
  { label: '名称排序', value: 'name_asc' },
];

const RoleHome: React.FC = () => {
  // 状态管理
  const [activeTab, setActiveTab] = useState('discover');
  const [myRoles, setMyRoles] = useState<API.Role[]>([]);
  const [discoverRoles, setDiscoverRoles] = useState<API.Role[]>([]);
  const [searchResults, setSearchResults] = useState<API.Role[]>([]);
  const [loading, setLoading] = useState({ 
    myRoles: false, 
    discover: false, 
    search: false 
  });
  
  // 搜索和筛选状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSort, setSelectedSort] = useState('created_desc');
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

  const handleEditRole = (role: API.Role) => {
    history.push(`/role/edit/${role.id}`);
  };

  const handleChatWithRole = (role: API.Role) => {
    history.push(`/role/chat/${role.id}`);
  };

  const handleViewRoleDetail = (role: API.Role) => {
    history.push(`/role/detail/${role.id}`);
  };

  const handleDeleteRole = (role: API.Role) => {
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
      setLoading(prev => ({ ...prev, myRoles: true }));
      const response = await getMyRoles({
        page,
        pageSize: pagination.myRoles.pageSize,
      });
      
      if (response) {
        if (page === 1) {
          setMyRoles(response.roles || []);
        } else {
          setMyRoles(prev => [...prev, ...(response.roles || [])]);
        }
        
        setPagination(prev => ({
          ...prev,
          myRoles: {
            ...prev.myRoles,
            page,
            total: response.total || 0,
            hasMore: response.hasMore || false,
          }
        }));
      }
    } catch (error: any) {
      console.error('加载我的角色失败:', error);
      message.error('加载我的角色失败');
    } finally {
      setLoading(prev => ({ ...prev, myRoles: false }));
    }
  };

  const loadDiscoverRoles = async (page = 1) => {
    try {
      setLoading(prev => ({ ...prev, discover: true }));
      const response = await getRoleList({
        page,
        pageSize: pagination.discover.pageSize,
        category: selectedCategory || undefined,
      });
      
      if (response) {
        if (page === 1) {
          setDiscoverRoles(response.roles || []);
        } else {
          setDiscoverRoles(prev => [...prev, ...(response.roles || [])]);
        }
        
        setPagination(prev => ({
          ...prev,
          discover: {
            ...prev.discover,
            page,
            total: response.total || 0,
            hasMore: response.hasMore || false,
          }
        }));
      }
    } catch (error: any) {
      console.error('加载发现角色失败:', error);
      message.error('加载角色列表失败');
    } finally {
      setLoading(prev => ({ ...prev, discover: false }));
    }
  };

  const performSearch = async (keyword: string, page = 1) => {
    if (!keyword.trim()) {
      setIsSearchMode(false);
      return;
    }

    try {
      setLoading(prev => ({ ...prev, search: true }));
      setIsSearchMode(true);
      
      const response = await searchRoles({
        keyword: keyword.trim(),
        category: selectedCategory || undefined,
        page,
        pageSize: pagination.search.pageSize,
      });
      
      if (response) {
        if (page === 1) {
          setSearchResults(response.roles || []);
        } else {
          setSearchResults(prev => [...prev, ...(response.roles || [])]);
        }
        
        setPagination(prev => ({
          ...prev,
          search: {
            ...prev.search,
            page,
            total: response.total || 0,
            hasMore: response.hasMore || false,
          }
        }));
      }
    } catch (error: any) {
      console.error('搜索角色失败:', error);
      message.error('搜索失败，请重试');
    } finally {
      setLoading(prev => ({ ...prev, search: false }));
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

  // 渲染角色网格
  const renderRoleGrid = (roles: API.Role[], type: 'myRoles' | 'discover' | 'search') => {
    const isLoading = loading[type === 'search' ? 'search' : type === 'myRoles' ? 'myRoles' : 'discover'];
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
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={config.description}
          >
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
              <RoleCard 
                role={role} 
                showCreator={type !== 'myRoles'}
                showOwnerActions={type === 'myRoles'}
                onEdit={type === 'myRoles' ? handleEditRole : undefined}
                onChat={handleChatWithRole}
                onView={handleViewRoleDetail}
                onDelete={type === 'myRoles' ? handleDeleteRole : undefined}
              />
            </Col>
          ))}
        </Row>
        
        {/* 加载更多按钮 */}
        {currentPagination.hasMore && (
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Button 
              size="large"
              loading={isLoading}
              onClick={() => handleLoadMore(type)}
            >
              加载更多 ({currentPagination.total - roles.length} 个剩余)
            </Button>
          </div>
        )}
      </>
    );
  };

  return (
    <PageContainer
      title={false}
      style={{ padding: '24px' }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* 搜索和筛选区域 */}
        <Card style={{ marginBottom: 24 }}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {/* 搜索框 */}
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
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleCreateRole}
                size="large"
              >
                创建角色
              </Button>
            </div>
            
            {/* 筛选器 */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <FilterOutlined style={{ color: '#666' }} />
              <Select
                value={selectedCategory}
                onChange={handleCategoryChange}
                style={{ width: 120 }}
                placeholder="分类"
              >
                {roleCategories.map(category => (
                  <Option key={category.value} value={category.value}>
                    {category.label}
                  </Option>
                ))}
              </Select>
              <Select
                value={selectedSort}
                onChange={setSelectedSort}
                style={{ width: 120 }}
                placeholder="排序"
              >
                {sortOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
              
              {isSearchMode && (
                <Button onClick={handleClearSearch}>
                  清除搜索
                </Button>
              )}
            </div>
          </Space>
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
          /* 标签页内容 */
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            size="large"
            items={[
              {
                key: 'discover',
                label: (
                  <span>
                    <RobotOutlined />
                    发现角色 ({pagination.discover.total})
                  </span>
                ),
                children: renderRoleGrid(discoverRoles, 'discover'),
              },
              {
                key: 'myRoles',
                label: (
                  <span>
                    <UserOutlined />
                    我的角色 ({pagination.myRoles.total})
                  </span>
                ),
                children: renderRoleGrid(myRoles, 'myRoles'),
              },
            ]}
          />
        )}
      </div>
    </PageContainer>
  );
};

export default RoleHome;
