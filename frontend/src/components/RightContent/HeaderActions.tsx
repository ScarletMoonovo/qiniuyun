import { Button, Space, Dropdown, message } from 'antd';
import { CompassOutlined, PlusOutlined, RobotOutlined, SoundOutlined } from '@ant-design/icons';
import { history } from 'umi';
import type { MenuProps } from 'antd';

const HeaderActions: React.FC = () => {
  const handleDiscoverClick = () => {
    history.push('/home');
  };

  const handleCreateRoleClick = () => {
    history.push('/role/create');
  };

  const handleCreateVoiceClick = () => {
    message.info('创建声音功能将在下个版本中提供');
  };

  const createMenuItems: MenuProps['items'] = [
    {
      key: 'role',
      icon: <RobotOutlined />,
      label: '创建角色',
      onClick: handleCreateRoleClick,
    },
    {
      key: 'voice',
      icon: <SoundOutlined />,
      label: '创建声音',
      onClick: handleCreateVoiceClick,
      disabled: true, // 暂时禁用，因为是下个版本的功能
    },
  ];

  return (
    <Space size="middle">
      <Button 
        type="text" 
        icon={<CompassOutlined />} 
        onClick={handleDiscoverClick}
        style={{ color: '#1890ff' }}
      >
        发现
      </Button>
      
      <Dropdown 
        menu={{ items: createMenuItems }}
        placement="bottomRight"
        trigger={['hover']}
      >
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          style={{ borderRadius: '6px' }}
        >
          创建
        </Button>
      </Dropdown>
    </Space>
  );
};

export default HeaderActions;
