import { initPreferences } from '@vben/preferences';
import { logAppBuildInfo } from '@vben/saas/app-info';
import { buildSharedAppNamespace } from '@vben/stores';
import { unmountGlobalLoading } from '@vben/utils';

import { overridesPreferences } from './preferences';

/**
 * 应用初始化完成之后再进行页面加载渲染
 */
async function initApplication() {
  // 应用刷新时打印应用名称与编译时间，便于排查当前运行的构建版本
  logAppBuildInfo();
  // name用于指定项目唯一标识
  // 用于区分不同项目的偏好设置以及存储数据的key前缀以及其他一些需要隔离的数据
  const env = import.meta.env.PROD ? 'prod' : 'dev';
  const appVersion = import.meta.env.VITE_APP_VERSION;
  const namespace = buildSharedAppNamespace({
    appName: import.meta.env.VITE_GLOB_APPNAME,
    appVersion,
    env,
    namespace: import.meta.env.VITE_APP_NAMESPACE,
  });

  // app偏好设置初始化
  await initPreferences({
    namespace,
    overrides: overridesPreferences,
  });

  // 启动应用并挂载
  // vue应用主要逻辑及视图
  const { bootstrap } = await import('./bootstrap');
  await bootstrap(namespace);

  // 移除并销毁loading
  unmountGlobalLoading();
}

initApplication();
