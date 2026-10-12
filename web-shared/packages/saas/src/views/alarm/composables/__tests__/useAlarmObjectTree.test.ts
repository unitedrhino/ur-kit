import type { AlarmObjectNode } from '../../types/alarm-v2.types';

/**
 * 文件说明：验证告警对象树的来源名称解析。
 */
import { describe, expect, it, vi } from 'vitest';

import { getAlarmTargetDisplay, toAlarmObjectTree, useAlarmObjectTree } from '../useAlarmObjectTree';

const apiMocks = vi.hoisted(() => ({
  getAreas: vi.fn(),
  getCategories: vi.fn(),
  getDevices: vi.fn(),
  getGroups: vi.fn(),
  getProducts: vi.fn(),
}));

vi.mock('@vben/api', () => ({
  ThingsApi: {
    postApiV1ThingsAreaInfoGetList: apiMocks.getAreas,
    postApiV1ThingsDeviceInfoGetList: apiMocks.getDevices,
    postApiV1ThingsGroupInfoGetList: apiMocks.getGroups,
    postApiV1ThingsProductCategoryGetList: apiMocks.getCategories,
    postApiV1ThingsProductInfoGetList: apiMocks.getProducts,
  },
}));

const tree: AlarmObjectNode[] = [
  {
    id: '3',
    level: 'category',
    levelName: '品类',
    name: '照明设备',
    children: [
      {
        id: 'product-1',
        level: 'product',
        levelName: '产品',
        name: '路灯控制器',
      },
    ],
  },
];

describe('getAlarmTargetDisplay', () => {
  it('应根据品类 ID 返回品类名称', () => {
    expect(getAlarmTargetDisplay({ categoryID: '3', selectType: 'all' }, tree)).toBe('照明设备');
  });

  it('应优先使用后端返回的目标展示名', () => {
    expect(getAlarmTargetDisplay({ categoryID: '3', selectType: 'all' }, tree, '已保存名称')).toBe('已保存名称');
  });
});

describe('toAlarmObjectTree', () => {
  it('设备区域不在区域树中时应直接挂到产品下', () => {
    const result = toAlarmObjectTree(
      [{ id: 'sensor', name: '传感器设备' }],
      [{ categoryID: 'sensor', productID: 'product-1', productName: '告警模拟器' }],
      [],
      [],
      [{ areaID: '2', deviceAlias: '告警模拟设备001', deviceName: 'alarm_sim_001', productID: 'product-1' }],
    );

    // 品类层级已拍平：产品节点直接位于顶层
    const product = result.find((node) => node.id === 'product-1');
    expect(product?.children).toContainEqual({
      id: 'alarm_sim_001',
      level: 'device',
      levelName: '设备',
      name: '告警模拟设备001',
    });
  });
});

describe('useAlarmObjectTree', () => {
  it('真实接口返回空列表时不应回退到演示对象树', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    apiMocks.getAreas.mockResolvedValue({ list: [] });
    apiMocks.getCategories.mockResolvedValue({ list: [] });
    apiMocks.getDevices.mockResolvedValue({ list: [] });
    apiMocks.getGroups.mockResolvedValue({ list: [] });
    apiMocks.getProducts.mockResolvedValue({ list: [] });

    const { error, load, treeData } = useAlarmObjectTree();
    await load();

    expect(error.value).toBe('后端对象树数据为空');
    expect(treeData.value).toEqual([]);
    consoleError.mockRestore();
  });
});
