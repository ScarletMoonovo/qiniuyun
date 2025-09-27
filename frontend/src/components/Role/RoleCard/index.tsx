import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  HeartFilled,
  HeartOutlined,
  MessageOutlined,
  MoreOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Avatar, Button, Card, Dropdown, Space, Tag, Tooltip, Typography } from 'antd';
import React from 'react';
import { history } from 'umi';
import './index.less';

const { Text, Paragraph } = Typography;

interface RoleCardProps {
  /** 角色数据 */
  role: API.Character;
  /** 是否显示创建者信息 */
  showCreator?: boolean;
  /** 是否显示编辑和删除按钮（仅对自己创建的角色） */
  showOwnerActions?: boolean;
  /** 是否显示收藏按钮 */
  showFavorite?: boolean;
  /** 是否已收藏 */
  isFavorited?: boolean;
  /** 卡片样式 */
  style?: React.CSSProperties;
  /** 卡片类名 */
  className?: string;
  /** 点击查看详情回调 */
  onView?: (role: API.Character) => void;
  /** 点击开始聊天回调 */
  onChat?: (role: API.Character) => void;
  /** 点击编辑回调 */
  onEdit?: (role: API.Character) => void;
  /** 点击删除回调 */
  onDelete?: (role: API.Character) => void;
  /** 点击收藏回调 */
  onFavorite?: (role: API.Character, favorited: boolean) => void;
}

const RoleCard: React.FC<RoleCardProps> = ({
  role,
  showCreator = false,
  showOwnerActions = false,
  showFavorite = false,
  isFavorited = false,
  style,
  className,
  onView,
  onChat,
  onEdit,
  onDelete,
  onFavorite,
}) => {
  // 处理查看详情
  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onView) {
      onView(role);
    } else {
      history.push(`/role/detail/${role.id}`);
    }
  };

  // 处理开始聊天
  const handleChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onChat) {
      onChat(role);
    } else {
      history.push(`/role/chat/${role.id}`);
    }
  };

  // 处理编辑
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(role);
    } else {
      history.push(`/role/edit/${role.id}`);
    }
  };

  // 处理删除
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(role);
    }
  };

  // 处理收藏
  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFavorite) {
      onFavorite(role, !isFavorited);
    }
  };

  // 处理菜单点击
  const handleMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'view':
        handleView({} as React.MouseEvent);
        break;
      case 'edit':
        handleEdit({} as React.MouseEvent);
        break;
      case 'delete':
        handleDelete({} as React.MouseEvent);
        break;
    }
  };

  // 更多操作菜单
  const moreMenuItems: MenuProps['items'] = [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: '查看详情',
    },
    ...(showOwnerActions
      ? [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: '编辑角色',
          },
          {
            type: 'divider' as const,
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: '删除角色',
            danger: true,
          },
        ]
      : []),
  ];

  // 卡片操作按钮
  const cardActions = [
    <Tooltip title="开始聊天" key="chat">
      <Button
        type="text"
        icon={<MessageOutlined />}
        onClick={handleChat}
        className="role-card-action"
      />
    </Tooltip>,
    ...(showFavorite
      ? [
          <Tooltip title={isFavorited ? '取消收藏' : '收藏角色'} key="favorite">
            <Button
              type="text"
              icon={isFavorited ? <HeartFilled /> : <HeartOutlined />}
              onClick={handleFavorite}
              className={`role-card-action ${isFavorited ? 'favorited' : ''}`}
            />
          </Tooltip>,
        ]
      : []),
    <Dropdown
      menu={{ items: moreMenuItems, onClick: handleMenuClick }}
      placement="bottomRight"
      trigger={['click']}
      key="more"
    >
      <Button
        type="text"
        icon={<MoreOutlined />}
        onClick={(e) => e.stopPropagation()}
        className="role-card-action"
      />
    </Dropdown>,
  ];

  return (
    <Card
      hoverable
      className={`role-card ${className || ''}`}
      style={style}
      cover={
        <div className="role-card-cover" onClick={handleView}>
          <Avatar size={80} src={role.avatar} icon={<UserOutlined />} className="role-avatar" />
        </div>
      }
      actions={cardActions}
      onClick={handleView}
    >
      <div className="role-card-content">
        {/* 角色名称 */}
        <div className="role-name">
          <Text strong ellipsis={{ tooltip: role.name }}>
            {role.name}
          </Text>
        </div>

        {/* 角色描述 */}
        <div className="role-description">
          <Paragraph
            ellipsis={{ rows: 2, tooltip: role.description }}
            style={{ margin: 0, color: '#666', fontSize: '13px' }}
          >
            {role.description}
          </Paragraph>
        </div>

        {/* 角色标签 */}
        {role.tags && role.tags.length > 0 && (
          <div className="role-tags">
            <Space wrap size={[4, 4]}>
              {role.tags.slice(0, 3).map((tag, index) => (
                <Tag key={index} color="blue">
                  {tag}
                </Tag>
              ))}
              {role.tags.length > 3 && <Tag color="default">+{role.tags.length - 3}</Tag>}
            </Space>
          </div>
        )}

        {/* 创建者信息 */}
        {/* {showCreator && role.creator && (
          <div className="role-creator">
            <Space size={4}>
              <Avatar size={16} src={role.creator.avatar} icon={<UserOutlined />} />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {role.creator.name}
              </Text>
            </Space>
          </div>
        )} */}

        {/* 角色统计信息 */}
        {/* <div className="role-stats">
          <Space split={<span style={{ color: '#d9d9d9' }}>|</span>}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              人气 {role.popularity || 0}
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {role.category}
            </Text>
          </Space>
        </div> */}
      </div>
    </Card>
  );
};

export default RoleCard;
