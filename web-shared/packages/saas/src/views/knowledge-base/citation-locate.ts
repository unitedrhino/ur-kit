/**
 * 文件说明：知识库证据 chip → 原文定位的共享算法与 URL 参数编解码。
 * 坐标合同：charStart/charEnd 为解析全文中的码点（rune）下标，闭开区间 [start, end)，
 * 与后端 ai_knowledge_artifacts.char_start 字段及 chunkAnchors 响应一致；
 * 前端用 Array.from 展开字符串后按码点索引消费。
 */

/** 三态定位反馈：exact 精确命中；page 仅定位到页/参考位置；miss 未找到。 */
export type CitationLocateStatus = 'exact' | 'page' | 'miss';

/** 证据 chip 携带的定位请求，字段与 KnowledgeSearchHit 的跳转参数对应。 */
export interface CitationLocateRequest {
  artifactID?: number;
  chunkIndex?: number;
  /** 检索时记录的偏移；可能与当前全文漂移，仅在没有更可靠锚点时使用。 */
  charStart?: number;
  charEnd?: number;
  /** 来源页码（0 基），PDF 定位的先验页。 */
  pageIdx?: number;
  /** 兜底引文：切片内容或摘要前缀，用于偏移失效时的全文搜索。 */
  quote?: string;
}

/** 后端 chunkAnchors 返回的切片锚点（打开文档时实时装配，不随历史偏移漂移）。 */
export interface CitationLocateAnchor {
  artifactID?: number;
  chunkIndex?: number;
  charStart: number;
  charEnd: number;
  pageIdx?: number;
}

export interface CitationLocateResult {
  status: CitationLocateStatus;
  /** 命中区间（码点下标）；仅 exact 且在文本视图中有效。 */
  charStart?: number;
  charEnd?: number;
  /** 命中页（0 基）；PDF 视图与 page 态下提供。 */
  pageIndex?: number;
  /** 显示在文档名下方的三态反馈文案。 */
  message: string;
}

/** 打开文档时写入 URL 的定位参数键（短键保持链接简洁）。 */
export interface CitationLocateQuery {
  chunk?: number;
  cs?: number;
  ce?: number;
  pi?: number;
  q?: string;
}

/** 兜底引文长度：与任务口径一致，取切片内容/摘要前 50 字搜索。 */
export const CITATION_QUOTE_MAX_LENGTH = 50;

/** buildCitationQuote 从切片内容与摘要中生成兜底引文前缀。 */
export function buildCitationQuote(content?: string, snippet?: string): string {
  const source = (content || snippet || '').trim();
  if (source.length <= CITATION_QUOTE_MAX_LENGTH) return source;
  return source.slice(0, CITATION_QUOTE_MAX_LENGTH);
}

/** buildCitationLocateQuery 把证据引用转成 URL 定位参数；无文档级信息时不生成。 */
export function buildCitationLocateQuery(citation: {
  chunkIndex?: number;
  charStart?: number;
  charEnd?: number;
  pageIdx?: number;
  content?: string;
  snippet?: string;
}): CitationLocateQuery {
  const quote = buildCitationQuote(citation.content, citation.snippet);
  const query: CitationLocateQuery = {
    chunk: citation.chunkIndex,
    cs: citation.charStart && citation.charEnd ? citation.charStart : undefined,
    ce: citation.charStart && citation.charEnd ? citation.charEnd : undefined,
    pi: citation.pageIdx,
    q: quote || undefined,
  };
  return query;
}

/** parseCitationLocateQuery 从路由 query 中还原定位请求；参数缺失或非法时返回 null。 */
export function parseCitationLocateQuery(query: Record<string, unknown>): CitationLocateRequest | null {
  const toNumber = (value: unknown): number | undefined => {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };
  const request: CitationLocateRequest = {
    chunkIndex: toNumber(query.chunk),
    charStart: toNumber(query.cs),
    charEnd: toNumber(query.ce),
    pageIdx: toNumber(query.pi),
    quote: typeof query.q === 'string' && query.q.trim() ? query.q.trim() : undefined,
  };
  const hasSignal = Object.values(request).some((value) => value !== undefined);
  return hasSignal ? request : null;
}

/** normalizeForMatch 归一化匹配文本：折叠全部空白，容忍解析产物间的换行差异。 */
export function normalizeForMatch(text: string): string {
  return text.replace(/\s+/gu, '');
}

/** findNormalizedMatches 返回 needle 在 haystack 中全部归一化命中的码点区间。 */
export function findNormalizedMatches(text: string, needle: string): Array<{ start: number; end: number }> {
  const haystack = normalizeForMatch(text);
  const target = normalizeForMatch(needle);
  if (target.length < 2) return [];
  const matches: Array<{ start: number; end: number }> = [];
  let from = 0;
  for (;;) {
    const at = haystack.indexOf(target, from);
    if (at < 0) break;
    matches.push({ start: at, end: at + target.length });
    from = at + 1;
  }
  return matches;
}

/**
 * locateCitationInText 在解析全文中定位证据引用，产出三态反馈。
 * 优先级：后端实时锚点 → 引文全文唯一匹配 → 检索偏移参考 → 未找到。
 * 归一化匹配只用于"是否存在/唯一性"判定，文本视图高亮区间需换算回原文字符串下标。
 */
export function locateCitationInText(
  text: string,
  request: CitationLocateRequest,
  anchors: CitationLocateAnchor[] = [],
): CitationLocateResult {
  const anchor = pickCitationAnchor(request, anchors);
  if (anchor && anchor.charEnd > anchor.charStart) {
    return {
      status: 'exact',
      charStart: anchor.charStart,
      charEnd: anchor.charEnd,
      pageIndex: anchor.pageIdx,
      message: '已定位到引用内容',
    };
  }

  const quote = (request.quote || '').trim();
  if (quote) {
    const matches = findNormalizedMatches(text, quote);
    if (matches.length === 1) {
      const range = normalizedRangeToTextRange(text, quote, matches[0]?.start ?? 0);
      if (range) {
        return { status: 'exact', ...range, pageIndex: request.pageIdx, message: '已定位到引用内容' };
      }
    }
    if (matches.length > 1) {
      const range = normalizedRangeToTextRange(text, quote, matches[0]?.start ?? 0);
      const at = request.pageIdx !== undefined ? `第 ${request.pageIdx + 1} 页` : '参考位置';
      return {
        status: 'page',
        ...range,
        pageIndex: request.pageIdx,
        message: `找到 ${matches.length} 处相似内容，未能唯一定位，已跳到${at}`,
      };
    }
    // 归一化未命中：保留检索偏移作为参考位置，明确降级而不是谎报精确命中。
    if (request.charStart !== undefined && request.charEnd !== undefined && request.charEnd > request.charStart) {
      return { status: 'page', charStart: request.charStart, charEnd: request.charEnd, pageIndex: request.pageIdx, message: '内容比对失败，已跳到检索记录的参考位置' };
    }
    return { status: 'miss', pageIndex: request.pageIdx, message: '未能在当前文档中定位引用内容，文档可能已更新' };
  }

  if (request.charStart !== undefined && request.charEnd !== undefined && request.charEnd > request.charStart) {
    return { status: 'exact', charStart: request.charStart, charEnd: request.charEnd, pageIndex: request.pageIdx, message: '已按检索记录位置定位' };
  }
  if (request.pageIdx !== undefined) {
    return { status: 'page', pageIndex: request.pageIdx, message: `仅定位到第 ${request.pageIdx + 1} 页，未能精确匹配引用内容` };
  }
  return { status: 'miss', message: '未能在当前文档中定位引用内容' };
}

/** pickCitationAnchor 按 artifactID（优先）或 chunkIndex 在锚点表中匹配当前切片。 */
export function pickCitationAnchor(
  request: CitationLocateRequest,
  anchors: CitationLocateAnchor[],
): CitationLocateAnchor | undefined {
  if (request.artifactID) {
    const byArtifact = anchors.find((anchor) => anchor.artifactID === request.artifactID);
    if (byArtifact && byArtifact.charEnd > byArtifact.charStart) return byArtifact;
  }
  if (request.chunkIndex !== undefined) {
    const byChunk = anchors.find((anchor) => anchor.chunkIndex === request.chunkIndex);
    if (byChunk && byChunk.charEnd > byChunk.charStart) return byChunk;
  }
  return undefined;
}

/**
 * normalizedRangeToTextRange 把归一化命中起点换算回原文字符串下标区间。
 * 归一化删除了空白，因此从命中起点开始逐个原文码点重放归一化序列；
 * 换算失败返回 undefined，调用方退化为"仅页"反馈。
 */
export function normalizedRangeToTextRange(
  text: string,
  quote: string,
  normalizedStart: number,
): { charStart: number; charEnd: number } | undefined {
  const needle = normalizeForMatch(quote);
  if (!needle) return undefined;
  const chars = Array.from(text);
  let normalized = 0;
  let charStart = -1;
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i] ?? '';
    if (/\s/u.test(ch)) continue;
    if (normalized === normalizedStart) {
      charStart = i;
      break;
    }
    normalized++;
  }
  if (charStart < 0) return undefined;
  // 从 charStart 起收集 needle 长度的非空白码点，允许区间内包含空白。
  let collected = 0;
  let charEnd = chars.length;
  for (let i = charStart; i < chars.length; i++) {
    if (!/\s/u.test(chars[i] ?? '')) {
      collected++;
      if (collected === needle.length) {
        charEnd = i + 1;
        break;
      }
    }
  }
  if (collected < needle.length) return undefined;
  return { charStart, charEnd };
}
