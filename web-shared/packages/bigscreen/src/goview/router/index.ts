import type { App } from 'vue'
import { createMemoryHistory, createRouter, type RouteRecordRaw } from 'vue-router'
import { RedirectRoute } from '@/router/base'
import { createRouterGuards } from './router-guards'
import { PageEnum } from '@/enums/pageEnum'
import { HttpErrorPage, LoginRoute, ReloadRoute } from '@/router/base'
import { Layout } from '@/router/constant'

import modules from '@/router/modules'

const RootRoute: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Root',
    redirect: PageEnum.BASE_HOME,
    component: Layout,
    meta: {
      title: 'Root',
    },
    children: [
      ...HttpErrorPage,
      modules.projectRoutes,
      modules.chartRoutes,
      modules.editRoutes
    ]
  }
]


export const constantRouter: any[] = [LoginRoute, ...RootRoute, modules.previewRoutes, RedirectRoute, ReloadRoute];

const router = createRouter({
  history: createMemoryHistory(''),
  routes: constantRouter,
  strict: true,
})

export function setupRouter(app: App) {
  app.use(router);
  // 创建路由守卫
  createRouterGuards(router)
}
export default router
