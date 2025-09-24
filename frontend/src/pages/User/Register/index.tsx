import Footer from '@/components/Footer';
import { register, sendCaptcha } from '@/services/backend/user';
import { TokenManager } from '@/utils/token';
import { LockOutlined, MailOutlined, UserOutlined, SafetyOutlined } from '@ant-design/icons';
import { LoginForm, ProFormText, ProFormCaptcha } from '@ant-design/pro-components';
import { useEmotionCss } from '@ant-design/use-emotion-css';
import { Helmet, history } from '@umijs/max';
import { message, Tabs } from 'antd';
import React, { useState } from 'react';
import { Link } from 'umi';
import Settings from '../../../../config/defaultSettings';

/**
 * 用户注册页面
 * @constructor
 */
const UserRegisterPage: React.FC = () => {
  const [type, setType] = useState<string>('account');
  const containerClassName = useEmotionCss(() => {
    return {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'auto',
      backgroundImage:
        "url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr')",
      backgroundSize: '100% 100%',
    };
  });

  /**
   * 提交注册
   * @param values
   */
  const handleSubmit = async (values: API.RegisterRequest) => {
    try {
      // 注册
      const res = await register({
        email: values.email,
        captcha: values.captcha,
        name: values.name,
        password: values.password,
      });

      const defaultLoginSuccessMessage = '注册成功！';
      message.success(defaultLoginSuccessMessage);
      
      // 注册成功后直接存储 token（如果后端返回）
      if (res.accessToken && res.refreshToken) {
        TokenManager.setTokens(
          res.accessToken,
          res.refreshToken,
          res.id
        );
        // 注册成功直接跳转到首页
        history.push('/');
      } else {
        // 如果后端不返回 token，跳转到登录页
        history.push('/user/login');
      }
      return;
    } catch (error: any) {
      const defaultLoginFailureMessage = `注册失败，${error.message}`;
      message.error(defaultLoginFailureMessage);
    }
  };

  /**
   * 发送验证码
   * @param email
   */
  const handleSendCaptcha = async (email: string) => {
    try {
      await sendCaptcha({ email });
      message.success('验证码发送成功！');
      return true;
    } catch (error: any) {
      message.error(`验证码发送失败：${error.message}`);
      return false;
    }
  };

  return (
    <div className={containerClassName}>
      <Helmet>
        <title>
          {'注册'}- {Settings.title}
        </title>
      </Helmet>
      <div
        style={{
          flex: '1',
          padding: '32px 0',
        }}
      >
        <LoginForm
          contentStyle={{
            minWidth: 280,
            maxWidth: '75vw',
          }}
          logo={<img alt="logo" style={{ height: '100%' }} src="/logo.svg" />}
          title="注册"
          subTitle={'高效招聘、爽快求职'}
          initialValues={{
            autoLogin: true,
          }}
          submitter={{
            searchConfig: {
              submitText: '注册',
            },
          }}
          onFinish={async (values) => {
            await handleSubmit(values as API.RegisterRequest);
          }}
        >
          <Tabs
            activeKey={type}
            onChange={setType}
            centered
            items={[
              {
                key: 'account',
                label: '新用户注册',
              },
            ]}
          />
          {type === 'account' && (
            <>
              <ProFormText
                name="email"
                fieldProps={{
                  size: 'large',
                  prefix: <MailOutlined />,
                }}
                placeholder={'请输入邮箱'}
                rules={[
                  {
                    required: true,
                    message: '邮箱是必填项！',
                  },
                  {
                    type: 'email',
                    message: '请输入正确的邮箱格式！',
                  },
                ]}
              />
              <ProFormText
                name="name"
                fieldProps={{
                  size: 'large',
                  prefix: <UserOutlined />,
                }}
                placeholder={'请输入用户名'}
                rules={[
                  {
                    required: true,
                    message: '用户名是必填项！',
                  },
                  {
                    min: 2,
                    max: 20,
                    message: '用户名长度在2-20个字符之间！',
                  },
                ]}
              />
              <ProFormCaptcha
                name="captcha"
                fieldProps={{
                  size: 'large',
                  prefix: <SafetyOutlined />,
                }}
                captchaProps={{
                  size: 'large',
                }}
                placeholder={'请输入验证码'}
                captchaTextRender={(timing, count) => {
                  if (timing) {
                    return `${count} 秒后重新获取`;
                  }
                  return '获取验证码';
                }}
                phoneName="email"
                onGetCaptcha={async (email) => {
                  await handleSendCaptcha(email);
                }}
                rules={[
                  {
                    required: true,
                    message: '验证码是必填项！',
                  },
                  {
                    len: 6,
                    message: '验证码长度为6位！',
                  },
                ]}
              />
              <ProFormText.Password
                name="password"
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined />,
                }}
                placeholder={'请输入密码'}
                rules={[
                  {
                    required: true,
                    message: '密码是必填项！',
                  },
                  {
                    min: 6,
                    message: '密码长度至少6位！',
                  },
                ]}
              />
            </>
          )}

          <div
            style={{
              marginBottom: 24,
              textAlign: 'right',
            }}
          >
            <Link to="/user/login">老用户登录</Link>
          </div>
        </LoginForm>
      </div>
      <Footer />
    </div>
  );
};
export default UserRegisterPage;
