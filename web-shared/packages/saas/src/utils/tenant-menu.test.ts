import { describe, expect, it, vi, beforeEach } from 'vitest';

import { applyTenantMenuOverrides, fetchTenantMenuMap, fetchUserMenuMap } from './tenant-menu';

// mock @vben/api 的两个菜单接口，避免网络依赖
vi.mock('@vben/api', () => ({
  CoreApi: {
    postApiV1SystemTenantAppMenuGetList: vi.fn(),
    postApiV1SystemUserSelfMenuGetList: vi.fn(),
  },
}));

import { CoreApi } from '@vben/api';

const mockedTenantMenu = vi.mocked(CoreApi.postApiV1SystemTenantAppMenuGetList);
const mockedUserMenu = vi.mocked(CoreApi.postApiV1SystemUserSelfMenuGetList);

beforeEach(() => {
  mockedTenantMenu.mockReset();
  mockedUserMenu.mockReset();
});

describe('fetchTenantMenuMap / fetchUserMenuMap', () => {
  it('构建 routePath → TenantMenu 扁平 Map 且同 path 先到先得', async () => {
    mockedTenantMenu.mockResolvedValue({
      list: [
        { menu: { path: '/park/merchant', defaultName: '商户组' } },
        { menu: { path: '/park/merchant', defaultName: '商户列表' } },
        { menu: { path: '/park/alarm', defaultName: '告警' } },
      ],
    } as any);

    const map = await fetchTenantMenuMap(1500);
    expect(map.size).toBe(2);
    // 同 path 组先于子菜单，先到先得
    expect(map.get('/park/merchant')?.menu?.defaultName).toBe('商户组');
    expect(map.get('/park/alarm')?.menu?.defaultName).toBe('告警');
    expect(mockedTenantMenu).toHaveBeenCalledWith({ appID: '1500', isRetTree: false });
  });

  it('fetchUserMenuMap 递归展开树结构并透传 appId', async () => {
    mockedUserMenu.mockResolvedValue({
      list: [
        {
          menu: { path: '/system', defaultName: '系统' },
          children: [
            { menu: { path: '/system/user', defaultName: '用户' } },
            { menu: { path: '/system', defaultName: '重复不覆盖' } },
          ],
        },
      ],
    } as any);

    const map = await fetchUserMenuMap(600);
    expect(map.size).toBe(2);
    expect(map.get('/system/user')?.menu?.defaultName).toBe('用户');
    expect(map.get('/system')?.menu?.defaultName).toBe('系统');
    expect(mockedUserMenu).toHaveBeenCalledWith({ appID: '600' });
  });

  it('接口失败时返回空 Map（fallback 到静态菜单）', async () => {
    mockedUserMenu.mockRejectedValue(new Error('network'));
    const map = await fetchUserMenuMap();
    expect(map.size).toBe(0);
    expect(mockedUserMenu).toHaveBeenCalledWith({});
  });
});

describe('applyTenantMenuOverrides', () => {
  const baseMenu = (overrides: Partial<any> = {}) => ({
    path: '/dashboard',
    name: '概要',
    icon: 'mdi:view-dashboard',
    order: 5,
    show: true,
    ...overrides,
  });

  it('应用租户定制：name/icon/sort/isHideInMenu，租户值优先、menu 默认值兜底', () => {
    const tenantMenuMap = new Map([
      [
        '/dashboard',
        {
          name: '驾驶舱',
          isHideInMenu: 2,
          menu: { defaultName: '默认名', defaultIcon: 'mdi:default', defaultSort: 9, defaultIsHideInMenu: 2 },
        },
      ] as any,
    ]);
    const result = applyTenantMenuOverrides([baseMenu()], tenantMenuMap);
    expect(result[0]).toMatchObject({ name: '驾驶舱', order: 9, show: true });
    // 租户未定制 icon 时 fallback 到 menu.defaultIcon
    const tenantMenuMapIcon = new Map([['/dashboard', { menu: { defaultIcon: 'mdi:from-seed' } } as any]]);
    expect(applyTenantMenuOverrides([baseMenu()], tenantMenuMapIcon)[0].icon).toBe('mdi:from-seed');
  });

  it('isHideInMenu=1 隐藏菜单：从结果中移除', () => {
    const tenantMenuMap = new Map([['/dashboard', { isHideInMenu: 1 } as any]]);
    const result = applyTenantMenuOverrides([baseMenu()], tenantMenuMap);
    expect(result).toHaveLength(0);
  });

  it('不在租户菜单中的静态路由默认移除，preservePaths 可保留', () => {
    const menus = [baseMenu({ path: '/new-page' }), baseMenu({ path: '/keep-page' })];
    const result = applyTenantMenuOverrides(menus, new Map(), { preservePaths: ['/keep-page'] });
    expect(result.map((m) => m.path)).toEqual(['/keep-page']);
  });

  it('有可见子菜单的父级保留，且子菜单定制递归生效', () => {
    const parent = baseMenu({
      path: '/system',
      children: [baseMenu({ path: '/system/user', name: '用户' })],
    });
    const tenantMenuMap = new Map([['/system/user', { name: '成员管理', sort: 1 } as any]]);
    const result = applyTenantMenuOverrides([parent], tenantMenuMap);

    expect(result).toHaveLength(1);
    expect(result[0].children?.[0]).toMatchObject({ path: '/system/user', name: '成员管理', order: 1 });
  });

  it('按 order 升序排序，未设置 order 的排最后', () => {
    const menus = [
      baseMenu({ path: '/a', order: 5 }),
      baseMenu({ path: '/b' }),
      baseMenu({ path: '/c', order: 1 }),
    ];
    const result = applyTenantMenuOverrides(menus, new Map([['/a', {} as any], ['/c', {} as any]]));
    // /b 不在租户菜单中应被移除；剩下按 order 排序
    expect(result.map((m) => m.path)).toEqual(['/c', '/a']);
  });
});
