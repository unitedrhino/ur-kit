import type { RouteRecordRaw } from 'vue-router';

export interface BigscreenRoutesOptions {
  basePath: string;
  namePrefix?: string;
}

export function createBigscreenRoutes(options: BigscreenRoutesOptions): RouteRecordRaw[] {
  const { basePath, namePrefix = 'BigScreen' } = options;

  const loadRouteViews = () => import('./route-views');
  const n = (name: string) => `${namePrefix}${name}`;
  const p = (sub: string) => `${basePath}${sub}`;
  const publishedMeta = {
    title: 'bigscreenRoutes.preview',
    hideInMenu: true,
    activePath: p('/screen'),
    fullPathKey: false,
    maxNumOfOpenTab: 1,
    noBasicLayout: true,
  };

  return [
    {
      name: n('Manage'),
      path: basePath,
      meta: { title: 'bigscreenRoutes.manage', icon: 'mdi:monitor-dashboard' },
      redirect: p('/screen'),
      children: [
        {
          name: n('Screen'),
          path: p('/screen'),
          meta: { title: 'bigscreenRoutes.projects' },
          component: () => loadRouteViews().then((views) => views.loadScreenView()),
        },
        {
          name: n('Component'),
          path: p('/component'),
          meta: { title: 'bigscreenRoutes.components' },
          component: () => loadRouteViews().then((views) => views.loadComponentView()),
        },
        {
          name: n('Template'),
          path: p('/template'),
          meta: { title: 'bigscreenRoutes.templates', authority: ['platform'] },
          component: () => loadRouteViews().then((views) => views.loadTemplateView()),
        },
        {
          name: n('Datasource'),
          path: p('/datasource'),
          meta: { title: 'bigscreenRoutes.dataSources' },
          component: () => loadRouteViews().then((views) => views.loadDatasourceView()),
        },
        {
          name: n('Dataset'),
          path: p('/dataset'),
          meta: { title: 'bigscreenRoutes.datasets' },
          component: () => loadRouteViews().then((views) => views.loadDatasetView()),
        },
        {
          name: n('Asset'),
          path: p('/asset'),
          meta: { title: 'bigscreenRoutes.assets' },
          component: () => loadRouteViews().then((views) => views.loadAssetView()),
        },
        {
          name: n('DatasetEdit'),
          path: p('/dataset/edit/:id?'),
          meta: {
            title: 'bigscreenRoutes.editDataset',
            hideInMenu: true,
            activePath: p('/dataset'),
            fullPathKey: false,
            maxNumOfOpenTab: 1,
          },
          component: () => loadRouteViews().then((views) => views.loadDatasetEditView()),
        },
        {
          name: n('Published'),
          path: p('/published/:id'),
          meta: publishedMeta,
          component: () => loadRouteViews().then((views) => views.loadPublishedView()),
        },
      ],
    },
    {
      name: n('Editor'),
      path: p('/editor/:id'),
      meta: {
        title: 'bigscreenRoutes.editScreen',
        hideInMenu: true,
        hideInTab: true,
        hideInBreadcrumb: true,
        activePath: p('/screen'),
        fullPathKey: false,
        maxNumOfOpenTab: 1,
        noBasicLayout: true,
      },
      component: () => loadRouteViews().then((views) => views.loadEditorView()),
    },
    {
      name: n('PreviewCompat'),
      path: '/preview/:id',
      meta: publishedMeta,
      component: () => loadRouteViews().then((views) => views.loadPublishedView()),
    },
    {
      name: n('ViewCompat'),
      path: '/view/:id',
      meta: publishedMeta,
      component: () => loadRouteViews().then((views) => views.loadPublishedView()),
    },
    {
      name: n('PublishedCompat'),
      path: '/published/:id',
      meta: publishedMeta,
      component: () => loadRouteViews().then((views) => views.loadPublishedView()),
    },
    {
      name: n('ComponentEditor'),
      path: p('/component-editor/:id'),
      meta: {
        title: 'bigscreenRoutes.editComponent',
        hideInMenu: true,
        activePath: p('/component'),
        fullPathKey: false,
        maxNumOfOpenTab: 1,
      },
      component: () => loadRouteViews().then((views) => views.loadEditorView()),
    },
  ];
}
