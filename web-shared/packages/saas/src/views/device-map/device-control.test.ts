import { describe, expect, it } from 'vitest';

import {
  buildControlInitialValues,
  normalizeControlSchemas,
  normalizeControlValue,
} from './device-control';

describe('device map device control helpers', () => {
  it('normalizes supported control schemas from affordance json', () => {
    const schemas = normalizeControlSchemas([
      {
        identifier: 'switch',
        name: '开关',
        type: 1,
        affordance: JSON.stringify({ define: { type: 'bool' } }),
      },
      {
        identifier: 'mode',
        name: '模式',
        type: 1,
        affordance: JSON.stringify({ define: { type: 'enum', mapping: { cool: '制冷', heat: '制热' } } }),
      },
      {
        identifier: 'readonly',
        name: '只读',
        type: 1,
        affordance: JSON.stringify({ define: { type: 'text' } }),
      },
    ] as any);

    expect(schemas).toHaveLength(2);
    expect(schemas[0]).toMatchObject({ identifier: 'switch', valueType: 'bool' });
    expect(schemas[1]?.options).toEqual([
      { label: '制冷', value: 'cool' },
      { label: '制热', value: 'heat' },
    ]);
  });

  it('builds initial values from reported device properties', () => {
    const controls = normalizeControlSchemas([
      { identifier: 'switch', name: '开关', type: 1, affordance: '{"define":{"type":"bool"}}' },
      { identifier: 'temperature', name: '温度', type: 1, affordance: '{"define":{"type":"int","min":16,"max":30,"step":1}}' },
      { identifier: 'mode', name: '模式', type: 1, affordance: '{"define":{"type":"enum","mapping":{"auto":"自动"}}}' },
    ] as any);

    expect(buildControlInitialValues(controls, {
      mode: { value: 'auto', timestamp: '1' },
      switch: { value: '1', timestamp: '1' },
      temperature: { value: '25', timestamp: '1' },
    })).toEqual({
      mode: 'auto',
      switch: true,
      temperature: 25,
    });
  });

  it('normalizes outbound values by affordance type', () => {
    expect(normalizeControlValue({ valueType: 'bool' } as any, true)).toBe(1);
    expect(normalizeControlValue({ valueType: 'float' } as any, '12.5')).toBe(12.5);
    expect(normalizeControlValue({ valueType: 'enum' } as any, 2)).toBe('2');
  });
});
