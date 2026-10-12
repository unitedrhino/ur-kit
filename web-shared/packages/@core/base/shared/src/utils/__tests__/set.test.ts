import { describe, expect, it } from 'vitest';

import set from '../set';

describe('set', () => {
  it('应在简单键上设值', () => {
    const obj: Record<string, any> = {};
    set(obj, 'name', 'test');
    expect(obj.name).toBe('test');
  });

  it('应创建嵌套对象并设值', () => {
    const obj: Record<string, any> = {};
    set(obj, 'a.b.c', 1);
    expect(obj.a.b.c).toBe(1);
  });

  it('应创建数组路径并设值', () => {
    const obj: Record<string, any> = {};
    set(obj, 'list.0.name', 'first');
    expect(Array.isArray(obj.list)).toBe(true);
    expect(obj.list[0].name).toBe('first');
  });

  it('应支持数组路径参数', () => {
    const obj: Record<string, any> = {};
    set(obj, ['a', '1', 'b'], 2);
    expect(obj.a[1].b).toBe(2);
  });

  it('应覆盖已存在的值', () => {
    const obj: Record<string, any> = { a: { b: 1 } };
    set(obj, 'a.b', 2);
    expect(obj.a.b).toBe(2);
  });

  it('非对象输入应安全返回', () => {
    expect(set(null as any, 'a', 1)).toBe(null);
    expect(set(1 as any, 'a', 2)).toBe(1);
  });

  it('应支持中括号路径', () => {
    const obj: Record<string, any> = {};
    set(obj, 'items[0].value', 42);
    expect(obj.items[0].value).toBe(42);
  });

  it('应兼容实际 schema 中的点分字段名（如 user.userName）', () => {
    const obj: Record<string, any> = {};
    set(obj, 'user.userName', 'admin');
    expect(obj.user.userName).toBe('admin');
  });

  it('应兼容数字下标路径（如 affordance.define.mapping.0）', () => {
    const obj: Record<string, any> = {};
    set(obj, 'affordance.define.mapping.0', 'on');
    set(obj, 'affordance.define.mapping.1', 'off');
    expect(Array.isArray(obj.affordance.define.mapping)).toBe(true);
    expect(obj.affordance.define.mapping[0]).toBe('on');
    expect(obj.affordance.define.mapping[1]).toBe('off');
  });

  it('连续设值应能先设叶子再展开为对象', () => {
    const obj: Record<string, any> = {};
    set(obj, 'a.b', 'value');
    set(obj, 'a.b.c', 'nested');
    expect(obj.a.b.c).toBe('nested');
  });
});
