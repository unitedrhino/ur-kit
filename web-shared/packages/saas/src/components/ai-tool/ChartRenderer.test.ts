/** 文件说明：验证图表生命周期、容器尺寸变化和真实数据点选择，防止浮窗关闭后残留画布。 */
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ChartRenderer from './ChartRenderer.vue';

/** 只替换浏览器 Canvas 边界，组件选项映射与生命周期使用真实实现。 */
const mocks = vi.hoisted(() => ({ init: vi.fn(), setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn(), on: vi.fn(), observe: vi.fn(), disconnect: vi.fn(), resized: undefined as (() => void) | undefined }));
vi.mock('echarts', () => ({ init: mocks.init }));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.init.mockReturnValue({ setOption: mocks.setOption, resize: mocks.resize, dispose: mocks.dispose, on: mocks.on });
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: () => void) { mocks.resized = callback; }
    observe = mocks.observe;
    disconnect = mocks.disconnect;
  });
});
afterEach(() => vi.unstubAllGlobals());

/** 数值零和缺失值必须完整进入图表。 */
const data = { xAxis: ['一', '二'], series: [{ name: '指标', data: [0, null] }] };
describe('聊天图表生命周期', () => {
  it('尺寸变化重新布局，选点回传真实数值并保持缺失值', async () => {
    const wrapper = mount(ChartRenderer, { props: { type: 'line', data, zoom: true } });
    await flushPromises();
    expect(mocks.setOption.mock.calls[0]![0]).toMatchObject({ tooltip: { renderMode: 'richText' }, series: [{ data: [0, null] }], dataZoom: [{ type: 'inside' }, { type: 'slider' }] });
    mocks.resized!(); expect(mocks.resize).toHaveBeenCalledTimes(1);
    const select = mocks.on.mock.calls.find((call) => call[0] === 'click')![1];
    select({ dataIndex: 1, seriesIndex: 0, value: 999 });
    expect(wrapper.emitted('selection')?.[0]).toEqual([{ xValue: '二', seriesName: '指标', value: null }]);
    wrapper.unmount();
    expect(mocks.dispose).toHaveBeenCalledTimes(1);
    expect(mocks.disconnect).toHaveBeenCalledTimes(1);
  });
  it('异步加载完成前关闭，不创建脱离页面的图表', async () => {
    const wrapper = mount(ChartRenderer, { props: { type: 'line', data } });
    wrapper.unmount(); await flushPromises();
    expect(mocks.init).not.toHaveBeenCalled();
  });
});
