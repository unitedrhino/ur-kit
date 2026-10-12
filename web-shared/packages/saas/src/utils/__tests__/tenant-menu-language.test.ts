/** 文件说明：系统菜单示例按稳定路径使用翻译键，企业自定义名称保持原文。 */
import { describe, expect, it } from 'vitest';

import { applyTenantMenuOverrides } from '../tenant-menu';

const route = [{ name: '产品管理', path: '/iot/product' }];

describe('系统菜单展示名', () => {
  it('预置名称转换为可响应语言切换的翻译键', () => {
    const source = new Map<string, any>([['/iot/product', {
      name: '产品管理', menu: { path: '/iot/product', defaultName: '产品管理' },
    }]]);
    expect(applyTenantMenuOverrides(route, source)[0]?.name).toBe('systemLanguage.menuIotProduct');
  });

  it('同路径的自定义名称原样保留', () => {
    const source = new Map<string, any>([['/iot/product', {
      name: '我的产品', menu: { path: '/iot/product', defaultName: '产品管理' },
    }]]);
    expect(applyTenantMenuOverrides(route, source)[0]?.name).toBe('我的产品');
  });

  it('设备接入分组与接入中心的预置名称按路径转换', () => {
    const source = new Map<string, any>([
      ['/iot', { name: '设备接入', menu: { path: '/iot', defaultName: '设备接入' } }],
      ['/iot/guide', { name: '接入中心', menu: { path: '/iot/guide', defaultName: '接入中心' } }],
    ]);
    const menus = applyTenantMenuOverrides([{ name: '设备接入', path: '/iot', children: [{ name: '接入中心', path: '/iot/guide' }] }], source);
    expect(menus[0]?.name).toBe('iotApp.routes.deviceAccess');
    expect(menus[0]?.children?.[0]?.name).toBe('iotApp.routes.guide');
  });

  it('OTA 菜单旧名称与页面标题使用相应翻译键', () => {
    const source = new Map<string, any>([
      ['/iot/ota/firmware-list', { name: '固件管理', menu: { path: '/iot/ota/firmware-list', defaultName: '固件管理' } }],
      ['/iot/ota/module-list', { name: '模块管理', menu: { path: '/iot/ota/module-list', defaultName: '模块管理' } }],
    ]);
    const menus = applyTenantMenuOverrides([
      { name: '固件管理', path: '/iot/ota/firmware-list' },
      { name: '模块管理', path: '/iot/ota/module-list' },
    ], source);
    expect(menus.map((menu) => menu.name)).toEqual(['iotApp.ota.firmwareManageTitle', 'iotApp.ota.moduleManageTitle']);
  });

  it('能源中心分组与数据监控预置名称随语言显示，用户改名保持原值', () => {
    const route = [{ name: '能耗分析', path: '/energy/analysis' }, { name: '数据监控', path: '/energy/collection/data-monitoring' }];
    const preset = new Map<string, any>([
      ['/energy/analysis', { name: '能耗分析', menu: { defaultName: '能耗分析' } }],
      ['/energy/collection/data-monitoring', { name: '数据监控', menu: { defaultName: '数据监控' } }],
    ]);
    expect(applyTenantMenuOverrides(route, preset).map((menu) => menu.name)).toEqual([
      'orgEnergy.overview.analysis', 'orgEnergy.routes.dataMonitor',
    ]);
    preset.set('/energy/analysis', { name: '园区能耗', menu: { defaultName: '能耗分析' } });
    expect(applyTenantMenuOverrides(route, preset)[0]?.name).toBe('园区能耗');
  });

  it('商城商品列表预置菜单使用翻译键并保留自定义名称', () => {
    const route = [{ name: '商品列表', path: '/commodity-list' }];
    const preset = new Map<string, any>([['/commodity-list', { name: '商品列表', menu: { defaultName: '商品列表' } }]]);
    expect(applyTenantMenuOverrides(route, preset)[0]?.name).toBe('orgMall.goods.listTitle');
    const custom = new Map<string, any>([['/commodity-list', { name: '精选商品', menu: { defaultName: '商品列表' } }]]);
    expect(applyTenantMenuOverrides(route, custom)[0]?.name).toBe('精选商品');
  });

  it('商城概况和分销子菜单使用各自翻译键', () => {
    const source = new Map<string, any>([
      ['/survey', { name: '营业概况', menu: { defaultName: '营业概况' } }],
      ['/distribution-manage', { name: '分销管理', menu: { defaultName: '分销管理' } }],
      ['/distribution-manage/sales-flow', { name: '销售流水', menu: { defaultName: '销售流水' } }],
    ]);
    const menus = applyTenantMenuOverrides([
      { name: '营业概况', path: '/survey' },
      { name: '分销管理', path: '/distribution-manage', children: [{ name: '销售流水', path: '/distribution-manage/sales-flow' }] },
    ], source);
    expect(menus[0]?.name).toBe('orgMall.routes.survey');
    expect(menus[1]?.name).toBe('orgMall.routes.distribution');
    expect(menus[1]?.children?.[0]?.name).toBe('orgMall.routes.salesFlow');
  });
});
