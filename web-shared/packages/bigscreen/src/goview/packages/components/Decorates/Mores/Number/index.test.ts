/** 验证数字卡通过真实数据回调更新质量标签，GOOD 零值恢复时清除旧异常。 */
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import NumberCard from './index.vue';

/** 保存组件注册的数据回调，复现非 ECharts 组件的更新路径。 */
const state = vi.hoisted(() => ({ callback: undefined as ((data: unknown) => void) | undefined }));
vi.mock('@/hooks', () => ({ useChartDataFetch: (_config: unknown, _store: unknown, callback: (data: unknown) => void) => { state.callback = callback; } }));
vi.mock('@/store/modules/chartEditStore/chartEditStore', () => ({ useChartEditStore: vi.fn() }));

describe('数字卡采集质量', () => {
  it('BAD/null 显示空值与异常，再收到 GOOD/0 时清除异常并显示零', async () => {
    const wrapper = mount(NumberCard, {
      props: { chartConfig: { attr: { w: 300, h: 120 }, option: { dataset: 0, from: 0, dur: 0, precision: 0 }, request: {} } as any },
      global: { stubs: {
        NStatistic: { template: '<div><slot name="label"/><slot/></div>' },
        NNumberAnimation: { props: ['to'], template: '<span>{{ to }}</span>' },
      } },
    });
    state.callback?.({ dimensions: ['time', 'P'], source: [{ time: '19:00', P: null }], _iotMeta: { qualityWarnings: { P: 'P：异常' } } });
    await nextTick();
    expect(wrapper.text()).toContain('—');
    expect(wrapper.text()).toContain('P：异常');
    state.callback?.({ dimensions: ['time', 'P'], source: [{ time: '19:01', P: 0 }], _iotMeta: { qualityWarnings: {} } });
    await nextTick();
    expect(wrapper.text()).toContain('0');
    expect(wrapper.text()).not.toContain('异常');
    expect(wrapper.text()).not.toContain('—');
    wrapper.unmount();
  });
});
