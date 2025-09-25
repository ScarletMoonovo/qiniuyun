import { PageContainer } from '@ant-design/pro-components';
import { Card } from 'antd';
import { useParams } from 'umi';

const RoleEdit: React.FC = () => {
  const { id } = useParams();

  return (
    <PageContainer>
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h2>编辑角色</h2>
          <p>编辑角色 ID: {id}</p>
        </div>
      </Card>
    </PageContainer>
  );
};

export default RoleEdit;
