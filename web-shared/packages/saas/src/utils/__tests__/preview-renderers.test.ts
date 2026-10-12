// 验证支持的格式分流与无关渲染器不被加载。
import { describe, expect, it, vi } from 'vitest';
import { loadPreviewRenderer, previewFormat } from '../../views/knowledge-base/preview-renderers';
const state = vi.hoisted(() => ({ pdf: 0, word: 0 }));
vi.mock('@file-viewer/renderer-pdf', () => {
  state.pdf++;
  return { default: { name: 'pdf' } };
});
vi.mock('@file-viewer/renderer-word', () => {
  state.word++;
  return { default: { name: 'word' } };
});
describe('原文渲染器', () => {
  it.each([
    ['a.PDF', 'pdf'],
    ['a.docx', 'word'],
    ['a.xlsx', 'spreadsheet'],
    ['a.csv', 'spreadsheet'],
    ['a.md', 'text'],
    ['a.txt', 'text'],
    ['a.yaml', 'text'],
    ['a.png', 'image'],
    ['a.svg', 'image'],
    ...['dwg', 'dxf', 'dwf', 'dwfx', 'xps'].map((ext) => [`a.${ext}`, 'cad']),
  ])('%s 选择 %s', (filename, format) => {
    expect(previewFormat(filename!)).toBe(format);
  });
  it('只加载选中的引擎且复用结果', async () => {
    expect(state.pdf).toBe(0);
    const a = await loadPreviewRenderer('a.pdf');
    expect(await loadPreviewRenderer('b.pdf')).toBe(a);
    expect(state.pdf).toBe(1);
    expect(state.word).toBe(0);
  });
  it('不支持的格式不下载引擎', async () => {
    await expect(loadPreviewRenderer('a.exe')).rejects.toThrow('暂不支持');
  });
});
