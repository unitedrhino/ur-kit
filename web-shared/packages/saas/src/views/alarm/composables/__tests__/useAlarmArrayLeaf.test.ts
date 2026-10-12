/**
 * useAlarmArrayLeaf 单元测试：数组属性叶子「属性 → 点位 → [成员]」级联逻辑。
 */

import { describe, expect, it } from 'vitest';

import {
  arrayContextOf,
  arrayMemberOptions,
  arrayPointOptions,
  buildArrayLeafPatch,
} from '../useAlarmArrayLeaf';
import type { LeafCondition, SchemaField } from '../../types/alarm-v2.types';

const strainField: SchemaField = {
  id: 'strain',
  name: '应变计',
  dataID: 'strain',
  sourceType: 'property',
  valueType: 'array',
  arrayMeta: { max: 4, struct: false, elementValueType: 'float', specs: [] },
};

const gnssField: SchemaField = {
  id: 'gnss',
  name: 'GNSS位移',
  dataID: 'gnss',
  sourceType: 'property',
  valueType: 'array',
  arrayMeta: {
    max: 2,
    struct: true,
    elementValueType: 'struct',
    specs: [
      { identifier: 'east', name: '东向位移', valueType: 'float', unit: 'mm' },
      { identifier: 'up', name: '垂直位移', valueType: 'int' },
    ],
  },
};

const fields = [strainField, gnssField];
const leaf = (dataID?: string): LeafCondition => ({
  id: 'leaf-1',
  sourceType: 'property',
  dataID,
    compare: { termType: 'gt', values: ['1'] },
});

describe('arrayPointOptions', () => {
  it('按 meta.max 生成点位选项', () => {
    expect(arrayPointOptions(strainField)).toHaveLength(4);
    expect(arrayPointOptions(strainField)[0]).toEqual({ label: '点位0', value: '0' });
    expect(arrayPointOptions(gnssField)).toHaveLength(2);
  });
});

describe('arrayMemberOptions', () => {
  it('结构体数组返回成员列表', () => {
    expect(arrayMemberOptions(gnssField)).toEqual([
      { label: '东向位移', value: 'east' },
      { label: '垂直位移', value: 'up' },
    ]);
  });
});

describe('arrayContextOf', () => {
  it('整字段（未选点位）返回 hasPoint=false 与元素类型', () => {
    const ctx = arrayContextOf(fields, leaf('strain'));
    expect(ctx?.hasPoint).toBe(false);
    expect(ctx?.complete).toBe(false);
    expect(ctx?.memberValueType).toBe('float');
  });

  it('纯数组点分路径解析出点位且 complete', () => {
    const ctx = arrayContextOf(fields, leaf('strain.1'));
    expect(ctx?.hasPoint).toBe(true);
    expect(ctx?.point).toBe(1);
    expect(ctx?.complete).toBe(true);
    expect(ctx?.memberValueType).toBe('float');
  });

  it('结构体数组选点位未选成员时 complete=false', () => {
    const ctx = arrayContextOf(fields, leaf('gnss.1'));
    expect(ctx?.hasPoint).toBe(true);
    expect(ctx?.complete).toBe(false);
    expect(ctx?.memberValueType).toBe('struct');
  });

  it('结构体数组选点位与成员后 complete=true 且类型按成员', () => {
    const ctx = arrayContextOf(fields, leaf('gnss.1.up'));
    expect(ctx?.complete).toBe(true);
    expect(ctx?.memberValueType).toBe('int');
    expect(ctx?.memberUnit).toBeUndefined();
  });

  it('非数组叶子返回 undefined', () => {
    expect(arrayContextOf(fields, { ...leaf('temperature') })).toBeUndefined();
  });

  it('点位越界视为未选', () => {
    const ctx = arrayContextOf(fields, leaf('strain.9'));
    expect(ctx?.hasPoint).toBe(false);
  });

  it('尾点占位（属性.）不得误判为已选点位0', () => {
    // 选中数组属性但未选点位时 dataID 为尾点占位「属性.」，
    // Number('') === 0 会把占位误反解成点位0，导致点位框假显示已选
    const ctx = arrayContextOf(fields, leaf('strain.'));
    expect(ctx?.hasPoint).toBe(false);
    expect(ctx?.point).toBeUndefined();
    expect(ctx?.complete).toBe(false);
  });
});

describe('buildArrayLeafPatch', () => {
  it('纯数组生成 属性.点位 并带元素类型', () => {
    const ctx = arrayContextOf(fields, leaf('strain'))!;
    const patch = buildArrayLeafPatch(ctx, 2);
    expect(patch.dataID).toBe('strain.2');
    expect(patch.dataName).toBe('应变计 点位2');
    expect(patch.memberValueType).toBe('float');
    expect(patch.sourceType).toBe('property');
  });

  it('结构体数组生成 属性.点位.成员 并带成员类型与单位来源', () => {
    const ctx = arrayContextOf(fields, leaf('gnss.1'))!;
    const patch = buildArrayLeafPatch(ctx, 1, 'east');
    expect(patch.dataID).toBe('gnss.1.east');
    expect(patch.dataName).toBe('GNSS位移 点位1 east');
    expect(patch.memberValueType).toBe('float');
  });
});
