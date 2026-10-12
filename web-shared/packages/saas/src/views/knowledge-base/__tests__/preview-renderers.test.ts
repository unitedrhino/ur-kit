/**
 * 文件说明：验证预览格式分发——扩展名命中直发、未知扩展名的内容嗅探兜底，
 * 以及 GLB 三维模型的独立引擎懒加载与成功请求缓存。
 */
/* eslint-disable unicorn/number-literal-case -- 魔数字面量按 prettier 规范保持小写 */
import { describe, expect, it, vi } from 'vitest';

/** 模型模块加载次数，确认格式识别本身不会下载重依赖。 */
const mocks = vi.hoisted(() => ({ modelImport: vi.fn() }));
vi.mock('@file-viewer/renderer-3d', () => {
  mocks.modelImport();
  return { default: { id: 'model-renderer' } };
});
vi.mock('../../../locales', () => ({ $t: (key: string) => key }));

import { loadPreviewRenderer, previewFormat, sniffPreviewFormat } from '../preview-renderers';

/** bytes 便捷构造字节样本。 */
function bytes(...values: number[]): Uint8Array {
  return new Uint8Array(values);
}

/** utf8Bytes 用 TextEncoder 构造真实 UTF-8 字节样本。 */
function utf8Bytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

describe('未知扩展嗅探兜底', () => {
  it('扩展名命中时直接分发，不走嗅探', () => {
    expect(previewFormat('报告.pdf')).toBe('pdf');
    expect(previewFormat('数据.json')).toBe('text');
    expect(previewFormat('未知.zzz')).toBeUndefined();
  });

  it('pdf 魔数识别为 pdf 格式', () => {
    expect(sniffPreviewFormat(utf8Bytes('%PDF-1.7 rest'))).toBe('pdf');
  });

  it('常见图片魔数识别为 image 格式', () => {
    expect(sniffPreviewFormat(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe('image');
    expect(sniffPreviewFormat(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('image');
    expect(sniffPreviewFormat(utf8Bytes('GIF89a'))).toBe('image');
    expect(sniffPreviewFormat(utf8Bytes('RIFF....WEBPVP8 '))).toBe('image');
  });

  it('html 与 json 文本内容识别为 text 格式', () => {
    expect(sniffPreviewFormat(utf8Bytes('<!DOCTYPE html><html></html>'))).toBe('text');
    expect(sniffPreviewFormat(utf8Bytes('<html lang="zh">'))).toBe('text');
    expect(sniffPreviewFormat(utf8Bytes('{"module":"网关配置"}'))).toBe('text');
    expect(sniffPreviewFormat(utf8Bytes('[1, 2, 3]'))).toBe('text');
  });

  it('截断的多字节 UTF-8 尾部不误判为二进制', () => {
    const text = utf8Bytes('知识库配置 ');
    // 补一个被截断的三字节序列（中文字符前两字节）
    expect(sniffPreviewFormat(new Uint8Array([...text, 0xe7, 0x9f]))).toBe('text');
  });

  it('含 nul 或非法 UTF-8 的二进制内容不嗅探出格式', () => {
    expect(sniffPreviewFormat(bytes(0x00, 0x01, 0x02, 0x03))).toBeUndefined();
    expect(sniffPreviewFormat(bytes(0xff, 0xfe, 0x00, 0x00))).toBeUndefined();
    // EBML 容器（webm/matroska）无文本渲染价值
    expect(sniffPreviewFormat(bytes(0x1a, 0x45, 0xdf, 0xa3))).toBeUndefined();
  });

  it('空样本退化为文本渲染', () => {
    expect(sniffPreviewFormat(new Uint8Array())).toBe('text');
  });
});

describe('按格式加载 GLB 预览', () => {
  it('识别大写扩展名和签名查询串，保留既有 PDF/CAD 分发', () => {
    expect(previewFormat('模型/水泵.GLB?token=fixture#view')).toBe('model');
    expect(previewFormat('drawing.pdf')).toBe('pdf');
    expect(previewFormat('drawing.dwg')).toBe('cad');
    expect(previewFormat('model.gltf')).toBeUndefined();
    expect(mocks.modelImport).not.toHaveBeenCalled();
  });

  it('实际预览时才加载模型引擎，并复用同一加载结果', async () => {
    const [first, second] = await Promise.all([loadPreviewRenderer('pump.glb'), loadPreviewRenderer('motor.GLB')]);
    expect(first.id).toBe('model-renderer');
    expect(second).toBe(first);
    expect(mocks.modelImport).toHaveBeenCalledTimes(1);
  });
});
