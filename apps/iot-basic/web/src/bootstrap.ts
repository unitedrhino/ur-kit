import { createApp } from 'vue';

import { registerAccessDirective } from '@vben/access';
import { registerLoadingDirective } from '@vben/common-ui';
import { preferences } from '@vben/preferences';
import { initStores, useAccessStore } from '@vben/stores';
import '@vben/styles';
import '@vben/styles/naive';
import '@vben/saas/styles/card-hover';

import { initComponentAdapter } from '@vben/saas/adapter/component';
import { initSetupVbenForm } from '@vben/saas/adapter/form';
import { initializeEffectiveLanguage, setupI18n } from '@vben/saas/locales';
import { setupDynamicPageTitle } from '@vben/saas/page-title';
import App from './app.vue';
import { router } from './router';
import { APP_NOT_FOUND_PATH, stripOrgPathPrefix } from './router/org-scope';

let vxeTableInitPromise: Promise<void> | undefined;

function ensureVxeTable() {
  vxeTableInitPromise ??= import('@vben/saas/adapter/vxe-table').then(({ initVxeTable }) => {
    initVxeTable();
  });
  return vxeTableInitPromise;
}

function needsVxeTable(path: string) {
  const canonicalPath = stripOrgPathPrefix(path);
  return (
    canonicalPath !== '/' &&
    canonicalPath !== APP_NOT_FOUND_PATH &&
    !canonicalPath.startsWith('/auth') &&
    !canonicalPath.startsWith('/init') &&
    !canonicalPath.startsWith('/no-module')
  );
}

function setupVxeTableRouteInit() {
  const accessStore = useAccessStore();
  router.beforeResolve(async (to) => {
    if (!accessStore.accessToken || !needsVxeTable(to.path)) return true;
    await ensureVxeTable();
    return true;
  });
}

async function bootstrap(namespace: string) {
  // 初始化组件适配器
  await initComponentAdapter();

  // 初始化表单组件
  await initSetupVbenForm();

  // // 设置弹窗的默认配置
  // setDefaultModalProps({
  //   fullscreenButton: false,
  // });
  // // 设置抽屉的默认配置
  // setDefaultDrawerProps({
  //   // zIndex: 2000,
  // });

  const app = createApp(App);

  // 注册v-loading指令
  registerLoadingDirective(app, {
    loading: 'loading', // 在这里可以自定义指令名称,也可以明确提供false表示不注册这个指令
    spinning: 'spinning',
  });

  // 国际化 i18n 配置
  await setupI18n(app);

  // 配置 pinia-tore
  await initStores(app, { namespace });
  await initializeEffectiveLanguage();

  // 安装权限指令
  registerAccessDirective(app);

  // 初始化 tippy
  const { initTippy } = await import('@vben/common-ui/es/tippy');
  initTippy(app);

  // 表格渲染器只在已登录业务路由前初始化，避免登录首屏拉起 VXE / ACE。
  setupVxeTableRouteInit();

  // 配置路由及路由守卫
  app.use(router);

  // 配置Motion插件
  const { MotionPlugin } = await import('@vben/plugins/motion');
  app.use(MotionPlugin);

  // 动态更新标题：口径统一收敛在 @vben/saas/page-title，品牌名与登录页同源
  setupDynamicPageTitle(router);

  app.mount('#app');
}

export { bootstrap };
