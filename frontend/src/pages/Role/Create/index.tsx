import { newCharacter } from '@/services/backend/character';
import { getTags } from '@/services/backend/api';
import { PlusOutlined } from '@ant-design/icons';
import {
  PageContainer,
  ProForm,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import type { UploadProps } from 'antd';
import { Avatar, Button, Card, Col, message, Row, Space, Spin, Upload } from 'antd';
import { useEffect, useState } from 'react';
import { history } from 'umi';

// 声音模型选项类型
type VoiceModelOption = {
  label: string;
  value: string;
  description: string;
};

const RoleCreate: React.FC = () => {
  const [form] = ProForm.useForm();
  const [availableTags, setAvailableTags] = useState<API.Tag[]>([]);
  const [avatar, setAvatar] = useState<string>('');
  const [voiceModels, setVoiceModels] = useState<VoiceModelOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [voiceModelsLoading, setVoiceModelsLoading] = useState(true);
  const [tagsLoading, setTagsLoading] = useState(true);

  // 获取声音模型列表和标签列表
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 获取声音模型
        setVoiceModelsLoading(true);
        // const voiceResponse = await getVoiceModels();
        // if (voiceResponse?.models) {
        //   const modelOptions: VoiceModelOption[] = voiceResponse.models.map((model: API.VoiceModel) => ({
        //     label: model.name,
        //     value: model.id,
        //     description: model.description,
        //   }));
        //   setVoiceModels(modelOptions);
        // }

        // 获取标签列表
        setTagsLoading(true);
        const tagsResponse = await getTags();
        if (tagsResponse) {
          setAvailableTags(tagsResponse);
        }
      } catch (error) {
        console.error('获取数据失败:', error);
        message.error('获取数据失败，请刷新重试');
      } finally {
        setVoiceModelsLoading(false);
        setTagsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleBack = () => {
    window.history.back();
  };



  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      // 构建角色创建请求数据
      const characterData: API.NewCharacterRequest = {
        background: values.background,
        name: values.name,
        avatar: avatar || '',
        description: values.description,
        open_line: values.openLine,
        voice: values.voice,
        tags: values.tags || [],
        is_public: values.isPublic
      };

      console.log('创建角色数据:', characterData);

      // 调用API创建角色
      const response = await newCharacter(characterData);

      if (response?.character) {
        message.success('角色创建成功！');
        // 跳转到角色详情页
        history.push(`/role/detail/${response.character.id}`);
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
                  render: () => (
                    <div style={{ textAlign: 'center', marginTop: 32 }}>
                      <Space size="large">
                        <Button onClick={handleBack} disabled={loading}>
                          取消
                        </Button>
                        <Button type="primary" loading={loading} onClick={() => form.submit()}>
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
                      <div
                        style={{
                          width: 80,
                          height: 80,
                          border: '1px dashed #d9d9d9',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
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

                <ProFormTextArea
                  name="openLine"
                  label="开场白"
                  placeholder="设置角色的开场白，多个开场白请用换行分隔..."
                  tooltip="角色在开始对话时可能会说的话，可以设置多个，系统会随机选择"
                  fieldProps={{
                    rows: 3,
                    showCount: true,
                    maxLength: 300,
                  }}
                />

                <ProFormSelect
                  name="voice"
                  label="声音模型"
                  placeholder={voiceModelsLoading ? '加载中...' : '请选择声音模型'}
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

                {/* 角色标签 */}
                <ProFormSelect
                  name="tags"
                  label="角色标签"
                  placeholder={tagsLoading ? '加载中...' : '请选择角色标签'}
                  mode="multiple"
                  options={availableTags.map(tag => ({
                    label: tag.name,
                    value: tag.id,
                  }))}
                  fieldProps={{
                    loading: tagsLoading,
                    disabled: tagsLoading,
                    maxTagCount: 5,
                    maxTagTextLength: 10,
                    maxCount: 5,
                  }}
                  tooltip="最多可选择5个标签"
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

                {/* 可见性 */}
                <ProFormSelect
                  name="isPublic"
                  label="可见性"
                  placeholder="请选择角色可见性"
                  options={[
                    { label: '公开', value: true },
                    { label: '私有', value: false },
                  ]}
                  rules={[{ required: true, message: '请选择角色可见性' }]}
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
