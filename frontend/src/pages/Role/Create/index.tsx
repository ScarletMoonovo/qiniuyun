import { PageContainer, ProForm, ProFormText, ProFormTextArea, ProFormSelect } from '@ant-design/pro-components';
import { Card, Row, Col, Button, Space, message, Upload, Avatar, Tag, Input, Spin } from 'antd';
import { PlusOutlined, UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { history } from 'umi';
import { useState, useRef, useEffect } from 'react';
import type { UploadProps } from 'antd';
import { createRole, getVoiceModels } from '@/services/backend/role';

// 声音模型选项类型
type VoiceModelOption = {
  label: string;
  value: string;
  description: string;
};

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
  const [voiceModels, setVoiceModels] = useState<VoiceModelOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [voiceModelsLoading, setVoiceModelsLoading] = useState(true);
  const inputRef = useRef<any>(null);

  // 获取声音模型列表
  useEffect(() => {
    const fetchVoiceModels = async () => {
      try {
        setVoiceModelsLoading(true);
        const response = await getVoiceModels();
        if (response.models) {
          const modelOptions: VoiceModelOption[] = response.models.map((model: API.VoiceModel) => ({
            label: model.name,
            value: model.id,
            description: model.description,
          }));
          setVoiceModels(modelOptions);
        }
      } catch (error) {
        console.error('获取声音模型失败:', error);
        message.error('获取声音模型失败，请刷新重试');
      } finally {
        setVoiceModelsLoading(false);
      }
    };

    fetchVoiceModels();
  }, []);

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
      setLoading(true);
      
      // 构建角色创建请求数据
      const roleData: API.CreateRoleRequest = {
        name: values.name,
        description: values.description,
        category: values.category,
        personality: values.personality,
        background: values.background,
        voiceStyle: values.voiceStyle,
        quotes: values.quotes ? values.quotes.split('\n').filter((q: string) => q.trim()) : [],
        tags,
        avatar: avatar || undefined,
      };
      
      console.log('创建角色数据:', roleData);
      
      // 调用API创建角色
      const response = await createRole(roleData);
      
      if (response) {
        message.success('角色创建成功！');
        // 跳转到角色详情页或角色列表页
        history.push('/role/home');
      }
    } catch (error: any) {
      console.error('创建角色失败:', error);
      const errorMessage = error?.message || '创建角色失败，请重试';
      message.error(errorMessage);
    } finally {
      setLoading(false);
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
            <Spin spinning={voiceModelsLoading && voiceModels.length === 0} tip="加载声音模型中...">
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
                      <Button onClick={handleBack} disabled={loading}>
                        取消
                      </Button>
                      <Button 
                        type="primary" 
                        loading={loading}
                        onClick={() => form.submit()}
                      >
                        创建角色
                      </Button>
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
                placeholder={voiceModelsLoading ? "加载中..." : "请选择声音模型"}
                options={voiceModels}
                rules={[{ required: true, message: '请选择声音模型' }]}
                fieldProps={{
                  loading: voiceModelsLoading,
                  disabled: voiceModelsLoading,
                  optionRender: (option) => (
                    <div>
                      <div style={{ fontWeight: 500 }}>{option.label}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {option.data?.description || ''}
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
            </Spin>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default RoleCreate;
