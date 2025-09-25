import { PageContainer, ProForm, ProFormText, ProFormTextArea, ProFormSelect } from '@ant-design/pro-components';
import { Card, Row, Col, Button, Space, message, Upload, Avatar, Tag, Input } from 'antd';
import { PlusOutlined, UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { history } from 'umi';
import { useState, useRef } from 'react';
import type { UploadProps } from 'antd';

// 预设的声音模型
const voiceModels = [
  { label: '温柔女声', value: 'gentle_female', description: '温柔甜美的女性声音' },
  { label: '成熟男声', value: 'mature_male', description: '沉稳有力的男性声音' },
  { label: '活泼女声', value: 'lively_female', description: '活泼可爱的女性声音' },
  { label: '磁性男声', value: 'magnetic_male', description: '富有磁性的男性声音' },
  { label: '知性女声', value: 'intellectual_female', description: '知性优雅的女性声音' },
  { label: '阳光男声', value: 'sunny_male', description: '阳光开朗的男性声音' },
];

// 角色分类
const roleCategories = [
  { label: '智能助手', value: 'assistant' },
  { label: '教育导师', value: 'education' },
  { label: '心理咨询', value: 'counselor' },
  { label: '创意伙伴', value: 'creative' },
  { label: '生活顾问', value: 'lifestyle' },
  { label: '专业顾问', value: 'professional' },
  { label: '娱乐陪伴', value: 'entertainment' },
  { label: '其他', value: 'other' },
];

const RoleCreate: React.FC = () => {
  const [form] = ProForm.useForm();
  const [tags, setTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [avatar, setAvatar] = useState<string>('');
  const inputRef = useRef<any>(null);

  const handleBack = () => {
    history.back();
  };

  const handleAddTag = () => {
    if (inputValue && !tags.includes(inputValue) && tags.length < 5) {
      setTags([...tags, inputValue]);
      setInputValue('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (values: any) => {
    try {
      const roleData = {
        ...values,
        tags,
        avatar,
      };
      
      console.log('创建角色数据:', roleData);
      
      // 这里应该调用API创建角色
      // await createRole(roleData);
      
      message.success('角色创建成功！');
      history.push('/home');
    } catch (error) {
      message.error('创建角色失败，请重试');
    }
  };

  const uploadProps: UploadProps = {
    name: 'avatar',
    listType: 'picture-card',
    className: 'avatar-uploader',
    showUploadList: false,
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('只能上传 JPG/PNG 格式的图片!');
        return false;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('图片大小不能超过 2MB!');
        return false;
      }
      
      // 创建预览URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatar(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      return false; // 阻止自动上传
    },
  };

  return (
    <PageContainer
      header={{
        title: '创建AI角色',
        onBack: handleBack,
      }}
      style={{ padding: '0 24px' }}
    >
      <Row justify="center">
        <Col xs={24} sm={20} md={16} lg={12} xl={10}>
          <Card>
            <ProForm
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              submitter={{
                searchConfig: {
                  submitText: '创建角色',
                },
                render: (_, dom) => (
                  <div style={{ textAlign: 'center', marginTop: 32 }}>
                    <Space size="large">
                      <Button onClick={handleBack}>
                        取消
                      </Button>
                      {dom[1]}
                    </Space>
                  </div>
                ),
              }}
            >
              {/* 角色头像 */}
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ marginBottom: 8 }}>角色头像</div>
                <Upload {...uploadProps}>
                  {avatar ? (
                    <Avatar size={80} src={avatar} />
                  ) : (
                    <div style={{
                      width: 80,
                      height: 80,
                      border: '1px dashed #d9d9d9',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}>
                      <div style={{ textAlign: 'center', color: '#999' }}>
                        <PlusOutlined style={{ fontSize: 16, marginBottom: 4 }} />
                        <div style={{ fontSize: 12 }}>上传头像</div>
                      </div>
                    </div>
                  )}
                </Upload>
              </div>

              {/* 基本信息 */}
              <ProFormText
                name="name"
                label="角色姓名"
                placeholder="请输入角色姓名"
                rules={[
                  { required: true, message: '请输入角色姓名' },
                  { max: 20, message: '角色姓名不能超过20个字符' },
                ]}
              />

              <ProFormTextArea
                name="description"
                label="角色介绍"
                placeholder="请简单介绍一下这个角色..."
                rules={[
                  { required: true, message: '请输入角色介绍' },
                  { max: 200, message: '角色介绍不能超过200个字符' },
                ]}
                fieldProps={{
                  rows: 3,
                  showCount: true,
                  maxLength: 200,
                }}
              />

              <ProFormSelect
                name="category"
                label="角色分类"
                placeholder="请选择角色分类"
                options={roleCategories}
                rules={[{ required: true, message: '请选择角色分类' }]}
              />

              {/* 标签管理 */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                  角色标签 <span style={{ color: '#999', fontSize: 12 }}>(最多5个)</span>
                </div>
                <Space wrap style={{ marginBottom: 8 }}>
                  {tags.map((tag) => (
                    <Tag
                      key={tag}
                      closable
                      onClose={() => handleRemoveTag(tag)}
                    >
                      {tag}
                    </Tag>
                  ))}
                </Space>
                {tags.length < 5 && (
                  <Space.Compact style={{ width: '100%' }}>
                    <Input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onPressEnter={handleAddTag}
                      placeholder="输入标签并按回车添加"
                      maxLength={10}
                    />
                    <Button onClick={handleAddTag} disabled={!inputValue.trim()}>
                      添加
                    </Button>
                  </Space.Compact>
                )}
              </div>

              <ProFormTextArea
                name="personality"
                label="性格特征"
                placeholder="描述角色的性格特点，如温柔、幽默、严谨等..."
                rules={[
                  { required: true, message: '请描述角色的性格特征' },
                  { max: 300, message: '性格特征不能超过300个字符' },
                ]}
                fieldProps={{
                  rows: 3,
                  showCount: true,
                  maxLength: 300,
                }}
              />

              <ProFormTextArea
                name="background"
                label="角色背景"
                placeholder="描述角色的背景故事，如职业、经历、专业领域等..."
                rules={[
                  { required: true, message: '请描述角色的背景故事' },
                  { max: 500, message: '角色背景不能超过500个字符' },
                ]}
                fieldProps={{
                  rows: 4,
                  showCount: true,
                  maxLength: 500,
                }}
              />

              <ProFormSelect
                name="voiceStyle"
                label="声音模型"
                placeholder="请选择声音模型"
                options={voiceModels}
                rules={[{ required: true, message: '请选择声音模型' }]}
                fieldProps={{
                  optionRender: (option) => (
                    <div>
                      <div style={{ fontWeight: 500 }}>{option.label}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {option.data.description}
                      </div>
                    </div>
                  ),
                }}
              />

              <ProFormTextArea
                name="quotes"
                label="开场白"
                placeholder="设置角色的开场白，多个开场白请用换行分隔..."
                tooltip="角色在开始对话时可能会说的话，可以设置多个，系统会随机选择"
                fieldProps={{
                  rows: 3,
                  showCount: true,
                  maxLength: 300,
                }}
              />
            </ProForm>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default RoleCreate;
