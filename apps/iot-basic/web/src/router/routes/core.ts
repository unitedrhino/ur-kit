import type { RouteRecordRaw } from 'vue-router';

import { $t } from '@vben/saas/locales';

import { buildOrgAuthPath, ORG_AUTH_ROOT_ROUTE_PATH } from '../org-scope';

const BasicLayout = () => import('#/layouts').then((module) => module.BasicLayout());
const AuthPageLayout = () => import('@vben/saas/layouts').then((module) => module.AuthPageLayout());

const Login = () => import('#/views/_core/authentication').then((module) => ({ default: module.Login }));
const CodeLogin = () => import('#/views/_core/authentication').then((module) => ({ default: module.CodeLogin }));
const QrCodeLogin = () => import('#/views/_core/authentication').then((module) => ({ default: module.QrCodeLogin }));
const QrCodeLoginSuccess = () => import('#/views/_core/authentication').then((module) => ({ default: module.QrCodeLoginSuccess }));
const ForgetPassword = () => import('#/views/_core/authentication').then((module) => ({ default: module.ForgetPassword }));
const ResetPassword = () => import('#/views/_core/authentication').then((module) => ({ default: module.ResetPassword }));
const Register = () => import('#/views/_core/authentication').then((module) => ({ default: module.Register }));
const RegisterStep2 = () => import('#/views/_core/authentication').then((module) => ({ default: module.RegisterStep2 }));
const RegisterStep3 = () => import('#/views/_core/authentication').then((module) => ({ default: module.RegisterStep3 }));
const InviteAccept = () => import('#/views/_core/authentication').then((module) => ({ default: module.InviteAccept }));
const ThirdLoginCallback = () => import('#/views/_core/authentication').then((module) => ({ default: module.ThirdLoginCallback }));
const ThirdLoginComplete = () => import('#/views/_core/authentication').then((module) => ({ default: module.ThirdLoginComplete }));

const NotFound = () => import('@vben/saas/fallback').then((module) => ({ default: module.NotFound }));

const SystemInit = () => import('@vben/saas/init').then((module) => ({ default: module.SystemInit }));

/** 全局404页面 */
const fallbackNotFoundRoute: RouteRecordRaw = {
  component: NotFound,
  meta: {
    hideInBreadcrumb: true,
    hideInMenu: true,
    hideInTab: true,
    title: '404',
  },
  name: 'FallbackNotFound',
  path: '/:path(.*)*',
};

/** 基本路由，这些路由是必须存在的 */
const coreRoutes: RouteRecordRaw[] = [
  /**
   * 根路由
   * 使用基础布局，作为所有页面的父级容器，子级就不必配置Basic∏Layout。
   * 此路由必须存在，且不应修改
   */
  {
    component: SystemInit,
    meta: {
      hideInBreadcrumb: true,
      hideInMenu: true,
      hideInTab: true,
      title: $t('console.routes.init'),
    },
    name: 'Init',
    path: '/init',
  },
  {
    component: BasicLayout,
    meta: {
      hideInBreadcrumb: true,
      title: 'Root',
    },
    name: 'Root',
    path: '/',
    // redirect: preferences.app.defaultHomePath,
    redirect: '/app_not_found',
    children: [],
  },
  //app-not-found路由用于提示用户当前应用未找到，可能是因为没有权限或者应用未安装等原因导致的
  {
    name: 'AppNotFound',
    path: '/app_not_found',
    meta: {
      title: $t('orgIotClient.routes.appNotFound'),
      hideInMenu: true,
      hideInTab: true,
      hideInBreadcrumb: true,
    },
    component: () => import('#/views/app-not-found.vue'),
  },
  {
    component: AuthPageLayout,
    meta: {
      hideInTab: true,
      title: 'Authentication',
    },
    name: 'Authentication',
    path: ORG_AUTH_ROOT_ROUTE_PATH,
    redirect: (to) => buildOrgAuthPath(String(to.params.orgId || ''), 'login'),
    children: [
      {
        name: 'Login',
        path: 'login',
        component: Login,
        meta: {
          title: $t('page.auth.login'),
        },
      },
      {
        name: 'CodeLogin',
        path: 'code-login',
        component: CodeLogin,
        meta: {
          title: $t('page.auth.codeLogin'),
        },
      },
      {
        name: 'QrCodeLogin',
        path: 'qrcode-login',
        component: QrCodeLogin,
        meta: {
          title: $t('page.auth.qrcodeLogin'),
        },
      },
      {
        name: 'QrCodeLoginSuccess',
        path: 'qrcode-login-success',
        component: QrCodeLoginSuccess,
        meta: {
          title: $t('console.routes.qrcodeLoginSuccess'),
        },
      },
      {
        name: 'ForgetPassword',
        path: 'forget-password',
        component: ForgetPassword,
        meta: {
          title: $t('page.auth.forgetPassword'),
        },
      },
      {
        name: 'ResetPassword',
        path: 'reset-password/:account',
        component: ResetPassword,
        meta: {
          title: $t('console.routes.resetPassword'),
        },
      },
      {
        name: 'Register',
        path: 'register',
        component: Register,
        meta: {
          title: $t('page.auth.register'),
        },
      },
      {
        name: 'RegisterStep2',
        path: 'register/step2',
        component: RegisterStep2,
        meta: {
          title: $t('console.routes.registerStep2'),
        },
      },
      {
        name: 'RegisterStep3',
        path: 'register/step3',
        component: RegisterStep3,
        meta: {
          title: $t('console.routes.registerStep3'),
        },
      },
      {
        name: 'InviteAccept',
        path: 'invite',
        component: InviteAccept,
        meta: {
          title: $t('console.routes.inviteAccept'),
        },
      },
      {
        name: 'ThirdLoginCallback',
        path: 'third-login/callback',
        component: ThirdLoginCallback,
        meta: {
          title: $t('console.routes.thirdLoginCallback'),
        },
      },
      {
        name: 'ThirdLoginComplete',
        path: 'third-login/complete',
        component: ThirdLoginComplete,
        meta: {
          title: $t('console.routes.thirdLoginComplete'),
        },
      },
    ],
  },
];

export { coreRoutes, fallbackNotFoundRoute };
