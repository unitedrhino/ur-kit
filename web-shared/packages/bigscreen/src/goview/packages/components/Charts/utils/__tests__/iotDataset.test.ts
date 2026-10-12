import { describe, expect, it } from 'vitest';

import { hasIoTDatasetMeta } from '../iotDataset';

describe('hasIoTDatasetMeta', () => {
  it('支持直接挂载 _iotMeta 的运行态数据', () => {
    expect(
      hasIoTDatasetMeta({
        _iotMeta: { dataView: 'prop', mode: 'latest' },
      }),
    ).toBe(true);
  });

  it('支持嵌套 dataset._iotMeta 的兼容结构', () => {
    expect(
      hasIoTDatasetMeta({
        dataset: {
          _iotMeta: { dataView: 'deviceStatus', mode: 'latest' },
        },
      }),
    ).toBe(true);
  });

  it('无 IoT 元信息时返回 false', () => {
    expect(hasIoTDatasetMeta({ dataset: { source: [{ value: 1 }] } })).toBe(false);
  });
});
