import React from 'react';
import { Row, Col, Space, message } from 'antd';
import RoleCard from './index';

// 模拟角色数据
const mockRoles: API.Role[] = [
  {
    id: 1,
    name: '智能助手小艾',
    avatar: 'https://via.placeholder.com/80x80/4096ff/ffffff?text=AI',
    description: '我是一个智能助手，可以帮助您解答各种问题，提供生活和工作上的建议。',
    category: 'assistant',
    tags: ['智能', '助手', '问答', '建议'],
    personality: '友善、耐心、专业',
    background: '拥有丰富的知识库，擅长逻辑分析和问题解决',
    quotes: ['您好！有什么可以帮助您的吗？'],
    voiceStyle: 'female-gentle',
    popularity: 1250,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-20T15:45:00Z',
    creatorId: 1,
    creator: {
      id: 1,
      name: '开发者',
      avatar: 'https://via.placeholder.com/16x16/666666/ffffff?text=U',
      birthday: 0,
      sex: '[male',
    },
  },
  {
    id: 2,
    name: '心理咨询师莉莉',
    avatar: 'https://via.placeholder.com/80x80/ff6b9d/ffffff?text=心理',
    description: '专业的心理咨询师，擅长情感疏导和心理健康指导，为您提供温暖的陪伴。',
    category: 'counselor',
    tags: ['心理', '咨询', '情感', '陪伴', '专业'],
    personality: '温柔、理解、专业、耐心',
    background: '心理学硕士，拥有5年心理咨询经验',
    quotes: ['每个人都值得被理解和关爱'],
    voiceStyle: 'female-warm',
    popularity: 890,
    createdAt: '2024-01-10T09:15:00Z',
    updatedAt: '2024-01-18T14:20:00Z',
    creatorId: 2,
    creator: {
      id: 2,
      name: '心理专家',
      avatar: 'https://via.placeholder.com/16x16/ff6b9d/ffffff?text=P',
      birthday: 0,
      sex: '[male',
    },
  },
  {
    id: 3,
    name: '创意伙伴小创',
    avatar: 'https://via.placeholder.com/80x80/ffa726/ffffff?text=创意',
    description: '充满创意的伙伴，帮助您激发灵感，提供创新思路和解决方案。',
    category: 'creative',
    tags: ['创意', '灵感', '创新'],
    personality: '活泼、有趣、富有想象力',
    background: '设计师出身，热爱创新和艺术',
    quotes: ['让我们一起创造些有趣的东西吧！'],
    voiceStyle: 'female-energetic',
    popularity: 567,
    createdAt: '2024-01-12T16:45:00Z',
    updatedAt: '2024-01-19T11:30:00Z',
    creatorId: 1,
  },
];

const RoleCardDemo: React.FC = () => {
  const handleView = (role: API.Role) => {
    message.info(`查看角色: ${role.name}`);
  };

  const handleChat = (role: API.Role) => {
    message.success(`开始与 ${role.name} 聊天`);
  };

  const handleEdit = (role: API.Role) => {
    message.info(`编辑角色: ${role.name}`);
  };

  const handleDelete = (role: API.Role) => {
    message.warning(`删除角色: ${role.name}`);
  };

  const handleFavorite = (role: API.Role, favorited: boolean) => {
    message.success(`${favorited ? '收藏' : '取消收藏'} ${role.name}`);
  };

  return (
    <div style={{ padding: '24px' }}>
      <h2>角色卡片组件演示</h2>
      
      <h3>基础展示</h3>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <RoleCard 
            role={mockRoles[0]}
            onView={handleView}
            onChat={handleChat}
          />
        </Col>
      </Row>

      <h3 style={{ marginTop: '32px' }}>显示创建者信息</h3>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <RoleCard 
            role={mockRoles[1]}
            showCreator={true}
            onView={handleView}
            onChat={handleChat}
          />
        </Col>
      </Row>

      <h3 style={{ marginTop: '32px' }}>显示所有者操作（编辑、删除）</h3>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <RoleCard 
            role={mockRoles[2]}
            showOwnerActions={true}
            onView={handleView}
            onChat={handleChat}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </Col>
      </Row>

      <h3 style={{ marginTop: '32px' }}>显示收藏功能</h3>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <RoleCard 
            role={mockRoles[0]}
            showCreator={true}
            showFavorite={true}
            isFavorited={false}
            onView={handleView}
            onChat={handleChat}
            onFavorite={handleFavorite}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <RoleCard 
            role={mockRoles[1]}
            showCreator={true}
            showFavorite={true}
            isFavorited={true}
            onView={handleView}
            onChat={handleChat}
            onFavorite={handleFavorite}
          />
        </Col>
      </Row>

      <h3 style={{ marginTop: '32px' }}>网格布局展示</h3>
      <Row gutter={[16, 16]}>
        {mockRoles.map((role, index) => (
          <Col xs={24} sm={12} md={8} lg={6} key={role.id}>
            <RoleCard 
              role={role}
              showCreator={true}
              showFavorite={true}
              showOwnerActions={role.creatorId === 1} // 假设当前用户ID为1
              isFavorited={index % 2 === 0}
              onView={handleView}
              onChat={handleChat}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onFavorite={handleFavorite}
            />
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default RoleCardDemo;