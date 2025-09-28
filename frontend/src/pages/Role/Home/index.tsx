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
import { useCallback, useEffect, useRef, useState } from 'react';
import { history, useModel } from 'umi';
// import { RoleCard } from '@/components/Role';
// import { deleteRole, getMyRoles, searchRoles } from '@/services/backend/character';
import { getCharacter } from '@/services/backend/character';
import { getTags } from '@/services/backend/api';
import './index.less';

const { Title } = Typography;


const RoleHome: React.FC = () => {
  // 获取当前用户信息
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;

  // 状态管理
  const [myRoles, setMyRoles] = useState<API.Character[]>([]);
  const [discoverRoles, setDiscoverRoles] = useState<API.Character[]>([]);
  const [searchResults, setSearchResults] = useState<API.Character[]>([]);
  const [tags, setTags] = useState<API.Tag[]>([]);
  const [loading, setLoading] = useState({
    myRoles: false,
    discover: false,
    search: false,
    tags: false,
  });

  // 搜索和筛选状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  
  // 标签展开/收缩状态
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);
  const [showExpandButton, setShowExpandButton] = useState(false);
  const [visibleTagCount, setVisibleTagCount] = useState(0);
  
  // 容器引用
  const tagContainerRef = useRef<HTMLDivElement>(null);
  const myRolesScrollRef = useRef<HTMLDivElement>(null);
  
  // 滚动状态
  const [scrollState, setScrollState] = useState({
    canScrollLeft: false,
    canScrollRight: false,
  });

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
  const loadTags = async () => {
    try {
      setLoading((prev) => ({ ...prev, tags: true }));
      
      let tagsData: API.Tag[] = [];
      
      try {
        const response = await getTags();
        tagsData = response;
      } catch (apiError) {
        console.warn('Tags API调用失败，使用模拟数据:', apiError);
        
        // 模拟标签数据 - 包含不同长度的标签名称
        tagsData = [
          { id: 1, name: '客服' },
          { id: 2, name: '创意写作' },
          { id: 3, name: '心理咨询' },
          { id: 4, name: '教育培训' },
          { id: 5, name: '编程开发' },
          { id: 6, name: '生活助手' },
          { id: 7, name: '健身' },
          { id: 8, name: '美食料理专家' },
          { id: 9, name: '专业顾问' },
          { id: 10, name: '学习辅导' },
          { id: 11, name: '技术支持' },
          { id: 12, name: '健康管理' },
          { id: 13, name: '商务' },
          { id: 14, name: '人工智能助手' },
          { id: 15, name: '翻译' },
          { id: 16, name: '数据分析专家' },
          { id: 17, name: '设计' },
          { id: 18, name: '项目管理顾问' },
          { id: 19, name: '营销' },
          { id: 20, name: '法律咨询专家' },
        ];
      }
      
      setTags(tagsData);
    } catch (error: any) {
      console.error('加载标签失败:', error);
      message.error('加载标签失败');
    } finally {
      setLoading((prev) => ({ ...prev, tags: false }));
    }
  };

  const loadMyRoles = async (page = 1) => {
    try {
      setLoading((prev) => ({ ...prev, myRoles: true }));
      // 检查用户是否已登录
      if (!currentUser?.id) {
        console.warn('用户未登录，无法加载我的角色');
        setMyRoles([]);
        setPagination((prev) => ({
          ...prev,
          myRoles: {
            ...prev.myRoles,
            page: 1,
            total: 0,
            hasMore: false,
          },
        }));
        return;
      }

      // 使用真实API获取用户创建的角色
      const response = await getCharacter({
        user_id: currentUser.id,
        page_size: pagination.myRoles.pageSize,
      });

      const userRoles = response.characters || [];


      if (page === 1) {
        setMyRoles(userRoles);
      } else {
        setMyRoles((prev) => [...prev, ...userRoles]);
      }

      setPagination((prev) => ({
        ...prev,
        myRoles: {
          ...prev.myRoles,
          page,
          total: userRoles.length,
          hasMore: userRoles.length === pagination.myRoles.pageSize, // 如果返回的数量等于页面大小，可能还有更多数据
        },
      }));
    } catch (error: any) {
      console.error('加载我的角色失败:', error);
      message.error('加载我的角色失败');
      // 出错时设置空数组
      if (page === 1) {
        setMyRoles([]);
      }
    } finally {
      setLoading((prev) => ({ ...prev, myRoles: false }));
    }
  };

  const loadDiscoverRoles = useCallback(async (page = 1) => {
    try {
      setLoading((prev) => ({ ...prev, discover: true }));
      
      let roles: API.Character[] = [];
      
      try {
        // 尝试调用真实的获取角色接口
        const response = await getCharacter({
          page_size: pagination.discover.pageSize,
          tag: selectedTag ? parseInt(selectedTag) : undefined,
        });
        roles = response.characters || [];
      } catch (apiError) {
        console.warn('API调用失败，使用模拟数据:', apiError);
        
        // 模拟数据
        const mockRoles: API.Character[] = [
          {
            id: 1,
            name: '智能客服助手',
            avatar: '',
            description: '专业的客服AI，能够解答各种问题，提供优质服务',
            background: '具有丰富客服经验的AI角色，擅长沟通和问题解决',
            open_line: '您好，有什么可以帮助您的吗？',
            tags: ['客服', '专业', '耐心', '沟通'],
            is_public: true,
            user_id: 2,
            user_name: '张三',
            created_at: Date.now() - 259200000,
            updated_at: Date.now(),
          },
          {
            id: 2,
            name: '创意写作伙伴',
            avatar: '',
            description: '擅长创意写作的AI角色，帮助您创作精彩内容',
            background: '专注于创意写作和文案创作，具有丰富的文学知识',
            open_line: '让我们一起创作精彩的内容吧！',
            tags: ['创意', '写作', '文案', '灵感'],
            is_public: true,
            user_id: 3,
            user_name: '李四',
            created_at: Date.now() - 345600000,
            updated_at: Date.now(),
          },
          {
            id: 3,
            name: '心理咨询师',
            avatar: '',
            description: '温暖的心理咨询AI，提供情感支持和心理疏导',
            background: '专业的心理咨询和情感支持，善于倾听和理解',
            open_line: '我在这里倾听您的心声，为您提供支持',
            tags: ['心理', '咨询', '温暖', '倾听'],
            is_public: true,
            user_id: 4,
            user_name: '王五',
            created_at: Date.now() - 432000000,
            updated_at: Date.now(),
          },
          {
            id: 4,
            name: '学习导师',
            avatar: '',
            description: '专业的学习指导AI，帮助您提高学习效率',
            background: '拥有丰富的教学经验，擅长因材施教',
            open_line: '让我们一起探索知识的海洋吧！',
            tags: ['教育', '学习', '指导', '知识'],
            is_public: true,
            user_id: 5,
            user_name: '赵六',
            created_at: Date.now() - 518400000,
            updated_at: Date.now(),
          },
          {
            id: 5,
            name: '编程助手',
            avatar: '',
            description: '专业的编程AI助手，帮助解决编程问题',
            background: '精通多种编程语言，能够提供代码建议和调试帮助',
            open_line: '有什么编程问题需要帮助吗？',
            tags: ['编程', '技术', '代码', '调试'],
            is_public: true,
            user_id: 6,
            user_name: '孙七',
            created_at: Date.now() - 604800000,
            updated_at: Date.now(),
          },
          {
            id: 6,
            name: '生活顾问',
            avatar: '',
            description: '贴心的生活助手，提供日常生活建议',
            background: '关注生活品质，提供实用的生活小贴士',
            open_line: '让我为您的生活提供一些建议吧！',
            tags: ['生活', '建议', '实用', '贴心'],
            is_public: true,
            user_id: 7,
            user_name: '周八',
            created_at: Date.now() - 691200000,
            updated_at: Date.now(),
          },
          {
            id: 7,
            name: '健身教练',
            avatar: '',
            description: '专业的健身指导AI，制定个性化运动计划',
            background: '具有专业的运动知识，能够提供科学的健身指导',
            open_line: '准备好开始您的健身之旅了吗？',
            tags: ['健身', '运动', '健康', '指导'],
            is_public: true,
            user_id: 8,
            user_name: '吴九',
            created_at: Date.now() - 777600000,
            updated_at: Date.now(),
          },
          {
            id: 8,
            name: '美食达人',
            avatar: '',
            description: '热爱美食的AI，分享烹饪技巧和美食文化',
            background: '精通各国料理，能够提供专业的烹饪建议',
            open_line: '让我们一起探索美食的世界吧！',
            tags: ['美食', '烹饪', '文化', '分享'],
            is_public: true,
            user_id: 9,
            user_name: '郑十',
            created_at: Date.now() - 864000000,
            updated_at: Date.now(),
          }
        ];

        // 根据选择的标签筛选模拟数据
        if (selectedTag) {
          const selectedTagData = tags.find(tag => tag.id.toString() === selectedTag);
          if (selectedTagData) {
            roles = mockRoles.filter((role) => 
              role.tags?.some((tag) => tag.includes(selectedTagData.name)) ||
              role.description.includes(selectedTagData.name)
            );
          } else {
            roles = mockRoles;
          }
        } else {
          roles = mockRoles;
        }

        // 模拟分页
        const startIndex = (page - 1) * pagination.discover.pageSize;
        const endIndex = startIndex + pagination.discover.pageSize;
        roles = roles.slice(startIndex, endIndex);
      }

      if (page === 1) {
        setDiscoverRoles(roles);
      } else {
        setDiscoverRoles((prev) => [...prev, ...roles]);
      }

      setPagination((prev) => ({
        ...prev,
        discover: {
          ...prev.discover,
          page,
          total: roles.length,
          hasMore: roles.length === pagination.discover.pageSize, // 如果返回的数量等于请求的页面大小，说明可能还有更多
        },
      }));
    } catch (error: any) {
      console.error('加载发现角色失败:', error);
      message.error('加载角色列表失败');
    } finally {
      setLoading((prev) => ({ ...prev, discover: false }));
    }
  }, [selectedTag, pagination.discover.pageSize, tags]);

  const performSearch = async (keyword: string, page = 1) => {
    if (!keyword.trim()) {
      setIsSearchMode(false);
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, search: true }));
      setIsSearchMode(true);

      // 基于当前已加载的角色进行搜索
      const allRoles = [...myRoles, ...discoverRoles];
      let searchResults = allRoles.filter(
        (role) =>
          role.name.toLowerCase().includes(keyword.toLowerCase()) ||
          role.description.toLowerCase().includes(keyword.toLowerCase()) ||
          role.tags?.some((tag) => tag.toLowerCase().includes(keyword.toLowerCase())),
      );

      // 如果选择了标签，进一步筛选
      if (selectedTag) {
        const selectedTagData = tags.find(tag => tag.id.toString() === selectedTag);
        if (selectedTagData) {
          searchResults = searchResults.filter((role) => 
            role.tags?.some((tag) => tag.includes(selectedTagData.name)) ||
            role.description.includes(selectedTagData.name)
          );
        }
      }

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
  const handleTagChange = (tag: string) => {
    setSelectedTag(tag);
    if (isSearchMode && searchKeyword) {
      performSearch(searchKeyword);
    } else {
      loadDiscoverRoles();
    }
  };

  // 渲染标签筛选器
  const renderTagFilters = () => {
    const allTags = [
      { id: 'all', name: 'All' },
      ...tags
    ];

    // 根据展开状态决定显示的标签
    const displayTags = isTagsExpanded 
      ? allTags 
      : allTags.slice(0, showExpandButton ? visibleTagCount : allTags.length);

    const renderTag = (tag: any, isSpecialButton = false) => (
      <div
        key={tag.id}
        style={{
          display: 'inline-block',
          borderRadius: '20px',
          padding: '4px 12px',
          fontSize: '12px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          border: (selectedTag === '' && tag.id === 'all') || selectedTag === tag.id.toString()
            ? '1px solid #1890ff' 
            : '1px solid #e8e8e8',
          background: (selectedTag === '' && tag.id === 'all') || selectedTag === tag.id.toString()
            ? 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)'
            : isSpecialButton 
              ? 'linear-gradient(135deg, #f0f0f0 0%, #e8e8e8 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
          color: (selectedTag === '' && tag.id === 'all') || selectedTag === tag.id.toString() 
            ? '#fff' 
            : isSpecialButton ? '#666' : '#666',
          boxShadow: (selectedTag === '' && tag.id === 'all') || selectedTag === tag.id.toString()
            ? '0 2px 8px rgba(24, 144, 255, 0.25)'
            : '0 1px 2px rgba(0, 0, 0, 0.04)',
        }}
        onClick={() => {
          if (isSpecialButton) {
            if (tag.id === 'expand') {
              setIsTagsExpanded(true);
            } else if (tag.id === 'collapse') {
              setIsTagsExpanded(false);
            }
          } else {
            handleTagChange(tag.id === 'all' ? '' : tag.id.toString());
          }
        }}
        onMouseEnter={(e) => {
          if (!isSpecialButton && (selectedTag === '' && tag.id === 'all') || selectedTag !== tag.id.toString()) {
            e.currentTarget.style.borderColor = '#40a9ff';
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(64, 169, 255, 0.15)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSpecialButton && (selectedTag === '' && tag.id === 'all') || selectedTag !== tag.id.toString()) {
            e.currentTarget.style.borderColor = '#e8e8e8';
            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.04)';
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        {tag.name}
      </div>
    );

    return (
      <div style={{ marginBottom: 24 }}>
        <div 
          ref={tagContainerRef}
          className="tag-filters" 
          style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '8px',
            alignItems: 'center'
          }}
        >
          {loading.tags ? (
            <Spin size="small" />
          ) : allTags.length > 1 ? (
            <>
              {displayTags.map((tag) => renderTag(tag))}
              
              {/* 展开按钮 */}
              {showExpandButton && !isTagsExpanded && (
                renderTag({ id: 'expand', name: 'All Tags' }, true)
              )}
              
              {/* 收缩按钮 */}
              {isTagsExpanded && showExpandButton && (
                renderTag({ id: 'collapse', name: '收缩' }, true)
              )}
            </>
          ) : (
            <span style={{ color: '#999', fontSize: '13px' }}>暂无分类标签</span>
          )}
        </div>
      </div>
    );
  };

  // 初始化数据加载
  useEffect(() => {
    loadTags();
    loadMyRoles();
  }, []);

  // 当标签加载完成后，加载发现角色
  useEffect(() => {
    if (!loading.tags) {
      loadDiscoverRoles();
    }
  }, [selectedTag, loading.tags, loadDiscoverRoles]);

  // 检测滚动状态的函数
  const checkScrollState = useCallback(() => {
    const container = myRolesScrollRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    
    setScrollState({
      canScrollLeft: scrollLeft > 0,
      canScrollRight: scrollLeft < scrollWidth - clientWidth - 1, // -1 为了处理浮点数精度问题
    });
  }, []);

  // 计算标签实际宽度的函数
  const calculateTagWidth = useCallback((tagName: string): number => {
    // 创建一个临时的span元素来测量文本宽度
    const tempSpan = document.createElement('span');
    tempSpan.style.visibility = 'hidden';
    tempSpan.style.position = 'absolute';
    tempSpan.style.fontSize = '12px';
    tempSpan.style.fontWeight = '500';
    tempSpan.style.padding = '4px 12px';
    tempSpan.style.whiteSpace = 'nowrap';
    tempSpan.textContent = tagName;
    document.body.appendChild(tempSpan);
    
    const width = tempSpan.offsetWidth + 8; // 加上margin
    document.body.removeChild(tempSpan);
    return width;
  }, []);

  // 计算可见标签数量的函数
  const calculateVisibleTags = useCallback(() => {
    if (tags.length === 0 || !tagContainerRef.current) return;
    
    const containerWidth = tagContainerRef.current.offsetWidth;
    if (containerWidth === 0) return; // 容器还未渲染完成
    
    const allTags = [{ id: 'all', name: 'All' }, ...tags];
    
    let currentWidth = 0;
    let visibleCount = 0;
    const expandButtonWidth = calculateTagWidth('All Tags') + 16; // 预留展开按钮宽度
    
    for (const tag of allTags) {
      const tagWidth = calculateTagWidth(tag.name);
      
      // 如果加上当前标签会超出容器宽度，且还有剩余标签，则需要为展开按钮预留空间
      if (currentWidth + tagWidth + (visibleCount < allTags.length - 1 ? expandButtonWidth : 0) > containerWidth) {
        break;
      }
      
      currentWidth += tagWidth;
      visibleCount++;
    }
    
    // 如果不能显示所有标签，则显示展开按钮
    const shouldShowExpandButton = visibleCount < allTags.length;
    setShowExpandButton(shouldShowExpandButton);
    setVisibleTagCount(shouldShowExpandButton ? visibleCount - 1 : allTags.length); // 为展开按钮预留位置
  }, [tags, calculateTagWidth]);

  // 检测标签是否超过一行 - 基于实际宽度计算
  useEffect(() => {
    if (tags.length > 0) {
      // 延迟执行以确保DOM完全渲染
      const timer = setTimeout(() => {
        calculateVisibleTags();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [tags, calculateVisibleTags]);

  // 监听窗口大小变化，重新计算
  useEffect(() => {
    const handleResize = () => {
      if (tags.length > 0) {
        // 延迟执行以确保DOM更新完成
        setTimeout(() => {
          calculateVisibleTags();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [tags, calculateVisibleTags]);

  // 监听我的角色滚动事件
  useEffect(() => {
    const container = myRolesScrollRef.current;
    if (!container) return;

    // 初始检测
    checkScrollState();

    // 添加滚动事件监听
    container.addEventListener('scroll', checkScrollState);
    
    // 监听内容变化（角色数据更新时重新检测）
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(checkScrollState, 100);
    });
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', checkScrollState);
      resizeObserver.disconnect();
    };
  }, [checkScrollState, myRoles]);

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
        <div className="my-roles-scroll-container" style={{ position: 'relative' }}>
          {/* 左侧渐变遮罩 - 固定在容器外部 */}
          {scrollState.canScrollLeft && (
            <div className="scroll-gradient-left" />
          )}
          
          {/* 右侧渐变遮罩 - 固定在容器外部 */}
          {scrollState.canScrollRight && (
            <div className="scroll-gradient-right" />
          )}
          
          <div
            ref={myRolesScrollRef}
            className="my-roles-scroll"
            style={{
              overflowX: 'auto',
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
                  width: 240,
                  flexShrink: 0,
                  borderRadius: 20,
                  overflow: 'hidden',
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
                  transition: 'all 0.2s ease',
                }}
                styles={{ body: { padding: 12 } }}
                onClick={() => handleViewRoleDetail(role)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.borderColor = '#d9d9d9';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.06)';
                  e.currentTarget.style.borderColor = '#f0f0f0';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Avatar
                    size={48}
                    src={role.avatar}
                    icon={<UserOutlined />}
                    style={{ 
                      flexShrink: 0,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: '2px solid #fff',
                      boxShadow: '0 2px 6px rgba(102, 126, 234, 0.2)',
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '14px',
                        marginBottom: 3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: '#262626',
                      }}
                    >
                      {role.name}
                    </div>
                    <div
                      style={{
                        color: '#8c8c8c',
                        fontSize: '12px',
                        lineHeight: '16px',
                        marginBottom: 6,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        height: '32px',
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
                      <Space size={3} wrap>
                        {role.tags?.slice(0, 2).map((tag, index) => (
                          <span
                            key={index}
                            style={{
                              display: 'inline-block',
                              padding: '1px 6px',
                              fontSize: '10px',
                              borderRadius: '8px',
                              background: 'rgba(24, 144, 255, 0.08)',
                              color: '#1890ff',
                              fontWeight: 500,
                              border: '1px solid rgba(24, 144, 255, 0.15)',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                        {role.tags && role.tags.length > 2 && (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '1px 6px',
                              fontSize: '10px',
                              borderRadius: '8px',
                              background: 'rgba(140, 140, 140, 0.08)',
                              color: '#8c8c8c',
                              fontWeight: 500,
                              border: '1px solid rgba(140, 140, 140, 0.15)',
                            }}
                          >
                            +{role.tags.length - 2}
                          </span>
                        )}
                      </Space>
                      <Space size={4}>
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          style={{
                            padding: '2px 4px',
                            height: '22px',
                            fontSize: '12px',
                            color: '#8c8c8c',
                            borderRadius: '4px',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditRole(role);
                          }}
                        />
                        <Button
                          type="primary"
                          size="small"
                          icon={<MessageOutlined />}
                          style={{
                            padding: '2px 8px',
                            height: '22px',
                            fontSize: '11px',
                            borderRadius: '4px',
                            background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                            border: 'none',
                            boxShadow: '0 1px 3px rgba(24, 144, 255, 0.3)',
                          }}
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '16px',
          }}
        >
          {roles.map((role) => (
            <div key={role.id}>
              <Card
                hoverable
                style={{ 
                  height: '100%',
                  borderRadius: 20,
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
                  transition: 'all 0.2s ease',
                }}
                styles={{ body: { padding: 12 } }}
                onClick={() => handleViewRoleDetail(role)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.borderColor = '#d9d9d9';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.06)';
                  e.currentTarget.style.borderColor = '#f0f0f0';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: 10 }}>
                  <Avatar 
                    size={40} 
                    src={role.avatar} 
                    icon={<UserOutlined />}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: '2px solid #fff',
                      boxShadow: '0 2px 6px rgba(102, 126, 234, 0.2)',
                    }}
                  />
                </div>
                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                  <div style={{ 
                    fontWeight: 600, 
                    fontSize: '13px', 
                    marginBottom: 2,
                    color: '#262626',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {role.name}
                  </div>
                  <div
                    style={{
                      color: '#8c8c8c',
                      fontSize: '11px',
                      lineHeight: '14px',
                      marginBottom: 6,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      height: '28px',
                    }}
                  >
                    {role.description}
                  </div>
                </div>
                <div style={{ marginBottom: 10, textAlign: 'center' }}>
                  <Space size={3} wrap>
                    {role.tags?.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        style={{
                          display: 'inline-block',
                          padding: '1px 4px',
                          fontSize: '9px',
                          borderRadius: '6px',
                          background: 'rgba(24, 144, 255, 0.08)',
                          color: '#1890ff',
                          fontWeight: 500,
                          border: '1px solid rgba(24, 144, 255, 0.15)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </Space>
                </div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                  {type === 'myRoles' && (
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      style={{
                        padding: '1px 6px',
                        height: '20px',
                        fontSize: '10px',
                        borderRadius: '3px',
                        border: '1px solid #d9d9d9',
                        color: '#666',
                      }}
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
                    style={{
                      padding: '1px 8px',
                      height: '20px',
                      fontSize: '10px',
                      borderRadius: '3px',
                      background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                      border: 'none',
                      boxShadow: '0 1px 3px rgba(24, 144, 255, 0.3)',
                    }}
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
                    {role.user_name}
                  </div>
                )}
              </Card>
            </div>
          ))}
        </div>

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
    <PageContainer title={false} style={{ padding: '16px 8px' }} className="role-home-page">
      <div style={{ maxWidth: '95%', margin: '0 auto', padding: '0 16px' }}>
        {/* 顶部区域 */}
        <div style={{ 
          marginBottom: 24, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: 16 
        }}>
          {/* 欢迎信息 */}
          <div style={{ 
            fontSize: '20px', 
            fontWeight: 500, 
            color: '#262626',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 4
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#1890ff' }}>👋</span>
              欢迎回来
            </div>
            <div style={{ color: '#1890ff', fontWeight: 600 }}>
              {currentUser?.name || '访客'}
            </div>
          </div>
          
          {/* 搜索区域 */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              {/* 自定义搜索框 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '400px',
                  height: '40px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '200px',
                  overflow: 'hidden',
                  background: '#fff',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#40a9ff';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(64, 169, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  if (!searchKeyword) {
                    e.currentTarget.style.borderColor = '#d9d9d9';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.02)';
                  }
                }}
                className={searchKeyword ? 'search-focused' : ''}
              >
                {/* 输入框 */}
                <input
                  placeholder="搜索角色名称、描述或标签..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchKeyword)}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: '14px',
                    padding: '0 20px',
                    background: 'transparent',
                    color: '#262626',
                  }}
                />
                
                {/* 清除按钮 */}
                {searchKeyword && (
                  <button
                    onClick={handleClearSearch}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#bfbfbf',
                      cursor: 'pointer',
                      padding: '0 8px',
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.06)';
                      e.currentTarget.style.color = '#666';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'none';
                      e.currentTarget.style.color = '#bfbfbf';
                    }}
                  >
                    ✕
                  </button>
                )}
                
                {/* 搜索按钮 */}
                <button
                  onClick={() => handleSearch(searchKeyword)}
                  style={{
                    background: 'rgba(24, 144, 255, 0.1)',
                    border: 'none',
                    color: '#1890ff',
                    borderRadius: '0 200px 200px 0',
                    height: '38px',
                    width: '50px',
                    marginRight: '1px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '16px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(24, 144, 255, 0.2)';
                    e.currentTarget.style.color = '#096dd9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(24, 144, 255, 0.1)';
                    e.currentTarget.style.color = '#1890ff';
                  }}
                >
                  <SearchOutlined />
                </button>
              </div>
            </div>
            {isSearchMode && (
              <Button onClick={handleClearSearch} style={{ flexShrink: 0 }}>
                清除搜索
              </Button>
            )}
          </div>
        </div>

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
                <Title level={2} style={{ margin: 0, fontSize: '16px' }}>
                  <UserOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  我的角色 ({pagination.myRoles.total})
                </Title>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreateRole}
                  size="large"
                  style={{
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                    border: 'none',
                    boxShadow: '0 2px 6px rgba(82, 196, 26, 0.25)',
                    fontWeight: 500,
                  }}
                >
                  创建新角色
                </Button>
              </div>
              {renderMyRolesSection()}
            </div>

            {/* 标签筛选器 */}
            {renderTagFilters()}
            
            {/* 角色网格 */}
            <div>
              {renderRoleGrid(discoverRoles, 'discover')}
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
};

export default RoleHome;
