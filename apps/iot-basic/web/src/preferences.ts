import { defineOverridesPreferences } from '@vben/preferences';

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * !!! 更改配置后请清空缓存，否则可能不生效
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    name: import.meta.env.VITE_APP_TITLE,
    accessMode: 'frontend', // mixed: 混合模式, frontend: 前端模式, backend: 后端模式
    // defaultHomePath: '/workspace',
    enableCheckUpdates: true,
    checkUpdatesInterval: 1,
    layout: 'sidebar-nav',//
    defaultAvatar: '',
    // defaultHomePath: '/moduleHomePath',
    defaultHomePath: '/',
    enablePreferences: true,
  },
  sidebar: {
    // collapsed: true,
    // extraCollapse: true,
    collapsedShowTitle: true,
    expandOnHover: true,
    // autoActivateChild: true,
  },
  navigation:{
    accordion: false,
  },
  theme: {
    mode: 'auto',
  },
  copyright: {
    companyName: '',
    companySiteLink: '',
    date: '',
    enable: false,
  },
  logo: {
    source: '/default-logo.png',
    // enable: false,
  },
  tabbar: {
    enable: false,
    persist: false,
  },
  widget: {
    // sidebarToggle: false,
    // themeToggle:false,
    // notification:false,
    // lockScreen:false,
    languageToggle: true,
    // globalSearch:false,
    // fullscreen:false,
  },
});