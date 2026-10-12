/**
 * 文件说明：告警规则编辑页能力矩阵加载门禁测试。
 */
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resetAlarmCapabilities } from '../../composables/useAlarmCapabilities';
import RuleEditPage from './index.vue';

const apiMocks = vi.hoisted(() => ({
  getCapability: vi.fn(),
}));

vi.mock('../../api/alarm-capability.api', () => ({
  getAlarmCapability: apiMocks.getCapability,
}));

vi.mock('../../api/alarm-info.api', () => ({
  createAlarmInfo: vi.fn(),
  getAlarmInfoOne: vi.fn(),
  updateAlarmInfo: vi.fn(),
  updateAlarmInfoStatus: vi.fn(),
}));

vi.mock('@vben/hooks', () => ({
  useTabs: () => ({ setTabTitle: vi.fn().mockResolvedValue(undefined) }),
}));

vi.mock('@vben/saas', () => ({
  message: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {} }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@vben/common-ui', () => ({
  Page: { template: '<div><slot /></div>' },
}));

vi.mock('@unitedrhino/saas-ui/ui/alert', () => ({
  Alert: { template: '<div><slot /></div>' },
  AlertDescription: { template: '<div><slot /></div>' },
  AlertTitle: { template: '<div><slot /></div>' },
}));

vi.mock('@unitedrhino/saas-ui/ui/button', () => ({
  Button: { template: '<button><slot /></button>' },
}));

vi.mock('./components/StepBasic.vue', () => ({
  default: { template: '<div data-testid="alarm-step-basic" />' },
}));
vi.mock('./components/StepCondition.vue', () => ({
  default: { template: '<div data-testid="alarm-step-condition" />' },
}));
vi.mock('./components/StepNotify.vue', () => ({
  default: { template: '<div data-testid="alarm-step-notify" />' },
}));
vi.mock('./components/StepConfirm.vue', () => ({
  default: { template: '<div data-testid="alarm-step-confirm" />' },
}));

const minimalCapability = {
  criteria: [],
  notify: {
    callbackAuthTypes: [],
    callbackMethods: [],
    channels: [],
    timings: [],
  },
  sources: [{
    aggregates: [{ dataType: 'float', values: ['last'] }],
    compareTypes: ['gt'],
    dataTypes: ['float'],
    sourceType: 'property',
    supportsFilters: false,
  }],
  targets: ['all'],
  version: 'test-v1',
};

describe('alarmRuleEditCapabilityGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAlarmCapabilities();
  });

  it('能力矩阵加载成功后才展示规则向导', async () => {
    apiMocks.getCapability.mockResolvedValue(minimalCapability);
    const wrapper = mount(RuleEditPage, { global: { plugins: [createPinia()] } });
    await flushPromises();

    expect(apiMocks.getCapability).toHaveBeenCalledOnce();
    expect(wrapper.find('[data-testid="alarm-step-basic"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="alarm-capability-error"]').exists()).toBe(false);
  });

  it('能力矩阵加载失败时阻止规则编辑且不使用静态兜底', async () => {
    apiMocks.getCapability.mockRejectedValue(new Error('network'));
    const wrapper = mount(RuleEditPage, { global: { plugins: [createPinia()] } });
    await flushPromises();

    expect(wrapper.get('[data-testid="alarm-capability-error"]').text()).toContain('无法加载告警配置能力');
    expect(wrapper.find('[data-testid="alarm-step-basic"]').exists()).toBe(false);
  });
});
