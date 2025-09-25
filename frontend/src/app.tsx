import Footer from '@/components/Footer';
import { getUser } from '@/services/backend/user';
import { TokenManager } from '@/utils/token';
import type { RunTimeLayoutConfig } from '@umijs/max';
import { history } from '@umijs/max';
import { App, ConfigProvider, Space } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import defaultSettings from '../config/defaultSettings';
import { AvatarDropdown } from './components/RightContent/AvatarDropdown';
import HeaderActions from './components/RightContent/HeaderActions';
import { requestConfig } from './requestConfig';

const loginPath = '/user/login';

/**
 * @see  https://umijs.org/zh-CN/plugins/plugin-initial-state
 * */
export async function getInitialState(): Promise<InitialState> {
  const initialState: InitialState = {
    currentUser: undefined,
  };
  
  // 如果不是登录页面，且有 token，尝试获取用户信息
  const { location } = history;
  if (location.pathname !== loginPath) {
    // 检查是否有 JWT token 和用户 ID
    if (TokenManager.hasToken()) {
      const userId = TokenManager.getUserId();
      if (userId) {
        try {
          // 使用存储的用户 ID 获取用户信息
          const res = await getUser({ id: userId });
          const userInfo = res.user
          console.log("userInfo: ", userInfo)
          // 直接使用用户信息
          initialState.currentUser = {
            ...userInfo,
          };
        } catch (error: any) {
          // 如果获取用户信息失败（可能 token 过期），清理无效的 token
          console.error('获取用户信息失败:', error);
          TokenManager.clearTokens();
        }
      }
    }

    // 模拟登录用户（开发时使用）
    // const mockUser: API.LoginUserVO = {
    //   userAvatar: 'https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png',
    //   userName: 'Moon',
    //   userRole: 'admin',
    // };
    // initialState.currentUser = mockUser;
  }
  return initialState;
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
// @ts-ignore
export const layout: RunTimeLayoutConfig = ({ initialState }) => {
  return {
    avatarProps: {
      render: () => {
        return (
          <Space size="large">
            <HeaderActions />
            <AvatarDropdown />
          </Space>
        );
      },
    },
    waterMarkProps: {
      content: initialState?.currentUser?.name,
    },
    footerRender: () => <Footer />,
    menuHeaderRender: undefined,
    menuRender: false, // 完全隐藏侧边栏菜单
    menuDataRender: () => [], // 不渲染菜单数据
    // 自定义 403 页面
    // unAccessible: <div>unAccessible</div>,
    ...defaultSettings,
  };
};

/**
 * @name rootContainer 配置，用于包裹整个应用
 * 解决 Antd 5.x 静态方法的 context 警告问题
 */
export function rootContainer(container: any) {
  return (
    <ConfigProvider locale={zhCN}>
      <App>
        {container}
      </App>
    </ConfigProvider>
  );
}

/**
 * @name request 配置，可以配置错误处理
 * 它基于 axios 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。
 * @doc https://umijs.org/docs/max/request#配置
 */
export const request = requestConfig;
