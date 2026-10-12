import { describe, expect, it } from 'vitest';

import { resolveAutoUnitFromIoTDataset } from '../iotDataset';

describe('resolveAutoUnitFromIoTDataset', () => {
  it('所有单位一致时返回自动单位', () => {
    const unit = resolveAutoUnitFromIoTDataset({
      _iotMeta: {
        dataUnits: {
          temperature: '℃',
          humidity: '℃',
        },
      },
    });

    expect(unit).toBe('℃');
  });

  it('单位不一致时返回空字符串', () => {
    const unit = resolveAutoUnitFromIoTDataset({
      _iotMeta: {
        dataUnits: {
          temperature: '℃',
          pressure: 'Pa',
        },
      },
    });

    expect(unit).toBe('');
  });

  it('兼容嵌套在 dataset 下的 _iotMeta', () => {
    const unit = resolveAutoUnitFromIoTDataset({
      dataset: {
        _iotMeta: {
          dataUnits: {
            value: '%',
          },
        },
      },
    });

    expect(unit).toBe('%');
  });
});
