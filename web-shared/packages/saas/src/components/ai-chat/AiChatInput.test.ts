/** 文件说明：覆盖私有附件上传中禁止发送、幂等重试、账户切换卸载和格式限额。 */
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AiChatInput from './AiChatInput.vue';

const mocks = vi.hoisted(() => ({ upload: vi.fn() }));
vi.mock('./api', () => ({ uploadChatAttachment: mocks.upload }));
vi.mock('@vben-core/shadcn-ui', () => ({
  VbenIcon: { template: '<span />' }, VbenSpinner: { template: '<span />' },
  VbenButton: { template: '<button data-send><slot /></button>' },
  VbenIconButton: { template: '<button><slot /></button>' },
}));
/** choose 使用真实 File 触发输入事件，不直接修改组件内部状态。 */
async function choose(wrapper: ReturnType<typeof mount>, file: File) {
  const input = wrapper.get('input[type=file]');
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true });
  await input.trigger('change');
}

beforeEach(() => { mocks.upload.mockReset(); });
describe('聊天附件发送', () => {
  it('上传成功前禁止发送，成功后只传长期附件 ID', async () => {
    let resolve!: (value: any) => void;
    mocks.upload.mockImplementation(() => new Promise((done) => { resolve = done; }));
    const wrapper = mount(AiChatInput);
    await choose(wrapper, new File(['数量\n1'], '数据.csv', { type: 'text/csv' }));
    await wrapper.get('textarea').setValue('分析文件');
    await wrapper.get('textarea').trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('send')).toBeUndefined();
    resolve({ artifactID: 'file-1', kind: 'file', name: '数据.csv', mime: 'text/csv' });
    await flushPromises();
    await wrapper.get('textarea').trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('send')?.[0]?.[0]).toEqual([{ type: 'file', artifactID: 'file-1', fileName: '数据.csv', fileMime: 'text/csv' }, { type: 'text', text: '分析文件' }]);
    wrapper.unmount();
  });

  it('失败重试沿用上传幂等键，未恢复前不能发送', async () => {
    mocks.upload.mockRejectedValueOnce(new Error('上传失败')).mockResolvedValue({ artifactID: 'file-2', kind: 'file', name: '数据.txt', mime: 'text/plain' });
    const wrapper = mount(AiChatInput);
    await choose(wrapper, new File(['分析数据'], '数据.txt'));
    await flushPromises();
    expect(wrapper.text()).toContain('上传失败');
    await wrapper.get('textarea').trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('send')).toBeUndefined();
    await wrapper.findAll('button').find((button) => button.text() === '重试上传')!.trigger('click');
    await flushPromises();
    expect(mocks.upload.mock.calls[0]![1]).toEqual(mocks.upload.mock.calls[1]![1]);
    await wrapper.get('textarea').trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('send')).toHaveLength(1);
    wrapper.unmount();
  });

  it('卸载取消上传，迟到回复不能发出文件', async () => {
    let resolve!: (value: any) => void;
    mocks.upload.mockImplementation(() => new Promise((done) => { resolve = done; }));
    const wrapper = mount(AiChatInput);
    await choose(wrapper, new File(['test'], '数据.txt'));
    const signal = mocks.upload.mock.calls[0]![2] as AbortSignal;
    wrapper.unmount();
    expect(signal.aborted).toBe(true);
    resolve({ artifactID: 'late', kind: 'file', name: '数据.txt', mime: 'text/plain' });
    await flushPromises();
    expect(wrapper.emitted('send')).toBeUndefined();
  });

  it('拒绝空文件和不允许的格式，不发起网络上传', async () => {
    const wrapper = mount(AiChatInput);
    await choose(wrapper, new File([], '空.txt'));
    expect(wrapper.text()).toContain('文件为空');
    await choose(wrapper, new File(['binary'], '文件.exe'));
    expect(wrapper.text()).toContain('暂不支持此格式');
    expect(mocks.upload).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('允许新文档格式进入私有上传队列', async () => {
    mocks.upload.mockImplementation(async (file: File) => ({ artifactID: file.name, kind: 'file', name: file.name, mime: file.type }));
    const wrapper = mount(AiChatInput);
    for (const file of [
      new File(['# 手册'], '手册.md', { type: 'text/markdown' }),
      new File(['word'], '报告.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
      new File(['slides'], '汇报.pptx', { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }),
      new File(['<h1>标题</h1>'], '页面.html', { type: 'text/html' }),
      new File(['bmp'], '图像.bmp', { type: 'image/bmp' }),
    ]) await choose(wrapper, file);
    await flushPromises();
    expect(mocks.upload).toHaveBeenCalledTimes(5);
    expect(wrapper.text()).not.toContain('暂不支持此格式');
    wrapper.unmount();
  });

  it('拖拽与粘贴共用私有上传，超出 10 个文件不继续上传', async () => {
    mocks.upload.mockImplementation(async (file: File) => ({ artifactID: file.name, kind: file.type.startsWith('image/') ? 'image' : 'file', name: file.name, mime: file.type }));
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const wrapper = mount(AiChatInput);
    await wrapper.get('textarea').trigger('paste', { clipboardData: { files: [new File(['image'], '粘贴.png', { type: 'image/png' })] } });
    await flushPromises();
    expect(mocks.upload).toHaveBeenCalledTimes(1);
    await wrapper.trigger('drop', { dataTransfer: { files: Array.from({ length: 10 }, (_, i) => new File(['内容'], `${i}.txt`, { type: 'text/plain' })) } });
    await flushPromises();
    expect(mocks.upload).toHaveBeenCalledTimes(10);
    expect(wrapper.text()).toContain('最多 10 个附件');
    wrapper.unmount();
    vi.restoreAllMocks();
  });

});
