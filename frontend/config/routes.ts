export default [
  {
    path: '/user',
    layout: false,
    routes: [
      { path: '/user/login', component: './User/Login' },
      { path: '/user/register', component: './User/Register' },
    ],
  },
  { path: '/welcome', component: './Welcome', hideInMenu: true },
  { path: '/home', component: './Role/Home', name: 'AI角色主页', access: 'canUser' },
  { 
    path: '/role/create', 
    component: './Role/Create', 
    name: '创建角色',
    hideInMenu: true,
    access: 'canUser'
  },
  { 
    path: '/role/edit/:id', 
    component: './Role/Edit', 
    name: '编辑角色',
    hideInMenu: true,
    access: 'canUser'
  },
  { 
    path: '/role/detail/:id', 
    component: './Role/Detail', 
    name: '角色详情',
    hideInMenu: true,
    access: 'canUser'
  },
  { 
    path: '/role/chat/:id', 
    component: './Role/Chat', 
    name: '与角色聊天',
    hideInMenu: true,
    access: 'canUser'
  },
  { path: '/', redirect: '/home' },
  { path: '*', layout: false, component: './404' },
];
