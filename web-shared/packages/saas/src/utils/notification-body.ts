import DOMPurify from 'dompurify'

/**
 * 站内信/通知正文在列表、Toast、横幅等处的**预览纯文本**。
 * 后端可能存 HTML（如 `<p>...</p>`），此处解析为纯文本，避免原样输出标签，且无 XSS 面。
 */
export function messageBodyToPreviewText(raw: string | undefined | null): string {
  if (raw == null || raw === '') return ''
  const s = String(raw).trim()
  if (!s) return ''
  if (!/<[a-z][\s\S]*>/i.test(s)) {
    return s.replace(/\s+/g, ' ').trim()
  }
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return s
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/p>/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }
  try {
    const doc = new DOMParser().parseFromString(s, 'text/html')
    const text = doc.body.textContent ?? ''
    return text.replace(/\s+/g, ' ').trim()
  } catch {
    return s
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/p>/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }
}

/**
 * 全屏弹窗等场景下渲染 HTML 正文：白名单 + DOMPurify，禁止 script/事件/onclick 等。
 * XSS 加固（fastbee 公告漏洞④对应修复）：
 * - FORBID_ATTR 显式剥离全部 on* 事件属性、style、formaction 等危险属性；
 * - 协议相对地址（//）与 javascript:/data: 由 DOMPurify 默认协议白名单拦截；
 * - 对不支持 DOMPurify 的环境降级为纯文本预览（无 XSS 面）。
 */
export function sanitizeUserMessageBodyHtml(html: string | undefined | null): string {
  if (html == null || html === '') return ''
  const s = String(html).trim()
  if (!s) return ''
  if (typeof window === 'undefined') {
    return messageBodyToPreviewText(s)
  }
  const clean = DOMPurify.sanitize(s, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'b',
      'em',
      'i',
      'u',
      'a',
      'ul',
      'ol',
      'li',
      'span',
      'h1',
      'h2',
      'h3',
      'h4',
      'blockquote',
      'code',
      'pre',
      'hr',
      'img',
      'figure',
      'figcaption',
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class', 'src', 'alt', 'width', 'height'],
    // 显式禁止事件属性与样式注入，防止组合输入下事件属性漏网
    FORBID_ATTR: ['style', 'formaction', 'srcdoc', 'xlink:href'],
    ALLOW_DATA_ATTR: false,
  })
  // 兜底：DOMPurify 在某些 DOM 实现（如 happy-dom）下对属性过滤不完整，
  // 再剥离一次残留的 on* 事件属性与危险协议，确保渲染安全。
  return clean
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*"(javascript|data|vbscript):[^"]*"/gi, '')
    .replace(/(href|src)\s*=\s*"[^"]*\/\/[^"]*"/gi, '')
}
