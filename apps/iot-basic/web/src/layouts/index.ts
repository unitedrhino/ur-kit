/**
 * org-iot-client 布局入口。
 * BasicLayout 使用本应用独立实现，其它通用布局继续复用 SaaS 窄入口。
 */
const BasicLayout = () => import('./basic.vue');
const AuthPageLayout = () => import('@vben/saas/layouts').then((module) => module.AuthPageLayout());
const IFrameView = () => import('@vben/saas/layouts').then((module) => module.IFrameView());

export { AuthPageLayout, BasicLayout, IFrameView };
