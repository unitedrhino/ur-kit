/**
 * 文件说明：解析正文的 mermaid 围栏分段，供阅读视图按段渲染图表或文本。
 */

/** start 是段在原文中的码点（code point）起点，供引用定位高亮按全文偏移拆段。 */
export type MermaidSegment = { code: string; start: number; type: 'mermaid' } | { start: number; type: 'text'; value: string };

/**
 * splitMermaidSegments 把解析正文按 ```mermaid 围栏拆为文本段与图表段。
 * 未闭合的 mermaid 开头视为普通文本（截断文档不做半截渲染）；
 * 围栏标记行不进入正文，空代码块同样按原样保留在文本段。
 * start 一律按码点累计，与后端 charStart/charEnd 的 rune 偏移坐标一致。
 */
export function splitMermaidSegments(text: string): MermaidSegment[] {
  const segments: MermaidSegment[] = [];
  const pattern = /```mermaid[^\S\n]*\n([\s\S]*?)```/g;
  let last = 0;
  let codePointCursor = 0;
  const pushText = (value: string) => {
    if (!value) return;
    segments.push({ type: 'text', value, start: codePointCursor });
    codePointCursor += Array.from(value).length;
  };
  for (const match of text.matchAll(pattern)) {
    pushText(text.slice(last, match.index));
    const code = (match[1] ?? '').replace(/\n$/, '');
    if (code.trim()) segments.push({ type: 'mermaid', code, start: codePointCursor });
    else pushText(match[0]);
    codePointCursor += Array.from(match[0]).length;
    last = (match.index ?? 0) + match[0].length;
  }
  pushText(text.slice(last));
  return segments;
}
