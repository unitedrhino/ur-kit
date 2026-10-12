/**
 * 文件说明：告警统一下拉选择器显示同步测试。
 * 覆盖物模型 options 异步加载完成后，收起态显示文本必须实时刷新的场景
 * （回归：编辑历史规则时收起态残留「xx（已失效）」占位文案）。
 */
import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import AlarmSelect from './AlarmSelect.vue';

describe('alarmSelect 收起态显示同步', () => {
  it('options 异步更新后收起态显示应实时刷新为新选项文本', async () => {
    const wrapper = mount(AlarmSelect, {
      props: {
        modelValue: 'Ua',
        options: [{ label: 'Ua（已失效）', value: 'Ua' }],
      },
    });

    // 物模型加载完成前：显示失效占位文案（fieldOptions 的历史字段保留语义）
    expect(wrapper.text()).toContain('Ua（已失效）');

    // 物模型加载完成：失效占位被正常选项替换，显示文本必须同步刷新
    await wrapper.setProps({
      options: [{ label: '相电压Ua', value: 'Ua' }],
    });
    expect(wrapper.text()).toContain('相电压Ua');
    expect(wrapper.text()).not.toContain('已失效');
  });

  it('modelValue 不在 options 中时不显示原始值误导文案', () => {
    const wrapper = mount(AlarmSelect, {
      props: {
        modelValue: 'removed_property',
        options: [{ label: '相电压Ua', value: 'Ua' }],
      },
    });

    expect(wrapper.text()).not.toContain('removed_property');
  });

  it('无选中值时应显示 placeholder', () => {
    const wrapper = mount(AlarmSelect, {
      props: {
        modelValue: undefined,
        options: [{ label: '相电压Ua', value: 'Ua' }],
        placeholder: '选择字段',
      },
    });

    expect(wrapper.text()).toContain('选择字段');
  });
});
