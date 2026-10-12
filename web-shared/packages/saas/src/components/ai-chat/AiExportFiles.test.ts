/** 文件说明：导出卡片刷新恢复、进度轮询、失败重试和重复点击测试。 */
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AiExportFiles from './AiExportFiles.vue';

const mocks = vi.hoisted(() => ({ list: vi.fn(), create: vi.fn(), retry: vi.fn() }));
vi.mock('./api', () => ({ getChatExports: mocks.list, createChatExport: mocks.create, retryChatExport: mocks.retry }));
vi.mock('./AiAttachment.vue', () => ({ default: { props: ['artifactID'], template: '<div data-file>{{ artifactID }}</div>' } }));
const pending = { taskID: 'task', resultID: 'result', format: 'pdf', status: 'pending', artifactID: '', errorCode: '' };
beforeEach(() => { vi.useFakeTimers(); mocks.list.mockReset(); mocks.create.mockReset(); mocks.retry.mockReset(); });
afterEach(() => { vi.useRealTimers(); });

describe('导出文件卡片', () => {
  it('刷新恢复生成进度，上传成功后才展示附件', async () => {
    mocks.list.mockResolvedValueOnce({ list: [pending] }).mockResolvedValue({ list: [{ ...pending, status: 'success', artifactID: 'file-ready' }] });
    const wrapper = mount(AiExportFiles, { props: { resultID: 'result' } });
    await flushPromises();
    expect(wrapper.text()).toContain('等待生成');
    expect(wrapper.find('[data-file]').exists()).toBe(false);
    expect(wrapper.findAll('button').find((button) => button.text() === '导出 PDF')!.attributes('disabled')).toBeDefined();
    await vi.advanceTimersByTimeAsync(3000); await flushPromises();
    expect(wrapper.get('[data-file]').text()).toBe('file-ready');
    wrapper.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('创建网络失败后重试使用同一幂等键', async () => {
    mocks.list.mockResolvedValue({ list: [] });
    mocks.create.mockRejectedValueOnce(new Error('连接中断')).mockResolvedValue(pending);
    const wrapper = mount(AiExportFiles, { props: { resultID: 'result' } });
    await flushPromises();
    const button = wrapper.findAll('button').find((item) => item.text() === '导出 PDF')!;
    await button.trigger('click'); await flushPromises();
    expect(wrapper.text()).toContain('连接中断');
    await button.trigger('click'); await flushPromises();
    expect(mocks.create.mock.calls[0]![2]).toBe(mocks.create.mock.calls[1]![2]);
    wrapper.unmount();
  });

  it('失败卡片显式重试同一任务，无虚假下载链接', async () => {
    mocks.list.mockResolvedValue({ list: [{ ...pending, status: 'failed', errorCode: 'FILE_UPLOAD_FAILED' }] });
    mocks.retry.mockResolvedValue(pending);
    const wrapper = mount(AiExportFiles, { props: { resultID: 'result' } });
    await flushPromises();
    expect(wrapper.text()).toContain('文件上传未完成');
    expect(wrapper.find('a').exists()).toBe(false);
    await wrapper.findAll('button').find((item) => item.text() === '重试')!.trigger('click');
    await flushPromises();
    expect(mocks.retry).toHaveBeenCalledWith('task');
    wrapper.unmount();
  });
});
