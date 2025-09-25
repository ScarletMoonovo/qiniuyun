import { PageContainer } from '@ant-design/pro-components';
import { Card } from 'antd';
import { useParams } from 'umi';

const RoleChat: React.FC = () => {
  const { id } = useParams();

  return (
    <PageContainer>
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h2>与角色聊天</h2>
          <p>正在与角色 ID: {id} 聊天</p>
        </div>
      </Card>
    </PageContainer>
  );
};

export default RoleChat;
