/** 文件说明：报告 Markdown 的安全展示，禁止原始 HTML 和自动外链媒体加载。 */
import DOMPurify from 'dompurify';
import { Marked } from 'marked';

/** escapeAttribute 防止 URL 中的引号突破链接属性边界。 */
function escapeAttribute(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

/** 独立解析器不修改其他 Markdown 组件；链接在生成 HTML 前先校验协议。 */
const parser = new Marked({ renderer: {
  html: () => '',
  image: () => '',
  link({ href, tokens }) {
    const label = this.parser.parseInline(tokens);
    try {
      const url = new URL(href, 'https://relative.invalid');
      if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) return label;
      return `<a href="${escapeAttribute(href)}" rel="noopener noreferrer">${label}</a>`;
    } catch { return label; }
  },
} });

/** 仅输出净化后的报告说明，点击链接由用户主动触发。 */
export function reportMarkdown(text: string): string {
  return DOMPurify.sanitize(parser.parse(text, { async: false }), {
    FORBID_TAGS: ['img', 'video', 'audio', 'iframe', 'object', 'embed', 'style', 'form', 'input'],
    FORBID_ATTR: ['style', 'src', 'srcset'],
  });
}
