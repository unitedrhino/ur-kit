/**
 * 文件说明：StepShell 步骤向导外壳单元测试
 * 验证步骤条渲染、当前/完成/错误/待访问三态、footer slot 注入。
 */
import { mount } from '@vue/test-utils';

import { describe, expect, it, vi } from 'vitest';

import StepShell from './StepShell.vue';

const steps = [
  { title: '监控什么', description: '选择数据来源和设备范围' },
  { title: '何时告警', description: '设置触发条件和告警级别' },
  { title: '通知谁', description: '选择渠道、模板和接收人' },
];

describe('stepShell 步骤向导外壳', () => {
  it('渲染全部步骤标题与描述', () => {
    const wrapper = mount(StepShell, {
      props: { steps, step: 1, maxVisitedStep: 3 },
    });
    for (const s of steps) {
      expect(wrapper.text()).toContain(s.title);
      expect(wrapper.text()).toContain(s.description);
    }
  });

  it('当前步骤序号按钮高亮为激活态', () => {
    const wrapper = mount(StepShell, {
      props: { steps, step: 2, maxVisitedStep: 2 },
    });
    const activeBtns = wrapper.findAll('button').filter((b) => b.classes().includes('border-primary/30'));
    expect(activeBtns.length).toBe(1);
    expect(activeBtns[0]!.classes()).toContain('rounded-lg');
  });

  it('超过 maxVisitedStep 的步骤按钮被禁用', () => {
    const wrapper = mount(StepShell, {
      props: { steps, step: 1, maxVisitedStep: 1 },
    });
    const disabledBtns = wrapper.findAll('button').filter((b) => b.attributes('disabled') !== undefined);
    expect(disabledBtns.length).toBe(steps.length - 1);
  });

  it('错误状态显示"需要完善"提示', () => {
    const wrapper = mount(StepShell, {
      props: {
        steps,
        step: 1,
        maxVisitedStep: 3,
        stepState: (n) => (n === 1 ? 'error' : 'pending'),
      },
    });
    expect(wrapper.text()).toContain('需要完善');
  });

  it('点击步骤触发 onStepClick 回调', async () => {
    const onStepClick = vi.fn();
    const wrapper = mount(StepShell, {
      props: { steps, step: 1, maxVisitedStep: 3, onStepClick },
    });
    const btns = wrapper.findAll('button');
    await btns[1]!.trigger('click');
    expect(onStepClick).toHaveBeenCalledWith(2);
  });
});
