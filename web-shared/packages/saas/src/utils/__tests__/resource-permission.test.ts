import type { CoreApi } from '@vben/api';

import { describe, expect, it } from 'vitest';

import {
  buildResourceActionKey,
  hydrateResourceActionCheckedSet,
  parseResourceActionKey,
  toRoleResourceActionItems,
} from '../resource-permission';

const groups: CoreApi.ApiGroupInfo[] = [
  {
    id: '1',
    code: 'sale/config',
    name: '营销配置',
    children: [
      {
        id: '11',
        code: 'info',
        name: '配置信息',
        children: [{ id: '111', code: 'view', name: '查看', children: [] }],
      },
    ],
  },
  {
    id: '2',
    code: 'sale/distributor',
    name: '经销商',
    children: [
      {
        id: '21',
        code: 'info',
        name: '经销商信息',
        children: [
          { id: '211', code: 'view', name: '查看', children: [] },
          { id: '212', code: 'update', name: '修改', children: [] },
        ],
      },
      {
        id: '22',
        code: 'device/interact',
        name: '设备交互',
        children: [{ id: '221', code: 'create', name: '新增', children: [] }],
      },
    ],
  },
];

describe('resource-permission utils', () => {
  it('buildResourceActionKey 应包含 group 路径', () => {
    const group = groups[0]!;
    const resource = group.children![0]!;
    const action = resource.children![0]!;
    expect(buildResourceActionKey(group, resource, action)).toBe('sale/config/info:view');
  });

  it('parseResourceActionKey 应正确拆分嵌套 resource 路径', () => {
    expect(parseResourceActionKey('sale/distributor/device/interact:create')).toEqual({
      resource: 'sale/distributor/device/interact',
      action: 'create',
    });
  });

  it('hydrateResourceActionCheckedSet 应区分不同分组下的同名 resource', () => {
    const checked = hydrateResourceActionCheckedSet(groups, [
      { resource: 'sale/config/info', action: 'view' },
    ]);
    expect(checked).toEqual(new Set(['sale/config/info:view']));
    expect(checked.has('sale/distributor/info:view')).toBe(false);
  });

  it('hydrateResourceActionCheckedSet 应兼容旧版短 resource', () => {
    const checked = hydrateResourceActionCheckedSet(groups, [{ resource: 'info', action: 'view' }]);
    expect(checked).toEqual(
      new Set(['sale/config/info:view', 'sale/distributor/info:view']),
    );
  });

  it('toRoleResourceActionItems 应输出完整 resource 路径', () => {
    expect(
      toRoleResourceActionItems(new Set(['sale/config/info:view', 'sale/distributor/info:update'])),
    ).toEqual([
      { resource: 'sale/config/info', action: 'view' },
      { resource: 'sale/distributor/info', action: 'update' },
    ]);
  });
});
