import type { RouteRecordNormalized } from 'vue-router';

import { useRouter } from 'vue-router';

import { isHttpUrl, openWindowInCurrentTab } from '@vben/utils';

function useNavigation() {
  const router = useRouter();
  const routeMetaMap = new Map<string, RouteRecordNormalized>();

  // 初始化路由映射
  const initRouteMetaMap = () => {
    const routes = router.getRoutes();
    routes.forEach((route) => {
      routeMetaMap.set(route.path, route);
    });
  };

  initRouteMetaMap();

  // 监听路由变化
  router.afterEach(() => {
    initRouteMetaMap();
  });

  // 检查是否应该在新窗口打开
  const shouldOpenInNewWindow = (path: string): boolean => {
    if (isHttpUrl(path)) {
      return true;
    }
    const route = routeMetaMap.get(path);
    // 外链会离开当前 SPA，内部路由仍按当前标签页内导航处理
    return typeof route?.meta?.link === 'string' && route.meta.link.length > 0;
  };

  const navigation = async (path: string) => {
    try {
      const route = routeMetaMap.get(path);
      const { query = {}, link } = route?.meta ?? {};

      // 检查是否有外链
      if (link && typeof link === 'string') {
        openWindowInCurrentTab(link);
        return;
      }

      if (isHttpUrl(path)) {
        openWindowInCurrentTab(path);
      } else {
        await router.push({
          path,
          query,
        });
      }
    } catch (error) {
      console.error('Navigation failed:', error);
      throw error;
    }
  };

  const willOpenedByWindow = (path: string) => {
    return shouldOpenInNewWindow(path);
  };

  return { navigation, willOpenedByWindow };
}

export { useNavigation };
