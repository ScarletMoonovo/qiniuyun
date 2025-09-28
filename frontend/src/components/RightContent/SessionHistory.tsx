import React, { useState, useEffect } from 'react';
import { Button, Dropdown, List, Typography, Empty, Spin, message } from 'antd';
import { HistoryOutlined, MessageOutlined } from '@ant-design/icons';
import { history } from 'umi';
import { getSession } from '@/services/backend/chat';
import moment from 'moment';

const { Text } = Typography;

interface SessionHistoryProps {
  style?: React.CSSProperties;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({ style }) => {
  const [sessions, setSessions] = useState<API.Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // 获取历史会话数据
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await getSession({
        cursor: 0,
        pageSize: 20, // 显示最近20个会话
      });
      setSessions(response.sessions || []);
    } catch (error) {
      console.error('获取历史会话失败:', error);
      message.error('获取历史会话失败');
    } finally {
      setLoading(false);
    }
  };

  // 当下拉框打开时获取数据
  const handleVisibleChange = (visible: boolean) => {
    setDropdownVisible(visible);
    if (visible && sessions.length === 0) {
      fetchSessions();
    }
  };

  // 点击会话项跳转到聊天页面
  const handleSessionClick = (session: API.Session) => {
    history.push(`/role/chat/${session.character_id}?sessionId=${session.session_id}`);
    setDropdownVisible(false);
  };

  // 格式化时间显示
  const formatTime = (timestamp: number) => {
    const now = moment();
    const time = moment(timestamp * 1000);
    
    if (now.diff(time, 'days') === 0) {
      return time.format('HH:mm');
    } else if (now.diff(time, 'days') < 7) {
      return time.format('ddd HH:mm');
    } else {
      return time.format('MM-DD');
    }
  };

  // 下拉框内容
  const dropdownContent = (
    <div style={{ 
      width: 320, 
      maxHeight: 400, 
      overflowY: 'auto',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      padding: '8px 0'
    }}>
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: '1px solid #f0f0f0',
        fontWeight: 600,
        fontSize: '14px',
        color: '#262626'
      }}>
        历史会话
      </div>
      
      {loading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '120px' 
        }}>
          <Spin size="small" />
        </div>
      ) : sessions.length === 0 ? (
        <div style={{ padding: '40px 16px' }}>
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无历史会话"
            style={{ margin: 0 }}
          />
        </div>
      ) : (
        <List
          dataSource={sessions}
          renderItem={(session) => (
            <List.Item
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: 'none',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              onClick={() => handleSessionClick(session)}
            >
              <List.Item.Meta
                avatar={
                  <MessageOutlined 
                    style={{ 
                      fontSize: '16px', 
                      color: '#1890ff',
                      marginTop: '16px'
                    }} 
                  />
                }
                title={
                  <Text 
                    ellipsis={{ tooltip: session.title }}
                    style={{ 
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#262626',
                      lineHeight: '20px'
                    }}
                  >
                    {session.title || `会话 #${session.session_id}`}
                  </Text>
                }
                description={
                  <Text 
                    style={{ 
                      fontSize: '12px', 
                      color: '#8c8c8c',
                      lineHeight: '16px'
                    }}
                  >
                    {formatTime(session.updated_at)}
                  </Text>
                }
              />
            </List.Item>
          )}
        />
      )}
      
      {sessions.length > 0 && (
        <div style={{ 
          padding: '8px 16px', 
          borderTop: '1px solid #f0f0f0',
          textAlign: 'center'
        }}>
          <Button 
            type="link" 
            size="small"
            onClick={() => {
              // 可以跳转到完整的历史会话页面
              setDropdownVisible(false);
            }}
            style={{ 
              fontSize: '12px',
              color: '#8c8c8c',
              padding: 0
            }}
          >
            查看全部历史会话
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => dropdownContent}
      placement="bottomRight"
      trigger={['hover']}
      open={dropdownVisible}
      onOpenChange={handleVisibleChange}
    >
      <Button 
        type="text" 
        icon={<HistoryOutlined />}
        style={{ 
          color: '#595959',
          display: 'flex',
          alignItems: 'center',
          height: '32px',
          ...style
        }}
      >
        历史
      </Button>
    </Dropdown>
  );
};

export default SessionHistory;
