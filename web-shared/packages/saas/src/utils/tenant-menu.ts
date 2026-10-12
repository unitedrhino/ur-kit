import type { MenuRecordRaw } from '@vben/types';

import { CoreApi } from '@vben/api';

import { presetMenuI18n } from './preset-menu-i18n';

/** 系统菜单示例使用路径与原始名称共同识别，避免覆盖同路径的用户自定义名称。 */
const systemMenuKeys: Record<string, { source: string; key: string }> = {
  '/iot/product': { source: '产品管理', key: 'systemLanguage.menuIotProduct' },
};

/**
 * 拉取租户菜单并构建 routePath → TenantMenu 的扁平 Map
 * 失败时返回空 Map，fallback 到静态菜单不影响现有功能
 * @deprecated 使用 fetchUserMenuMap 代替，后者调用用户自身菜单接口（含角色过滤）
 */
export async function fetchTenantMenuMap(appId: number | string): Promise<Map<string, CoreApi.TenantMenu>> {
  try {
    const res = await CoreApi.postApiV1SystemTenantAppMenuGetList({
      appID: String(appId),
      isRetTree: false,
    });
    const map = new Map<string, CoreApi.TenantMenu>();
    for (const item of res?.list ?? []) {
      const path = item.menu?.path;
      // 同 path 先到先得：组与其 index 子菜单可能共用 path（如 /park/merchant），
      // 服务端按 parent_menu_id ASC 排序保证组在前，避免子菜单覆盖组导致组名/排序被污染
      if (path && !map.has(path)) map.set(path, item);
    }
    return map;
  } catch {
    return new Map();
  }
}

/**
 * 调用 /api/v1/system/user/self/menu/get-list 获取当前用户可访问菜单
 * 传入 appId 时只返回当前应用的菜单，避免不同应用同路径菜单互相覆盖。
 * 已按角色权限过滤，包含租户自定义（name/icon/sort/isHideInMenu）
 * 构建 routePath → TenantMenu 的扁平 Map
 */
export async function fetchUserMenuMap(appId?: number | string): Promise<Map<string, CoreApi.TenantMenu>> {
  try {
    const res = await CoreApi.postApiV1SystemUserSelfMenuGetList(appId ? { appID: String(appId) } : {});
    const map = new Map<string, CoreApi.TenantMenu>();
    function flatten(items: CoreApi.TenantMenu[]) {
      for (const item of items) {
        const path = item.menu?.path;
        // 同 path 先到先得（树结构组先于子菜单遍历），避免子菜单覆盖组
        if (path && !map.has(path)) map.set(path, item);
        if (item.children?.length) flatten(item.children as CoreApi.TenantMenu[]);
      }
    }
    flatten(res?.list ?? []);
    return map;
  } catch {
    return new Map();
  }
}

export interface ApplyTenantMenuOverridesOptions {
  /**
   * 不在租户菜单中的静态路由默认会被移除；
   * 若某些页面已在前端静态路由中定义但后端菜单种子尚未下发，
   * 可在此传入需要保留下来的 path 列表（含祖先路径会自动保留）。
   */
  preservePaths?: string[];
}

/**
 * 将租户菜单定制（name/icon/sort/isHideInMenu）递归应用到已生成的 MenuRecordRaw 树
 * - name：覆盖菜单显示名称（优先租户自定义，fallback 到 menu.defaultName）
 * - icon：覆盖菜单图标（优先租户自定义，fallback 到 menu.defaultIcon）
 * - sort：覆盖排序权重（对应 MenuRecordRaw.order）
 * - isHideInMenu=1：隐藏菜单，isHideInMenu=2：显示菜单
 */
export function applyTenantMenuOverrides(
  menus: MenuRecordRaw[],
  tenantMenuMap: Map<string, CoreApi.TenantMenu>,
  options: ApplyTenantMenuOverridesOptions = {},
): MenuRecordRaw[] {
  const preserveSet = new Set(options.preservePaths ?? []);
  const result = menus.map((menu) => {
    const tm = tenantMenuMap.get(menu.path);
    const patched: MenuRecordRaw = { ...menu };

    if (tm) {
      const effectiveName = tm.name || tm.menu?.defaultName;
      if (effectiveName) {
        // 预置菜单多语言：仅当租户名与种子默认名一致（未被人工改写）时改用翻译键渲染；
        // 企业自行改名的菜单保持原文。systemMenuKeys 为早期示例，presetMenuI18n 为全量映射。
        // 预置菜单多语言：同 path 下按种子默认名匹配对应翻译键（跨应用同 path 名不同）；
        // 组织作用域应用的菜单树带 /{orgCode} 前缀，直查未命中时去首段回退到规范路径
        const legacy = systemMenuKeys[menu.path];
        let entries = presetMenuI18n[menu.path];
        if (!legacy && !entries && menu.path.includes('/', 1)) {
          entries = presetMenuI18n[menu.path.replace(/^\/[^/]+/, '')];
        }
        const hit = legacy
          ? (effectiveName === legacy.source && tm.menu?.defaultName === legacy.source ? legacy.key : undefined)
          : entries?.find((item) => item.source === effectiveName && item.source === tm.menu?.defaultName)?.key;
        patched.name = hit ?? effectiveName;
      }
      const effectiveIcon = tm.icon || tm.menu?.defaultIcon;
      if (effectiveIcon) patched.icon = effectiveIcon;
      const effectiveSort = tm.sort ?? tm.menu?.defaultSort;
      if (effectiveSort !== undefined && effectiveSort !== null) patched.order = effectiveSort;
      const effectiveHide = tm.isHideInMenu ?? tm.menu?.defaultIsHideInMenu;
      if (effectiveHide !== undefined) patched.show = effectiveHide !== 1;
    }

    if (menu.children?.length) {
      patched.children = applyTenantMenuOverrides(menu.children, tenantMenuMap, options);
    }

    return patched;
  });

  const visibleMenus = result.filter((menu) => {
    if (menu.show === false) return false;
    // 用户菜单接口已经按权限过滤；若当前菜单不在用户菜单中，且也没有保留下来的子菜单，则直接移除。
    if (tenantMenuMap.has(menu.path)) return true;
    // 保留显式声明的静态路由（用于后端菜单种子尚未下发的新页面）
    if (preserveSet.has(menu.path)) return true;
    return !!menu.children?.length;
  });

  // 按新 order 重新排序（小→前，未设置排最后）
  return visibleMenus.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}
