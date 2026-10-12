// @vitest-environment happy-dom

/**
 * 文件说明：项目上下文页面级开关的单元测试。
 * 覆盖 setProjectScopeDefault / enableProjectScope / isProjectScopeEnabled / $reset 的行为，
 * 保障"只有开启项目选择的页面才注入 project-id"的契约。
 */
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useProjectStore } from './project';

describe('useProjectStore 项目上下文页面级开关', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('默认全局启用（保持历史行为），任意路径都判定为启用', () => {
    const store = useProjectStore();
    expect(store.scopeDefaultEnabled).toBe(true);
    expect(store.isProjectScopeEnabled('/iot/device/list')).toBe(true);
    expect(store.isProjectScopeEnabled('')).toBe(true);
  });

  it('关闭全局默认后，未声明的路径判定为不启用', () => {
    const store = useProjectStore();
    store.setProjectScopeDefault(false);
    expect(store.isProjectScopeEnabled('/iot/device/list')).toBe(false);
    expect(store.isProjectScopeEnabled('')).toBe(false);
  });

  it('enableProjectScope 按路由前缀启用，支持数组与去重', () => {
    const store = useProjectStore();
    store.setProjectScopeDefault(false);
    store.enableProjectScope(['/iot/alarm', '/iot/big-bigscreen']);
    store.enableProjectScope('/iot/alarm');

    expect(store.scopePathPrefixes).toEqual(['/iot/alarm', '/iot/big-bigscreen']);
    expect(store.isProjectScopeEnabled('/iot/alarm/rule')).toBe(true);
    expect(store.isProjectScopeEnabled('/iot/big-bigscreen/screen')).toBe(true);
    expect(store.isProjectScopeEnabled('/iot/device/list')).toBe(false);
    expect(store.isProjectScopeEnabled('/iot/alarmx')).toBe(false);
  });

  it('重新打开全局默认后，白名单不再限制', () => {
    const store = useProjectStore();
    store.setProjectScopeDefault(false);
    store.enableProjectScope('/iot/alarm');
    store.setProjectScopeDefault(true);
    expect(store.isProjectScopeEnabled('/iot/device/list')).toBe(true);
  });

  it('$reset 恢复默认全局启用并清空白名单', () => {
    const store = useProjectStore();
    store.setProjectScopeDefault(false);
    store.enableProjectScope('/iot/alarm');
    store.$reset();
    expect(store.scopeDefaultEnabled).toBe(true);
    expect(store.scopePathPrefixes).toEqual([]);
    expect(store.isProjectScopeEnabled('/iot/device/list')).toBe(true);
  });
});
