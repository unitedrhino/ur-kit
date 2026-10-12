/** 文件说明：验证结果卡片读取快照、空缺值展示和分页排序交互。 */
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AiInteractionBlock from './AiInteractionBlock.vue';
import { getInteractionRows, getInteractionSeries } from './api';

vi.mock('./AiAttachment.vue', () => ({ default: { props: ['artifactID'], template: '<div data-attachment>{{ artifactID }}</div>' } }));
vi.mock('./api', () => ({ getInteractionRows: vi.fn(), getInteractionSeries: vi.fn() }));
vi.mock('../ai-tool/ChartRenderer.vue', () => ({ default: { template: '<div />' } }));
/** 测试结果仅包含预览行，指标必须使用行接口读取原始位置。 */
const result: any = { resultID: 'r', datasets: [{ id: 'd', fields: [{ key: 'value', label: '温度', type: 'number' }] }] };
beforeEach(() => vi.clearAllMocks());

describe('分析内容块', () => {
  it('放大图表的 Esc 不传播到外层工作台', async () => {
    vi.mocked(getInteractionSeries).mockResolvedValue({ rows: [{ value: 12 }], sampled: false, originalRowCount: 1 });
    const wrapper = mount(AiInteractionBlock, { attachTo: document.body, props: { result, block: { id: 'chart', type: 'chart', datasetID: 'd', xField: 'value', series: [{ name: '温度', yField: 'value' }] } } });
    await flushPromises();
    const outerEscape = vi.fn();
    document.addEventListener('keydown', outerEscape);
    await wrapper.get('dialog').trigger('keydown', { key: 'Escape' });
    expect(outerEscape).not.toHaveBeenCalled();
    document.removeEventListener('keydown', outerEscape);
    wrapper.unmount();
  });

  it('指标按原始行号查询，并将 null 显示为暂无数据', async () => {
    vi.mocked(getInteractionRows).mockResolvedValue({ rows: [{ value: null }], total: 60 });
    const wrapper = mount(AiInteractionBlock, { props: { result, block: { id: 'metric', type: 'metric', datasetID: 'd', valueField: 'value', rowIndex: 40, unit: '℃' } } });
    await flushPromises();
    expect(getInteractionRows).toHaveBeenCalledWith('r', 'd', 41, '', '', 1);
    expect(wrapper.text()).toContain('暂无数据');
    expect(wrapper.text()).not.toContain('℃');
  });
  it('表格翻页及数值排序交给结果接口，明细显示字段标签', async () => {
    vi.mocked(getInteractionRows).mockResolvedValue({ rows: [{ value: 12 }], total: 30 });
    const wrapper = mount(AiInteractionBlock, { props: { result, block: { id: 'table', type: 'table', datasetID: 'd', columns: ['value'] } } });
    await flushPromises();
    await wrapper.findAll('button').find((button) => button.text() === '下一页')!.trigger('click');
    await flushPromises();
    expect(getInteractionRows).toHaveBeenLastCalledWith('r', 'd', 2, '', '', 20);
    await wrapper.find('th button').trigger('click'); await flushPromises();
    expect(getInteractionRows).toHaveBeenLastCalledWith('r', 'd', 1, 'value', 'asc', 20);
    await wrapper.findAll('button').find((button) => button.text() === '明细')!.trigger('click');
    expect(wrapper.find('dl').text()).toContain('温度');
  });
  it.each(['image', 'video', 'file'] as const)('展示 %s 附件只传递 ID，交给鉴权卡片加载', async (type) => {
    const wrapper = mount(AiInteractionBlock, { props: { result, block: { id: 'media', type, artifactID: 'private-file' } } });
    await flushPromises();
    expect(wrapper.get('[data-attachment]').text()).toBe('private-file');
    expect(getInteractionRows).not.toHaveBeenCalled();
    wrapper.unmount();
  });

});
