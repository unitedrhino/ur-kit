import { describe, expect, it, vi } from 'vitest';

// importCore 顶层 import '@/utils' 会拖入 saas 包全家桶（naive-ui CJS 具名导出
// 在 vitest 下不可用导致套件加载失败）；本测试只验证 validateGoviewJson 纯逻辑，
// fetch 请求头不会被调用，直接 mock 掉重依赖入口以隔离 import 图
vi.mock('@/utils', () => ({
  getEditorFetchHeaders: (extra?: Record<string, string>) => ({ ...(extra ?? {}) }),
}));

import { validateGoviewJson } from '../importCore';
import { CURRENT_SCHEMA_VERSION } from '../types';

describe('validateGoviewJson migration', () => {
  it('导入新格式 schema 时自动清理动态运行快照', () => {
    const raw = JSON.stringify({
      version: '1.0.0',
      meta: { name: 'demo', exportedAt: '2026-05-17T00:00:00.000Z', componentCount: 1 },
      editCanvasConfig: {},
      requestGlobalConfig: {},
      componentList: [
        {
          option: {
            dataset: { source: [{ value: 1 }] },
            _lastDynamicDataset: { source: [{ value: 1 }], _iotMeta: { dataView: 'prop', mode: 'latest' } },
            _simplifiedData: {
              _iotMeta: { dataView: 'prop', mode: 'latest' },
              rows: [{ value: 1 }],
              columns: [{ key: 'value', title: 'value' }],
              mappings: { value: 'value' },
            },
          },
          request: { requestDataType: 5 },
        },
      ],
    });

    const result = validateGoviewJson(raw);
    expect(result.valid).toBe(true);
    expect(result.schema?.version).toBe(CURRENT_SCHEMA_VERSION);
    expect(result.schema?.componentList[0].option.dataset).toBeUndefined();
    expect(result.schema?.componentList[0].option._lastDynamicDataset).toBeUndefined();
    expect(result.schema?.componentList[0].option._simplifiedData._iotMeta).toBeUndefined();
    expect(result.schema?.componentList[0].option._simplifiedData.rows).toBeUndefined();
    expect(result.schema?.componentList[0].option._simplifiedData.columns).toBeUndefined();
    expect(result.schema?.componentList[0].option._simplifiedData.mappings).toEqual({ value: 'value' });
  });

  it('导入 1.1.0 格式 schema 时不触发迁移（版本已是最新）', () => {
    const raw = JSON.stringify({
      version: '1.1.0',
      meta: { name: 'v110', exportedAt: '2026-05-17T00:00:00.000Z', componentCount: 1 },
      editCanvasConfig: {},
      requestGlobalConfig: {},
      componentList: [
        {
          option: {
            dataset: { source: [{ value: 3 }] },
            _simplifiedData: {
              mappings: { value: 'temperature' },
            },
          },
          request: { requestDataType: 5 },
        },
      ],
    });

    const result = validateGoviewJson(raw);
    expect(result.valid).toBe(true);
    expect(result.schema?.version).toBe(CURRENT_SCHEMA_VERSION);
    // 1.1.0 已是最新版本，不触发迁移，内容原样保留
    expect(result.schema?.componentList[0].option.dataset).toEqual({ source: [{ value: 3 }] });
    expect(result.schema?.componentList[0].option._simplifiedData.mappings).toEqual({ value: 'temperature' });
  });

  it('导入旧格式 storage 时也执行快照清理', () => {
    const raw = JSON.stringify({
      editCanvasConfig: { projectName: 'legacy' },
      requestGlobalConfig: {},
      componentList: [
        {
          option: {
            dataset: { source: [{ value: 2 }] },
            _simplifiedData: { rows: [{ value: 2 }] },
          },
          request: { requestDataType: 1 },
        },
        {
          option: { dataset: { source: [{ name: 'A', value: 1 }] } },
          request: { requestDataType: 0 },
        },
      ],
    });

    const result = validateGoviewJson(raw);
    expect(result.valid).toBe(true);
    expect(result.schema?.version).toBe(CURRENT_SCHEMA_VERSION);
    expect(result.schema?.componentList[0].option.dataset).toBeUndefined();
    expect(result.schema?.componentList[0].option._simplifiedData.rows).toBeUndefined();
    expect(result.schema?.componentList[1].option.dataset).toEqual({ source: [{ name: 'A', value: 1 }] });
  });
});
