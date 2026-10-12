/** 文件说明：图片、视频预览使用鉴权签名链接，覆盖续签、格式降级和恶意地址。 */
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AiAttachment from './AiAttachment.vue';

const mocks = vi.hoisted(() => ({ metadata: vi.fn(), download: vi.fn() }));
vi.mock('./api', () => ({ getChatAttachment: mocks.metadata, getChatAttachmentDownload: mocks.download }));
const metadata = { artifactID: 'file', name: '图片.png', kind: 'image', status: 'ready', mime: 'image/png', size: 100, expiresAt: String(Date.now() + 86400000) };
beforeEach(() => { mocks.metadata.mockReset(); mocks.download.mockReset(); });

describe('对话媒体附件', () => {
  it('图片放大层消费 Esc，不关闭外层工作台', async () => {
    mocks.metadata.mockResolvedValue(metadata);
    mocks.download.mockResolvedValue({ url: 'https://files.example/image', expiresAt: String(Date.now() + 60000) });
    const wrapper = mount(AiAttachment, { attachTo: document.body, props: { artifactID: 'file' } });
    await flushPromises();
    const outerEscape = vi.fn();
    document.addEventListener('keydown', outerEscape);
    await wrapper.get('dialog').trigger('keydown', { key: 'Escape' });
    expect(outerEscape).not.toHaveBeenCalled();
    document.removeEventListener('keydown', outerEscape);
    wrapper.unmount();
  });

  it('图片链接过期后重新鉴权续签，不重传文件', async () => {
    mocks.metadata.mockResolvedValue(metadata);
    mocks.download.mockResolvedValueOnce({ url: 'https://files.example/old', expiresAt: String(Date.now() - 1) }).mockResolvedValue({ url: 'https://files.example/new', expiresAt: String(Date.now() + 60000) });
    const wrapper = mount(AiAttachment, { props: { artifactID: 'file' } });
    await flushPromises();
    await wrapper.get('button img').trigger('error'); await flushPromises();
    expect(mocks.download).toHaveBeenCalledTimes(2);
    expect(wrapper.get('button img').attributes('src')).toBe('https://files.example/new');
    wrapper.unmount();
  });

  it('视频使用原生 controls，不支持编码时保留下载入口', async () => {
    mocks.metadata.mockResolvedValue({ ...metadata, kind: 'video', name: '视频.mp4', mime: 'video/mp4' });
    mocks.download.mockResolvedValue({ url: 'https://files.example/video', expiresAt: String(Date.now() + 60000) });
    const wrapper = mount(AiAttachment, { props: { artifactID: 'file' } });
    await flushPromises();
    expect(wrapper.get('video').attributes('controls')).toBeDefined();
    await wrapper.get('video').trigger('error');
    expect(wrapper.text()).toContain('浏览器无法预览'); expect(wrapper.text()).toContain('下载');
    wrapper.unmount();
  });

  it('拒绝可执行预览地址，权限失败不显示媒体', async () => {
    mocks.metadata.mockResolvedValue(metadata);
    mocks.download.mockResolvedValue({ url: 'javascript:alert(1)', expiresAt: '0' });
    const wrapper = mount(AiAttachment, { props: { artifactID: 'file' } });
    await flushPromises();
    expect(wrapper.get('[role=alert]').text()).toContain('下载地址无效');
    expect(wrapper.find('img').exists()).toBe(false);
    mocks.metadata.mockRejectedValue(new Error('附件不存在或无权访问'));
    await wrapper.setProps({ artifactID: 'other' }); await flushPromises();
    expect(wrapper.get('[role=alert]').text()).toContain('无权访问');
    expect(wrapper.text()).not.toContain('图片.png');
    wrapper.unmount();
  });
  it('视频续签后恢复播放位置且不自动播放', async () => {
    mocks.metadata.mockResolvedValue({ ...metadata, kind: 'video', name: '视频.mp4' });
    mocks.download.mockResolvedValueOnce({ url: 'https://files.example/old', expiresAt: String(Date.now() - 1) }).mockResolvedValue({ url: 'https://files.example/new', expiresAt: String(Date.now() + 60000) });
    const wrapper = mount(AiAttachment, { props: { artifactID: 'file' } });
    await flushPromises();
    (wrapper.get('video').element as HTMLVideoElement).currentTime = 12;
    await wrapper.get('video').trigger('error'); await flushPromises();
    await wrapper.get('video').trigger('loadedmetadata');
    expect((wrapper.get('video').element as HTMLVideoElement).currentTime).toBe(12);
    expect(wrapper.get('video').attributes('autoplay')).toBeUndefined();
    wrapper.unmount();
  });

});
