import type { Router } from 'vue-router';

import { PageEnum } from '@/enums/pageEnum';

export function createRouterGuards(router: Router) {
  // 前置
  router.beforeEach(async (to, from, next) => {
    // http://localhost:3000/#/chart/preview/792622755697790976?t=123
    // 把外部动态参数放入window.route.params，后续API动态接口可以用window.route?.params?.t来拼接参数
    // @ts-ignore GoView uses window.route for dynamic API parameter passing
    window.route = { params: { ...to.query } };

    const Loading = window.$loading;
    Loading && Loading.start();
    const isErrorPage = router.getRoutes().findIndex((item) => item.name === to.name);
    if (isErrorPage === -1) {
      return next({ name: PageEnum.ERROR_PAGE_NAME_404 });
    }

    // GoView 作为子应用嵌入宿主应用，宿主已处理认证，跳过独立登录检查
    next();
  });

  router.afterEach((to, _from, _failure) => {
    const Loading = window.$loading;
    document.title = (to?.meta?.title as string) || document.title;
    Loading && Loading.finish();
  });

  // 错误
  router.onError((error) => {
    console.warn('[GoView] 路由错误:', error);
  });
}
