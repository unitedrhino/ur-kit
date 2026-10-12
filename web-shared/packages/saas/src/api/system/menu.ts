import type { Recordable } from '@vben/types';

import { CoreApi } from '@vben/api';

export namespace SystemMenuApi {
  /** 徽标颜色集合 */
  export const BadgeVariants = ['default', 'destructive', 'primary', 'success', 'warning'] as const;
  /** 徽标类型集合 */
  export const BadgeTypes = ['dot', 'normal'] as const;
  /** 菜单类型集合 */
  export const MenuTypes = ['catalog', 'menu', 'embedded', 'link', 'button'] as const;
  /** 系统菜单 */
  export interface SystemMenu {
    [key: string]: any;
    /** 后端权限标识 */
    authCode: string;
    /** 子级 */
    children?: SystemMenu[];
    /** 组件 */
    component?: string;
    /** 菜单ID */
    id: string;
    /** 菜单元数据 */
    meta?: {
      /** 激活时显示的图标 */
      activeIcon?: string;
      /** 作为路由时，需要激活的菜单的Path */
      activePath?: string;
      /** 固定在标签栏 */
      affixTab?: boolean;
      /** 在标签栏固定的顺序 */
      affixTabOrder?: number;
      /** 徽标内容(当徽标类型为normal时有效) */
      badge?: string;
      /** 徽标类型 */
      badgeType?: (typeof BadgeTypes)[number];
      /** 徽标颜色 */
      badgeVariants?: (typeof BadgeVariants)[number];
      /** 在菜单中隐藏下级 */
      hideChildrenInMenu?: boolean;
      /** 在面包屑中隐藏 */
      hideInBreadcrumb?: boolean;
      /** 在菜单中隐藏 */
      hideInMenu?: boolean;
      /** 在标签栏中隐藏 */
      hideInTab?: boolean;
      /** 菜单图标 */
      icon?: string;
      /** 内嵌Iframe的URL */
      iframeSrc?: string;
      /** 是否缓存页面 */
      keepAlive?: boolean;
      /** 外链页面的URL */
      link?: string;
      /** 同一个路由最大打开的标签数 */
      maxNumOfOpenTab?: number;
      /** 无需基础布局 */
      noBasicLayout?: boolean;
      /** 是否在新窗口打开 */
      openInNewWindow?: boolean;
      /** 菜单排序 */
      order?: number;
      /** 额外的路由参数 */
      query?: Recordable<any>;
      /** 菜单标题 */
      title?: string;
    };
    /** 菜单名称 */
    name: string;
    /** 路由路径 */
    path: string;
    /** 父级ID */
    pid: string;
    /** 重定向 */
    redirect?: string;
    /** 菜单类型 */
    type: (typeof MenuTypes)[number];

    /** 模块信息 */
    moduleInfo?: CoreApi.MenuInfo;
  }
}

/**
 * 获取菜单数据列表
 */
async function getMenuList() {
  // 获取菜单列表

  // 获取用户模块列表
  // const res_module = await CoreApi.postApiV1SystemAppMenuGetList({
  //   // withMenus: true,
  // });
  // console.log('res_module 获取用户模块列表 ===================== ', res_module);

  // 过滤 subType 为 1087
  // const module_list = res_module?.list?.filter((item: any) => item.subType === 1087);

  // // console.log('module_list 过滤 subType 为 1087 ===================== ', module_list);

  // const new_menu_list: SystemMenuApi.SystemMenu[] = module_list?.map((module) => {
  //   const moduleType = JSON.parse(module?.body || '{}')?.newVersionSubType || 'menu';
  //   return {
  //     authCode: '',
  //     id: module?.id?.toString() || '',
  //     name: module?.name || '',
  //     path: module?.path || '',
  //     pid: '0',
  //     type: moduleType,
  //     moduleInfo: module as unknown as CoreApi.ModuleInfo,
  //     // component: ["embedded",'link'].includes(moduleType)
  //     //   ? "" : (module?.desc || ""),
  //     meta: {
  //       title: module?.name || '',
  //       icon: JSON.parse(module?.body || '{}')?.carbonIcon || '',
  //       iframeSrc: ['embedded', 'link'].includes(moduleType) ? getDevPath(module?.code || '', module?.url || '') : '',
  //     },
  //     children:
  //       module?.menus?.map((menu) => {
  //         const menuType = JSON.parse(menu?.body || '{}')?.newVersionSubType || 'menu';
  //         // console.log('menu 菜单信息 ===================== ', menu);
  //         // console.log('menu 菜单信息 body ===================== ', JSON.parse(menu?.body || '{}'));
  //         return {
  //           authCode: '',
  //           id: menu?.id?.toString() || '',
  //           name: menu?.name || '',
  //           path: menu?.path || '',
  //           pid: menu?.parentID?.toString() || '',
  //           type: menuType,
  //           component: !['embedded', 'link'].includes(menuType) && !menu?.children ? menu?.component || '' : '',
  //           meta: {
  //             title: menu?.name || '',
  //             icon: JSON.parse(menu?.body || '{}')?.carbonIcon || '',
  //             iframeSrc: ['embedded', 'link'].includes(menuType) ? getDevPath(module?.code || '', menu?.component || '') : '',
  //             hideInMenu: JSON.parse(menu?.body || '{}')?.meta?.hideInMenu === 1 ? true : false,
  //             hideInBreadcrumb: JSON.parse(menu?.body || '{}')?.hideInBreadcrumb === 1 ? true : false,
  //             hideInTab: JSON.parse(menu?.body || '{}')?.hideInTab === 1 ? true : false,
  //             // noBasicLayout: true,
  //           },
  //           children:
  //             menu?.children?.map((child) => {
  //               const childType = JSON.parse(child?.body || '{}')?.newVersionSubType || 'menu';
  //               return {
  //                 authCode: '',
  //                 id: child?.id?.toString() || '',
  //                 name: child?.name || '',
  //                 path: child?.path || '',
  //                 pid: child?.parentID?.toString() || '',
  //                 type: childType,
  //                 component: ['embedded', 'link'].includes(childType) ? '' : child?.component || '',
  //                 meta: {
  //                   title: child?.name || '',
  //                   icon: JSON.parse(child?.body || '{}')?.carbonIcon || '',
  //                   iframeSrc: ['embedded', 'link'].includes(childType) ? getDevPath(module?.code || '', child?.component || '') : '',
  //                   hideInMenu: JSON.parse(child?.body || '{}')?.meta?.hideInMenu === 1 ? true : false,
  //                   hideInBreadcrumb: JSON.parse(child?.body || '{}')?.hideInBreadcrumb === 1 ? true : false,
  //                   hideInTab: JSON.parse(child?.body || '{}')?.hideInTab === 1 ? true : false,
  //                   // noBasicLayout: true,
  //                 },
  //               };
  //             }) || [],
  //         };
  //       }) || [],
  //   };
  // });

  // // console.log('new_menu_list 获取菜单列表 888888 ===================== ', new_menu_list);

  // if (!new_menu_list) {
  //   return [];
  // }
  // return [...new_menu_list];
  return [];
}

async function isMenuNameExists(_name: string, _id?: SystemMenuApi.SystemMenu['id']) {
  // return requestClient.get<boolean>('/system/menu/name-exists', {
  //   params: { id, name },
  // });
  return false;
}

async function isMenuPathExists(_path: string, _id?: SystemMenuApi.SystemMenu['id']) {
  // return requestClient.get<boolean>('/system/menu/path-exists', {
  //   params: { id, path },
  // });
  return false;
}

/**
 * 创建菜单
 * @param data 菜单数据
 */
async function createMenu(_data: Omit<SystemMenuApi.SystemMenu, 'children' | 'id'>) {
  // console.log('createMenu data =====================', data);

  await binModuleInit();

  try {
    // await CoreApi.postApiV1SystemModuleMenuCreate({
    //   moduleCode: 'bin',
    //   type: 1087, // 新版菜单类型 统一   # 1087
    //   body: JSON.stringify(data), // body存表单所有信息 需要转换成json字符串

    //   name: crypto.randomUUID(),
    //   path: crypto.randomUUID(),
    // });
    // console.log('createMenu res =====================', res);
  } catch (error) {
    // console.log('createMenu error =====================', error);
  }

  return false;
}

/**
 * 更新菜单
 *
 * @param id 菜单 ID
 * @param data 菜单数据
 */
async function updateMenu(_id: string, _data: Omit<SystemMenuApi.SystemMenu, 'children' | 'id'>) {
  // console.log('updateMenu data ===================== ', data);

  // try {
  //   await CoreApi.postApiV1SystemModuleMenuUpdate({
  //     moduleCode: 'bin',
  //     type: 1087,
  //     id: Number(id),
  //     body: JSON.stringify(data),
  //   });
  // } catch {
  //   // console.log('updateMenu error ===================== ', error);
  // }

  return false;
}

/**
 * 删除菜单
 * @param id 菜单 ID
 */
async function deleteMenu(_id: string) {
  try {
    // 删除租户应用菜单
    // /api/v1/system/tenant/app/menu/delete
    // await CoreApi.postApiV1SystemTenantAppMenuDelete({
    //   id: Number(id),
    //   appCode: 'core',
    //   code: 'bin',
    // });
    // await CoreApi.postApiV1SystemModuleMenuDelete({
    //   id: Number(id),
    // });
  } catch {}

  return false;
}

async function binModuleInit() {
  // 获取模块详情
  // try {
  //   const res = await CoreApi.postApiV1SystemModuleInfoRead({
  //     code: 'bin',
  //   });
  //   return res;
  // } catch {
  //   // 创建模块
  //   await CoreApi.postApiV1SystemModuleInfoCreate({
  //     code: 'bin',
  //     type: 1087,
  //   });
  //   return null;
  // }
}

export { createMenu, deleteMenu, getMenuList, isMenuNameExists, isMenuPathExists, updateMenu };
