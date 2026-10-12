/**
 * SaaS 通用常量配置
 */

/**
 * Cookie key for organization/tenant ID
 * 用于在多个 SaaS 应用间共享当前组织/租户信息
 */
export const ORG_ID_KEY = 'org-id';

/**
 * Cookie key for access token
 * 用于在多个 SaaS 应用间共享当前访问令牌信息
 */
export const ACCESS_TOKEN_KEY = 'accessToken';

/**
 * Cookie key for current project ID
 * 用于记录用户选中的项目，跨刷新持久化
 */
export const PROJECT_ID_KEY = 'project-id';

/**
 * 默认租户编码
 */
export const DEFAULT_TENANT_CODE = 'default';

/**
 * 开发环境应用主机映射
 * 用于在开发环境时，根据应用URL关键字映射到开发环境主机
 */
/**
 * 「我的应用」列表等场景需排除的控制台大厅应用 ID（与 console 大厅约定一致）
 */
export const APP_LIST_EXCLUDE_APP_ID = '77';

export const APPS_DEV_HOST_MAP = [
  {
    appUrlKey: '/app/org-iot-client/',
    appDevHost: 'http://localhost:3006',
  },
  {
    appUrlKey: '/app/org-structure-monitor/',
    appDevHost: 'http://localhost:3009',
  },
  {
    appUrlKey: '/app/iot/',
    appDevHost: 'http://localhost:3003',
  },
  {
    appUrlKey: '/app/org-manage/',
    appDevHost: 'http://localhost:3004',
  },
  {
    appUrlKey: '/app/org-mall/',
    appDevHost: 'http://localhost:3005',
  },
  {
    appUrlKey: '/app/iot/',
    appDevHost: 'http://localhost:3003',
  },
  {
    appUrlKey: '/app/iot/',
    appDevHost: 'http://localhost:3003',
  },
  {
    appUrlKey: '/app/platform-manage/',
    appDevHost: 'http://localhost:3002',
  },
  {
    appUrlKey: '/app/console/',
    appDevHost: 'http://localhost:3001',
  },
  {
    appUrlKey: '/app/org-smartbuilding/',
    appDevHost: 'http://localhost:3009',
  },
  {
    appUrlKey: '/app/saas-road-detection/',
    appDevHost: 'http://localhost:3010',
  },
  {
    appUrlKey: '/app/login/',
    appDevHost: 'http://localhost:3000',
  },
];
