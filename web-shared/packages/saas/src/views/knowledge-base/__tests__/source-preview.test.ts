/**
 * 文件说明：验证原文预览容器的嗅探分发、不可预览降级与加载失败重试。
 */
import { mount } from '@vue/test-utils';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import SourcePreview from '../source-preview.vue';

/** preview-renderers 只替换异步装配入口，保留 previewFormat/sniff 真实实现。 */
const mocks = vi.hoisted(() => ({
  viewer: vi.fn(),
  renderer: vi.fn(),
}));
vi.mock('../preview-renderers', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  loadPreviewViewer: mocks.viewer,
  loadRendererByFormat: mocks.renderer,
}));

vi.mock('@vben/preferences', () => ({ usePreferences: () => ({ isDark: { value: false } }) }));
vi.mock('naive-ui', () => ({
  NButton: { template: '<button><slot /></button>' },
  NSpin: { template: '<div role="status"><slot /></div>' },
}));

/** mockFetch 让嗅探请求返回给定字节样本。 */
function mockFetch(body: Uint8Array) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body.buffer as ArrayBuffer, { status: 200 })));
}

const stubViewer = { name: 'StubViewer', props: ['filename', 'url', 'options'], template: '<div data-test="stub-viewer" :data-name="filename" />' };

beforeEach(() => {
  mocks.viewer.mockReset();
  mocks.renderer.mockReset();
  mocks.viewer.mockResolvedValue(stubViewer);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

function mountPreview(props: Partial<{ filename: string; path: string; url: string }> = {}) {
  return mount(SourcePreview, {
    props: { filename: '附件', url: 'https://example.com/source-preview/file?token=abc', ...props },
  });
}

describe('原文预览降级与嗅探', () => {
  it('扩展名与内容均无法识别时显示降级态并提供下载入口', async () => {
    mockFetch(new Uint8Array([0x00, 0x01, 0x02, 0x03]));
    const wrapper = mountPreview({ filename: '未知文件', path: 'docs/未知文件' });
    await vi.waitFor(() => {
      expect(wrapper.find('[data-testid="source-preview-unsupported"]').exists()).toBe(true);
    });
    const download = wrapper.find('[data-testid="source-preview-download"]');
    expect(download.attributes('href')).toBe('https://example.com/source-preview/file?token=abc');
    expect(wrapper.text()).toContain('暂不支持在线预览');
    expect(mocks.renderer).not.toHaveBeenCalled();
  });

  it('无扩展名但内容为 PDF 时嗅探分发并装配渲染器', async () => {
    mockFetch(new TextEncoder().encode('%PDF-1.7'));
    mocks.renderer.mockResolvedValue({ name: 'pdf-renderer' });
    const wrapper = mountPreview({ filename: '无扩展名文件' });
    await vi.waitFor(() => {
      expect(mocks.renderer).toHaveBeenCalledWith('pdf');
    });
    await vi.waitFor(() => {
      expect(wrapper.find('[data-test="stub-viewer"]').exists()).toBe(true);
    });
    expect(wrapper.find('[data-test="stub-viewer"]').attributes('data-name')).toBe('preview.pdf');
  });

  it('渲染器或内容请求失败时显示可重试错误', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('网络失败')));
    const wrapper = mountPreview({ filename: '未知文件' });
    await vi.waitFor(() => {
      expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    });
    expect(wrapper.text()).toContain('预览加载失败');
  });
});
