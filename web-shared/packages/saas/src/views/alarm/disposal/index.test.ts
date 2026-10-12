/**
 * 文件说明：告警事件处置页状态操作测试。
 * 验证页面只展示后端状态机允许的操作，并可从屏蔽状态解除屏蔽。
 */
import { flushPromises, mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import DisposalPage from './index.vue';

const apiMocks = vi.hoisted(() => ({
  deal: vi.fn().mockResolvedValue(undefined),
  falseAlarm: vi.fn().mockResolvedValue(undefined),
  getOne: vi.fn(),
}));

vi.mock('../api/alarm-event.api', () => ({
  dealAlarmEvent: apiMocks.deal,
  falseAlarmEvent: apiMocks.falseAlarm,
  getAlarmEventOne: apiMocks.getOne,
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { eventId: '42' } }),
}));

vi.mock('@vben/common-ui', () => ({
  Page: { template: '<div><slot /></div>' },
}));

vi.mock('@unitedrhino/saas-ui/ui/badge', () => ({
  Badge: { template: '<span><slot /></span>' },
}));

vi.mock('@unitedrhino/saas-ui/ui/button', () => ({
  Button: {
    inheritAttrs: false,
    template: '<button v-bind="$attrs"><slot /></button>',
  },
}));

vi.mock('@unitedrhino/saas-ui/ui/dialog', () => ({
  Dialog: {
    props: ['open'],
    template: '<div v-if="open"><slot /></div>',
  },
  DialogContent: { template: '<div><slot /></div>' },
  DialogDescription: { template: '<div><slot /></div>' },
  DialogFooter: { template: '<div><slot /></div>' },
  DialogHeader: { template: '<div><slot /></div>' },
  DialogTitle: { template: '<div><slot /></div>' },
}));

vi.mock('@unitedrhino/saas-ui/ui/input', () => ({
  Input: {
    inheritAttrs: false,
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<input v-bind="$attrs" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
}));

vi.mock('@unitedrhino/saas-ui/ui/select', () => ({
  Select: {
    name: 'Select',
    inheritAttrs: false,
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<select v-bind="$attrs" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>',
  },
  SelectContent: { template: '<slot />' },
  SelectItem: {
    props: ['value'],
    template: '<option :value="value"><slot /></option>',
  },
  SelectTrigger: { template: '<span><slot /></span>' },
  SelectValue: { template: '<span />' },
}));

vi.mock('@unitedrhino/saas-ui/ui/table', () => ({
  Table: { template: '<table><slot /></table>' },
  TableBody: { template: '<tbody><slot /></tbody>' },
  TableCell: { template: '<td><slot /></td>' },
  TableHead: { template: '<th><slot /></th>' },
  TableHeader: { template: '<thead><slot /></thead>' },
  TableRow: { template: '<tr><slot /></tr>' },
}));

function mockEvent(status: string) {
  apiMocks.getOne.mockResolvedValue({
    dealRecords: [],
    event: {
      alarmName: '温度告警',
      id: '42',
      level: 'major',
      status,
      triggerCount: 1,
    },
    notifyRecords: [],
  });
}

function actionTexts(wrapper: ReturnType<typeof mount>) {
  return wrapper
    .findAll('[data-testid^="alarm-disposal-action-"]')
    .map((button) => button.text().trim());
}

describe('alarmDisposalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('报警激活时只显示确认、屏蔽和虚警', async () => {
    mockEvent('alarmActive');
    const wrapper = mount(DisposalPage);
    await flushPromises();

    expect(actionTexts(wrapper)).toEqual(['确认告警', '屏蔽告警', '标记虚警']);
  });

  it('已确认时不再显示确认操作', async () => {
    mockEvent('acked');
    const wrapper = mount(DisposalPage);
    await flushPromises();

    expect(actionTexts(wrapper)).toEqual(['屏蔽告警', '标记虚警']);
  });

  it('已屏蔽时显示解除屏蔽并调用对应动作', async () => {
    mockEvent('shielded');
    const wrapper = mount(DisposalPage);
    await flushPromises();

    expect(actionTexts(wrapper)).toEqual(['解除屏蔽', '标记虚警']);
    await wrapper.get('[data-testid="alarm-disposal-action-unshield"]').trigger('click');
    await flushPromises();

    expect(apiMocks.deal).toHaveBeenCalledWith('42', '解除屏蔽');
  });

  it('正常状态不显示人工处置操作', async () => {
    mockEvent('normal');
    const wrapper = mount(DisposalPage);
    await flushPromises();

    expect(actionTexts(wrapper)).toEqual([]);
  });

  it('标记虚警时提交原因分类和备注', async () => {
    mockEvent('alarmActive');
    const wrapper = mount(DisposalPage);
    await flushPromises();

    await wrapper.get('[data-testid="alarm-disposal-action-false-alarm"]').trigger('click');
    wrapper.getComponent({ name: 'Select' }).vm.$emit('update:modelValue', 'dataError');
    await wrapper.vm.$nextTick();
    await wrapper.get('[data-testid="alarm-false-reason"]').setValue('传感器漂移');
    await wrapper.get('[data-testid="alarm-false-confirm"]').trigger('click');
    await flushPromises();

    expect(apiMocks.falseAlarm).toHaveBeenCalledWith('42', '传感器漂移', 'dataError');
  });
});
