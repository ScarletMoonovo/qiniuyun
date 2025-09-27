import Footer from '@/components/Footer';
import { login, sendCaptcha, getUser } from '@/services/backend/user';
import { TokenManager } from '@/utils/token';
import { LockOutlined, MailOutlined, SafetyOutlined } from '@ant-design/icons';
import { LoginForm, ProFormText, ProFormCaptcha } from '@ant-design/pro-components';
import { useEmotionCss } from '@ant-design/use-emotion-css';
import { Helmet, history, useModel } from '@umijs/max';
import { message, Tabs } from 'antd';
import React, { useState } from 'react';
import { Link } from 'umi';
import Settings from '../../../../config/defaultSettings';

const Login: React.FC = () => {
  const [type, setType] = useState<string>('password');
  const { initialState, setInitialState } = useModel('@@initialState');
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

  const handleSubmit = async (values: API.LoginRequest) => {
    try {
      // 登录
      const loginRes = await login({
        email: values.email,
        password: type === 'password' ? values.password : undefined,
        captcha: type === 'captcha' ? values.captcha : undefined,
      });

      const defaultLoginSuccessMessage = '登录成功！';
      message.success(defaultLoginSuccessMessage);
      
      // 存储 JWT tokens 和用户 ID
      TokenManager.setTokens(
        loginRes.accessToken,
        loginRes.refreshToken,
        loginRes.id
      );

      // 登录成功后，使用登录返回的用户 ID 获取完整的用户信息
      try {
        const res = await getUser({ id: loginRes.id.toString() });
        const userInfo = res.user;
        setInitialState({
          ...initialState,
          currentUser: {
            id: userInfo.id,
            name: userInfo.name,
            avatar: userInfo.avatar,
            // 其他字段根据需要映射
          },
        });
      } catch (userError) {
        console.error('获取用户信息失败:', userError);
        // 如果获取用户信息失败，至少设置基本信息
        setInitialState({
          ...initialState,
          currentUser: {
            id: loginRes.id,
            // 使用登录返回的基本信息
          } as API.User,
        });
      }
      
      const urlParams = new URL(window.location.href).searchParams;
      history.push(urlParams.get('redirect') || '/');
      return;
    } catch (error: any) {
      const defaultLoginFailureMessage = `登录失败，${error.message}`;
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
    } catch (error: any) {
      message.error(`验证码发送失败：${error.message}`);
      throw error; // 让 ProFormCaptcha 知道发送失败
    }
  };

  return (
    <div className={containerClassName}>
      <Helmet>
        <title>
          {'登录'}- {Settings.title}
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
          title="Moon前端万用模板"
          subTitle={'快速开发属于自己的前端项目'}
          initialValues={{
            autoLogin: true,
          }}
          onFinish={async (values) => {
            await handleSubmit(values as API.LoginRequest);
          }}
        >
          <Tabs
            activeKey={type}
            onChange={setType}
            centered
            items={[
              {
                key: 'password',
                label: '邮箱密码登录',
              },
              {
                key: 'captcha',
                label: '邮箱验证码登录',
              },
            ]}
          />
          {/* 邮箱字段（两种登录方式都需要） */}
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
          {/* 密码登录 */}
          {type === 'password' && (
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
              ]}
            />
          )}
          {/* 验证码登录 */}
          {type === 'captcha' && (
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
          )}

          <div
            style={{
              marginBottom: 24,
              textAlign: 'right',
            }}
          >
            <Link to="/user/register">新用户注册</Link>
          </div>
        </LoginForm>
      </div>
      <Footer />
    </div>
  );
};
export default Login;
