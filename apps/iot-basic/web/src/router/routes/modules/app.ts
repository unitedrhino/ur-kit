import type { RouteRecordRaw } from 'vue-router';


const routes: RouteRecordRaw[] = [
  {
    name: 'OrgSystemManageIndex',
    path: '/index',
    redirect: '/dashboard',
    meta: {
      title: '',
      noBasicLayout: true,
      hideInMenu: true,
      hideInBreadcrumb: true,
      hideInTab: true,
    },
  },
  {
    name: 'OrgIotClientDashboard',
    path: '/dashboard',
    component: () => import('#/views/dashboard/index.vue'),
    meta: {
      title: 'orgIotClient.routes.overview',
      icon: 'mdi:view-dashboard-outline',
      order: 0,
    },
  },
  {
    name: 'OrgEnergyDeviceSpace',
    path: '/device-space',
    meta: {
      title: 'orgIotClient.routes.deviceSpace',
      icon: 'mdi:devices',
      order: 1,
    },
    children: [
      {
        name: 'OrgEnergyDeviceSpaceConsole',
        path: '/device-space/console',
        component: () => import('#/views/energy/device-space/console/index.vue'),
        meta: {
          title: 'orgIotClient.routes.console',
          icon: 'mdi:console',
        },
      },
      {
        name: 'OrgEnergyDeviceSpaceDeviceLogs',
        path: '/device-space/device-logs/:productID/:deviceName',
        component: () => import('#/views/energy/device-space/device-logs/index.vue'),
        meta: {
          title: 'orgIotClient.routes.deviceLogs',
          icon: 'mdi:file-document-outline',
          hideInMenu: true,
          activePath: '/device-space/console',
        },
      },
      {
        name: 'OrgEnergyDeviceSpaceDeviceInfo',
        path: '/device-space/device-info/:productID/:deviceName',
        component: () => import('#/views/energy/device-space/device-info/index.vue'),
        meta: {
          title: 'iotApp.routes.deviceInfo',
          icon: 'mdi:information-outline',
          hideInMenu: true,
          activePath: '/device-space/console',
        },
      },
      {
        name: 'OrgEnergyDeviceSpaceDeviceGroup',
        path: '/device-space/device-group',
        component: () => import('#/views/energy/device-space/device-group/index.vue'),
        meta: {
          title: 'orgIotClient.routes.deviceGroup',
          icon: 'mdi:group',
        },
      },
      {
        name: 'OrgEnergyDeviceSpaceAreaManage',
        path: '/device-space/area-manage',
        component: () => import('#/views/energy/device-space/area-manage/index.vue'),
        meta: {
          title: 'iotApp.routes.areaManage',
          icon: 'mdi:map-marker-radius',
        },
      },
    ],
  },
  {
    name: 'OrgEnergyDeviceMap',
    path: '/device-map',
    component: () => import('#/views/energy/device-map/index.vue'),
    meta: {
      title: 'iotApp.routes.deviceMap',
      icon: 'mdi:map-marker-path',
      order: 2,
    },
  },
  {
    name: 'OrgEnergySceneLinkage',
    path: '/scene-linkage',
    redirect: '/scene-linkage/auto-scene',
    meta: {
      title: 'orgIotClient.routes.sceneLinkage',
      icon: 'mdi:link-variant',
      order: 3,
    },
    children: [
      {
        name: 'OrgEnergySceneLinkageAutoScene',
        path: '/scene-linkage/auto-scene',
        component: () => import('#/views/energy/scene-linkage/index.vue'),
        props: {
          sceneLabel: 'orgIotClient.routes.automation',
          sceneType: 'auto',
        },
        meta: {
          title: 'orgIotClient.routes.automation',
          icon: 'mdi:robot-outline',
        },
      },
      {
        name: 'OrgEnergySceneLinkageOneScene',
        path: '/scene-linkage/one-scene',
        component: () => import('#/views/energy/scene-linkage/index.vue'),
        props: {
          sceneLabel: 'orgIotClient.routes.oneClickScene',
          sceneType: 'manual',
        },
        meta: {
          title: 'orgIotClient.routes.oneClickScene',
          icon: 'mdi:gesture-tap-button',
        },
      },
      {
        name: 'OrgEnergySceneLinkageCreateV2',
        path: '/scene-linkage/create-v2',
        component: () => import('#/views/energy/scene-linkage/editor.vue'),
        meta: {
          title: 'iotApp.routes.sceneEditorV2',
          hideInMenu: true,
          activePath: '/scene-linkage/auto-scene',
        },
      },
    ],
  },
  {
    name: 'OrgSystemManageSystemManage',
    path: '/system-manage',
    meta: {
      title: 'orgManage.menu.system',
      icon: 'mdi:cog',
      order: 5,
    },
    children: [
      {
        name: 'OrgSystemManageSceneLog',
        path: '/system-manage/scene-log',
        component: () => import('#/views/energy/system/scene-log/index.vue'),
        meta: {
          title: 'orgIotClient.routes.sceneLog',
          icon: 'mdi:text-box-outline',
        },
      },
      {
        name: 'OrgSystemManageUserManage',
        path: '/system-manage/user-manage',
        component: () => import('#/views/org-manage/system-manage/user-manage/index.vue'),
        meta: {
          title: 'orgIotClient.routes.userList',
          icon: 'mdi:account-group',
        },
      },
      {
        name: 'OrgSystemManagePermissionArea',
        path: '/system-manage/permission-area',
        component: () => import('#/views/energy/system/permission-area/index.vue'),
        meta: {
          title: 'orgIotClient.routes.permissionArea',
          icon: 'mdi:shield-key',
        },
      },
      {
        name: 'OrgSystemManageRoleManage',
        path: '/system-manage/role-manage',
        component: () => import('#/views/org-manage/system-manage/role-manage/index.vue'),
        meta: {
          title: 'orgManage.menu.role',
          icon: 'mdi:account-key',
          hideInMenu: true,
        },
      },
      {
        name: 'OrgSystemManageSystemConfiguration',
        path: '/system-manage/system-configuration',
        component: () => import('#/views/org-manage/system-manage/system-configuration/index.vue'),
        meta: {
          title: 'orgManage.systemConfig.title',
          icon: 'mdi:tune',
          hideInMenu: true,
        },
      },
    ],
  },
  {
    name: 'OrgSystemManageNotificationManage',
    path: '/notification-manage',
    meta: {
      title: 'orgManage.menu.notification',
      icon: 'mdi:bell-outline',
      hideInMenu: true,
    },
    children: [
      {
        name: 'OrgSystemManageNotificationMessageManage',
        path: '/notification-manage/message-manage',
        component: () => import('#/views/org-manage/notification-manage/message-manage/index.vue'),
        meta: {
          title: 'orgManage.menu.messageConfig',
          icon: 'mdi:message-outline',
        },
      },
      {
        name: 'OrgSystemManageNotificationTemplateManage',
        path: '/notification-manage/template-manage',
        component: () => import('#/views/org-manage/notification-manage/template-manage/index.vue'),
        meta: {
          title: 'orgManage.menu.templateConfig',
          icon: 'mdi:file-document-edit-outline',
        },
      },
      {
        name: 'OrgSystemManageNotificationSendManage',
        path: '/notification-manage/send-manage',
        component: () => import('#/views/org-manage/notification-manage/send-manage/index.vue'),
        meta: {
          title: 'orgManage.menu.inbox',
          icon: 'mdi:email-outline',
        },
      },
    ],
  },
  {
    name: 'OrgSystemManageLogManage',
    path: '/log-manage',
    meta: {
      title: 'orgManage.menu.logs',
      icon: 'mdi:file-document-outline',
      hideInMenu: true,
    },
    children: [
      {
        name: 'OrgSystemManageLogLoginManage',
        path: '/log-manage/login-manage',
        component: () => import('#/views/org-manage/log-manage/login-manage/index.vue'),
        meta: {
          title: 'orgIotClient.routes.loginLog',
          icon: 'mdi:login',
        },
      },
      {
        name: 'OrgSystemManageLogOperationManage',
        path: '/log-manage/operation-manage',
        component: () => import('#/views/org-manage/log-manage/operation-manage/index.vue'),
        meta: {
          title: 'orgManage.menu.operationLog',
          icon: 'mdi:history',
        },
      },
    ],
  },
];

export default routes;
