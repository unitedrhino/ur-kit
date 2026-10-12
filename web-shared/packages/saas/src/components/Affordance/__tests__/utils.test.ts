/**
 * Affordance 工具函数测试，覆盖物模型表单提交前的数据转换与空值清理。
 */
import { describe, expect, it } from 'vitest';

import {
  createInitialAffordanceFormData,
  getStructRowsValidationError,
  transformFormData,
} from '../utils';

describe('transformFormData', () => {
  it('removes empty values recursively before submitting', () => {
    const result = transformFormData({
      type: 1,
      name: '音量',
      identifier: 'volume',
      desc: '',
      extendConfig: '   ',
      emptyArray: [],
      emptyObject: {
        nested: '',
      },
      nullValue: null,
      undefinedValue: undefined,
      affordance: {
        define: {
          type: 'int',
          min: '0',
          max: '100',
          start: '0',
          step: '1',
          unit: '',
          specs: [],
          emptyObject: {},
        },
        mode: 'rw',
        input: [],
        output: [],
      },
    });

    expect(result).not.toHaveProperty('desc');
    expect(result).not.toHaveProperty('extendConfig');
    expect(result).not.toHaveProperty('emptyArray');
    expect(result).not.toHaveProperty('emptyObject');
    expect(result).not.toHaveProperty('nullValue');
    expect(result).not.toHaveProperty('undefinedValue');

    expect(JSON.parse(result.affordance)).toEqual({
      define: {
        type: 'int',
        min: '0',
        max: '100',
        start: '0',
        step: '1',
      },
      mode: 'rw',
    });
  });

  it('keeps valid falsy values and non-empty strings unchanged', () => {
    const result = transformFormData({
      type: 1,
      order: 0,
      enabled: false,
      name: '  保留空格  ',
      affordance: {
        define: {
          type: 'bool',
          mapping: { '0': '关', '1': '开' },
        },
        isUseShadow: false,
        controlMode: 1,
      },
    });

    expect(result.order).toBe(0);
    expect(result.enabled).toBe(false);
    expect(result.name).toBe('  保留空格  ');
    expect(JSON.parse(result.affordance)).toEqual({
      define: {
        type: 'bool',
        mapping: { '0': '关', '1': '开' },
      },
      isUseShadow: false,
      controlMode: 1,
    });
  });

  it('does not mutate the original form data', () => {
    const rawData = {
      desc: '',
      affordance: {
        define: {
          type: 'int',
          unit: '',
        },
      },
    };

    transformFormData(rawData);

    expect(rawData).toEqual({
      desc: '',
      affordance: {
        define: {
          type: 'int',
          unit: '',
        },
      },
    });
  });

  it('removes empty action input and output placeholder rows before submitting', () => {
    const result = transformFormData({
      type: 3,
      name: '执行动作',
      identifier: 'runAction',
      affordance: {
        dir: 'up',
        input: [
          {
            identifier: '',
            name: '',
            define: { type: 'bool', mapping: { '0': '关', '1': '开' } },
          },
        ],
        output: [
          {
            identifier: 'result',
            name: '执行结果',
            define: { type: 'bool', mapping: { '0': '失败', '1': '成功' } },
          },
          {
            identifier: '   ',
            name: '',
            define: { type: 'bool', mapping: { '0': '关', '1': '开' } },
          },
        ],
      },
    });

    expect(JSON.parse(result.affordance)).toEqual({
      dir: 'up',
      output: [
        {
          identifier: 'result',
          name: '执行结果',
          define: { type: 'bool', mapping: { '0': '失败', '1': '成功' } },
        },
      ],
    });
  });

  it('submits only event affordance fields when type is event', () => {
    const result = transformFormData({
      type: 2,
      name: '告警事件',
      identifier: 'powerAlarm',
      affordance: {
        type: 'alert',
        dir: 'up',
        params: [
          {
            identifier: 'alarmValue',
            name: '告警值',
            define: { type: 'int', min: '0', max: '100', start: '0', step: '1' },
          },
        ],
        define: { type: 'bool', mapping: { '0': '关', '1': '开' } },
        mode: 'rw',
        recordMode: 1,
        isUseShadow: false,
        controlMode: 1,
        isPassword: 2,
        input: [
          {
            identifier: 'unused',
            name: '无关输入',
            define: { type: 'bool', mapping: { '0': '关', '1': '开' } },
          },
        ],
      },
    });

    expect(JSON.parse(result.affordance)).toEqual({
      type: 'alert',
      dir: 'up',
      params: [
        {
          identifier: 'alarmValue',
          name: '告警值',
          define: { type: 'int', min: '0', max: '100', start: '0', step: '1' },
        },
      ],
    });
  });

  it('submits only property affordance fields when type is property', () => {
    const result = transformFormData({
      type: 1,
      name: '开关',
      identifier: 'switch',
      affordance: {
        define: { type: 'bool', mapping: { '0': '关', '1': '开' } },
        mode: 'rw',
        recordMode: 1,
        isUseShadow: false,
        controlMode: 1,
        isPassword: 2,
        dir: 'up',
        params: [
          {
            identifier: 'unused',
            name: '无关参数',
            define: { type: 'bool', mapping: { '0': '关', '1': '开' } },
          },
        ],
      },
    });

    expect(JSON.parse(result.affordance)).toEqual({
      define: { type: 'bool', mapping: { '0': '关', '1': '开' } },
      mode: 'rw',
      recordMode: 1,
      isUseShadow: false,
      controlMode: 1,
      isPassword: 2,
    });
  });
});

describe('getStructRowsValidationError', () => {
  it('allows optional empty placeholder rows', () => {
    expect(
      getStructRowsValidationError(
        [
          {
            identifier: '',
            name: '',
            define: { type: 'bool', mapping: { '0': '关', '1': '开' } },
          },
        ],
        false,
      ),
    ).toBeUndefined();
  });

  it('requires non-empty rows when the struct field is required', () => {
    expect(
      getStructRowsValidationError(
        [
          {
            identifier: '',
            name: '',
            define: { type: 'bool', mapping: { '0': '关', '1': '开' } },
          },
        ],
        true,
      ),
    ).toBe('第 1 个参数请填写参数名称和参数标识符');
  });

  it('rejects partially filled optional rows before submitting', () => {
    expect(
      getStructRowsValidationError(
        [
          {
            identifier: '',
            name: '参数名称',
            define: { type: 'bool', mapping: { '0': '关', '1': '开' } },
          },
        ],
        false,
      ),
    ).toBe('第 1 个参数请填写参数标识符');
  });
});

describe('createInitialAffordanceFormData', () => {
  it('returns a fresh nested form value each time', () => {
    const first = createInitialAffordanceFormData();
    const second = createInitialAffordanceFormData();

    (first.affordance as any).define.mapping['0'] = '关闭';

    expect(first).not.toBe(second);
    expect(first.affordance).not.toBe(second.affordance);
    expect((second.affordance as any).define.mapping['0']).toBe('关');
  });
});
