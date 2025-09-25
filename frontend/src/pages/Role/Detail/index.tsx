import { PageContainer } from '@ant-design/pro-components';
import { Card } from 'antd';
import { useParams } from 'umi';

const RoleDetail: React.FC = () => {
  const { id } = useParams();

  return (
    <PageContainer>
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h2>角色详情</h2>
          <p>角色 ID: {id}</p>
        </div>
      </Card>
    </PageContainer>
  );
};

export default RoleDetail;
