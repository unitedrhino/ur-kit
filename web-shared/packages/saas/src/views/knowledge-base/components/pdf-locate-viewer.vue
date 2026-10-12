<!-- 文件说明：PDF 引用定位预览。pdfjs 直接驱动页面渲染与文本层，按证据引文在页内
     匹配唯一位置并覆盖高亮、滚动到位，产出三态反馈（精确/仅页/未找到）。
     采用 RAGFlow pdf-preview 同款"文本层匹配换算高亮"模式；react-pdf-highlighter 为
     React 生态组件无法在 Vue3 直接复用，故复刻其底层 pdfjs 换算逻辑。 -->
<script setup lang="ts">
import type { CitationLocateResult } from '../citation-locate';

import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue';

import { ChevronLeft, ChevronRight, Crosshair, ZoomIn, ZoomOut } from 'lucide-vue-next';
import { NButton } from 'naive-ui';

import { normalizeForMatch } from '../citation-locate';

/** 引文匹配文本索引：拼接文本层各文本节点并记录起点，用于把命中还原为 DOM Range。 */
interface TextIndex {
  text: string;
  nodes: Array<{ node: Text; start: number }>;
}

const props = defineProps<{ filename: string; pageIndex?: number; quote?: string; url: string }>();
/** located 上报三态定位结果；error 上报加载失败并附带未找到反馈。 */
const emit = defineEmits<{ located: [result: CitationLocateResult] }>();

type PdfJs = typeof import('pdfjs-dist/legacy/build/pdf.mjs');
type PdfDocument = Awaited<ReturnType<PdfJs['getDocument']>['promise']>;
type PdfPage = Awaited<ReturnType<PdfDocument['getPage']>>;

/** 覆盖高亮，坐标为页框百分比。kind: text 命中文本；page 整页提示框。 */
interface PageMark {
  height: number;
  kind: 'text' | 'page';
  left: number;
  top: number;
  width: number;
}

const scroller = ref<HTMLElement>();
const loading = ref(false);
const error = ref('');
const pageCount = ref(0);
const currentPage = ref(1);
const zoom = ref(1);
/** 页宽高比：未渲染的页借用首页比例占位，避免滚动跳动。 */
const ratios = reactive<Record<number, number>>({});
const marks = reactive<Record<number, PageMark[]>>({});
const pdf = shallowRef<PdfDocument>();
const locateResult = ref<CitationLocateResult | null>(null);

const pageElements = new Map<number, HTMLElement>();
interface RenderEntry {
  scale: number;
  done?: Promise<void>;
  task?: { cancel: () => void };
  textLayer?: { cancel: () => void };
}
const rendered = new Map<number, RenderEntry>();
const renderOrder: number[] = [];
const pageTexts = new Map<number, string>();
let pdfjs: PdfJs | null = null;
let loadingTask: { destroy: () => Promise<void> } | null = null;
let observer: IntersectionObserver | null = null;
let resizeObserver: ResizeObserver | null = null;
let containerWidth = 0;
let disposed = false;
let locateVersion = 0;

const MAX_RENDERED_PAGES = 12;
const PAGE_GAP = 12;

const pageLabel = computed(() => (pageCount.value ? `${currentPage.value} / ${pageCount.value}` : ''));

function pageStyle(page: number) {
  return { aspectRatio: `1 / ${ratios[page] || ratios[1] || 1.414}`, width: `${zoom.value * 100}%` };
}

function setPageRef(page: number, el: unknown) {
  const node = el as HTMLElement | null;
  const previous = pageElements.get(page);
  if (previous && previous !== node) observer?.unobserve(previous);
  if (node) {
    pageElements.set(page, node);
    observer?.observe(node);
  } else {
    pageElements.delete(page);
  }
}

async function loadPdfJs(): Promise<PdfJs> {
  const lib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  // worker 与库同版本打包；?url 引用保证任意静态服务器都以 JS MIME 提供。
  if (!lib.GlobalWorkerOptions.workerSrc) {
    const workerUrl = (await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')).default;
    lib.GlobalWorkerOptions.workerSrc = workerUrl;
  }
  return lib;
}

async function load() {
  error.value = '';
  loading.value = true;
  locateResult.value = null;
  try {
    pdfjs = await loadPdfJs();
    const response = await fetch(props.url);
    if (!response.ok) throw new Error(`PDF 读取失败（${response.status}）`);
    const data = new Uint8Array(await response.arrayBuffer());
    const task = pdfjs.getDocument({ data });
    loadingTask = task as unknown as { destroy: () => Promise<void> };
    const doc = await task.promise;
    if (disposed) {
      await task.destroy();
      return;
    }
    pdf.value = doc;
    pageCount.value = doc.numPages;
    const first = await doc.getPage(1);
    const viewport = first.getViewport({ scale: 1 });
    ratios[1] = viewport.height / viewport.width;
    await nextTick();
    containerWidth = scroller.value?.clientWidth ? scroller.value.clientWidth - PAGE_GAP : 600;
    await applyLocate();
  } catch {
    if (!disposed) {
      error.value = 'PDF 加载失败，请重试或下载原文件';
      emitLocated({ message: '未能加载文档，无法定位引用内容', status: 'miss' });
    }
  } finally {
    if (!disposed) loading.value = false;
  }
}

/** pageText 读取并缓存指定页（1 基）的文本，供引文匹配。 */
async function pageText(pageNumber: number): Promise<string> {
  const cached = pageTexts.get(pageNumber);
  if (cached !== undefined) return cached;
  const doc = pdf.value;
  if (!doc) return '';
  try {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items.map((item) => ('str' in item ? item.str + (item.hasEOL ? '\n' : '') : '')).join('');
    pageTexts.set(pageNumber, text);
    return text;
  } catch {
    return '';
  }
}

function emitLocated(result: CitationLocateResult) {
  locateResult.value = result;
  emit('located', result);
}

/** applyLocate 在页文本中定位引文：先验页优先，其次全页唯一匹配，最后降级页级/未找到。 */
async function applyLocate() {
  const version = ++locateVersion;
  clearMarks();
  const quote = (props.quote || '').trim();
  const priorPage = props.pageIndex !== undefined ? props.pageIndex + 1 : 0;
  if (!pdf.value || !pageCount.value) {
    emitLocated({ message: '未能加载文档，无法定位引用内容', status: 'miss' });
    return;
  }
  if (!quote || normalizeForMatch(quote).length < 2) {
    if (priorPage >= 1 && priorPage <= pageCount.value) {
      addMark(priorPage, { kind: 'page', left: 0, top: 0, width: 1, height: 1 });
      scrollToPage(priorPage, 0);
      emitLocated({ message: `仅定位到第 ${priorPage} 页，未能精确匹配引用内容`, pageIndex: priorPage - 1, status: 'page' });
    } else {
      emitLocated({ message: '未能在当前文档中定位引用内容', status: 'miss' });
    }
    return;
  }
  // 先在先验页匹配；失败后全页扫描，统计全部匹配位置再决定精确或页级。
  const hits: Array<{ occurrence: number; page: number }> = [];
  const scanPage = async (page: number): Promise<number> => {
    const text = await pageText(page);
    if (version !== locateVersion || !text) return 0;
    const haystack = normalizeForMatch(text);
    const needle = normalizeForMatch(quote);
    let count = 0;
    let from = 0;
    for (;;) {
      const at = haystack.indexOf(needle, from);
      if (at < 0) break;
      hits.push({ occurrence: count, page });
      count++;
      from = at + 1;
    }
    return count;
  };
  if (priorPage >= 1 && priorPage <= pageCount.value) await scanPage(priorPage);
  if (version !== locateVersion) return;
  if (hits.length === 0) {
    for (let page = 1; page <= pageCount.value; page++) {
      if (page === priorPage) continue;
      await scanPage(page);
      if (version !== locateVersion) return;
      if (hits.length > 0) break;
    }
  }
  const target = hits[0];
  if (!target) {
    if (priorPage >= 1 && priorPage <= pageCount.value) {
      addMark(priorPage, { kind: 'page', left: 0, top: 0, width: 1, height: 1 });
      scrollToPage(priorPage, 0);
      emitLocated({ message: `内容比对失败，已定位到第 ${priorPage} 页`, pageIndex: priorPage - 1, status: 'page' });
    } else {
      emitLocated({ message: '未能在当前文档中定位引用内容，文档可能已更新', status: 'miss' });
    }
    return;
  }
  const multiple = hits.length > 1;
  const top = await markTextHit(target.page, target.occurrence, version);
  if (version !== locateVersion) return;
  if (top === null) {
    // 文本层画不出高亮（扫描页无文本层）时降级为页级提示。
    addMark(target.page, { kind: 'page', left: 0, top: 0, width: 1, height: 1 });
    scrollToPage(target.page, 0);
    emitLocated({
      message: `仅定位到第 ${target.page} 页，未能精确匹配引用内容`,
      pageIndex: target.page - 1,
      status: 'page',
    });
    return;
  }
  scrollToPage(target.page, top);
  emitLocated({
    message: multiple ? `找到 ${hits.length} 处相似内容，已跳到第 ${target.page} 页第一处` : '已定位到引用内容',
    pageIndex: target.page - 1,
    status: multiple ? 'page' : 'exact',
  });
}

/** markTextHit 渲染目标页并在文本层中为第 occurrence 处匹配画高亮，返回首个高亮的页内纵向比例。 */
async function markTextHit(pageNumber: number, occurrence: number, version: number): Promise<number | null> {
  await renderPage(pageNumber);
  const entry = rendered.get(pageNumber);
  if (entry?.done) await entry.done;
  await nextTick();
  if (version !== locateVersion || disposed) return null;
  const el = pageElements.get(pageNumber);
  const layer = el?.querySelector('.textLayer');
  if (!el || !layer || !props.quote) return null;
  const ranges = findQuoteRanges(layer, props.quote);
  const range = ranges[occurrence] ?? (occurrence === 0 ? ranges[0] : undefined);
  if (!range) return null;
  const pageBox = el.getBoundingClientRect();
  let top = 1;
  for (const rect of Array.from(range.getClientRects())) {
    if (rect.width < 0.5 || rect.height < 0.5) continue;
    const mark: PageMark = {
      height: rect.height / pageBox.height,
      kind: 'text',
      left: (rect.left - pageBox.left) / pageBox.width,
      top: (rect.top - pageBox.top) / pageBox.height,
      width: rect.width / pageBox.width,
    };
    addMark(pageNumber, mark);
    top = Math.min(top, mark.top);
  }
  return marks[pageNumber]?.length ? top : null;
}

/** buildTextIndex 拼接文本层文本节点并记录起点，空白归一化后匹配。 */
function buildTextIndex(root: Node): TextIndex {
  const nodes: TextIndex['nodes'] = [];
  let text = '';
  const walker = (root.ownerDocument || document).createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => (node.nodeValue ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    nodes.push({ node: node as Text, start: text.length });
    text += (node as Text).nodeValue + ' ';
  }
  return { text, nodes };
}

/** findQuoteRanges 在文本层中查找引文全部归一化命中并转为 DOM Range。 */
function findQuoteRanges(root: Node, quote: string): Range[] {
  const index = buildTextIndex(root);
  const haystack = normalizeForMatch(index.text);
  const needle = normalizeForMatch(quote);
  if (needle.length < 2) return [];
  // 归一化下标 → 拼接文本下标：重放字符映射（拼接文本中的空白也占位）。
  const map: number[] = [];
  let normalized = 0;
  for (let i = 0; i < index.text.length; i++) {
    if (/\s/u.test(index.text[i] ?? '')) continue;
    map[normalized] = i;
    normalized++;
  }
  const ranges: Range[] = [];
  let from = 0;
  for (;;) {
    const at = haystack.indexOf(needle, from);
    if (at < 0) break;
    from = at + 1;
    const startUnit = map[at];
    const endUnit = (map[at + needle.length - 1] ?? index.text.length - 1) + 1;
    if (startUnit === undefined) continue;
    const range = rangeAtUnits(index, startUnit, endUnit);
    if (range) ranges.push(range);
  }
  return ranges;
}

/** rangeAtUnits 把拼接文本的 code unit 区间换算为跨节点 DOM Range。 */
function rangeAtUnits(index: TextIndex, startUnit: number, endUnit: number): Range | null {
  if (!index.nodes.length) return null;
  let startPoint: { node: Text; offset: number } | null = null;
  let endPoint: { node: Text; offset: number } | null = null;
  let consumed = 0;
  for (const { node } of index.nodes) {
    const len = node.nodeValue?.length || 0;
    if (!startPoint && startUnit <= consumed + len) startPoint = { node, offset: Math.max(0, startUnit - consumed) };
    if (startPoint && endUnit <= consumed + len) {
      endPoint = { node, offset: Math.max(0, endUnit - consumed) };
      break;
    }
    consumed += len;
  }
  if (!startPoint) return null;
  if (!endPoint) {
    const last = index.nodes[index.nodes.length - 1]?.node;
    if (!last) return null;
    endPoint = { node: last, offset: last.nodeValue?.length || 0 };
  }
  const range = document.createRange();
  range.setStart(startPoint.node, startPoint.offset);
  range.setEnd(endPoint.node, endPoint.offset);
  return range;
}

function clearMarks() {
  for (const key of Object.keys(marks)) delete marks[Number(key)];
}

function addMark(page: number, mark: PageMark) {
  (marks[page] ||= []).push(mark);
}

function scrollToPage(page: number, fraction: number) {
  const box = scroller.value;
  const el = pageElements.get(page);
  if (!box || !el) return;
  box.scrollTop = Math.max(0, el.offsetTop + el.offsetHeight * fraction - box.clientHeight / 3);
  currentPage.value = page;
}

function renderScale(page: PdfPage): number {
  const viewport = page.getViewport({ scale: 1 });
  return Math.max(200, containerWidth * zoom.value) / viewport.width;
}

async function renderPage(pageNumber: number): Promise<void> {
  const doc = pdf.value;
  const el = pageElements.get(pageNumber);
  if (!doc || !el || !pdfjs) return;
  let page: PdfPage;
  try {
    page = await doc.getPage(pageNumber);
  } catch {
    return;
  }
  if (disposed || pdf.value !== doc) return;
  const scale = renderScale(page);
  const existing = rendered.get(pageNumber);
  if (existing && Math.abs(existing.scale - scale) < 0.01) {
    if (existing.done) await existing.done;
    return;
  }
  existing?.task?.cancel();
  existing?.textLayer?.cancel();

  const viewport = page.getViewport({ scale });
  ratios[pageNumber] = viewport.height / viewport.width;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width * dpr);
  canvas.height = Math.floor(viewport.height * dpr);
  canvas.className = 'kb-pdf-page__canvas';

  const entry: RenderEntry = { scale };
  rendered.set(pageNumber, entry);
  touchRendered(pageNumber);
  entry.done = paintPage(pageNumber, page, el, canvas, viewport, dpr, entry);
  await entry.done;
}

async function paintPage(
  pageNumber: number,
  page: PdfPage,
  el: HTMLElement,
  canvas: HTMLCanvasElement,
  viewport: ReturnType<PdfPage['getViewport']>,
  dpr: number,
  entry: RenderEntry,
): Promise<void> {
  const lib = pdfjs;
  if (!lib) return;
  const task = page.render({ canvas, viewport, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined });
  entry.task = task as unknown as { cancel: () => void };
  try {
    await task.promise;
  } catch {
    return;
  }
  if (rendered.get(pageNumber) !== entry) return;

  const textDiv = document.createElement('div');
  textDiv.className = 'textLayer';
  el.style.setProperty('--scale-factor', String(entry.scale));
  el.style.setProperty('--total-scale-factor', String(entry.scale));
  const oldCanvas = el.querySelector('.kb-pdf-page__canvas');
  const oldText = el.querySelector('.textLayer');
  oldCanvas?.replaceWith(canvas);
  if (!oldCanvas) el.prepend(canvas);
  oldText?.remove();
  canvas.after(textDiv);

  const textLayer = new lib.TextLayer({
    textContentSource: page.streamTextContent(),
    container: textDiv,
    viewport,
  });
  entry.textLayer = textLayer as unknown as { cancel: () => void };
  try {
    await textLayer.render();
  } catch {
    // 文本层尽力渲染，失败不影响页面可读。
  }
}

function touchRendered(pageNumber: number) {
  const at = renderOrder.indexOf(pageNumber);
  if (at >= 0) renderOrder.splice(at, 1);
  renderOrder.push(pageNumber);
  while (renderOrder.length > MAX_RENDERED_PAGES) {
    unrenderPage(renderOrder.shift() ?? 0);
  }
}

function unrenderPage(pageNumber: number) {
  const entry = rendered.get(pageNumber);
  entry?.task?.cancel();
  entry?.textLayer?.cancel();
  rendered.delete(pageNumber);
  const el = pageElements.get(pageNumber);
  el?.querySelector('.kb-pdf-page__canvas')?.remove();
  el?.querySelector('.textLayer')?.remove();
}

function onIntersect(entries: IntersectionObserverEntry[]) {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const page = Number((entry.target as HTMLElement).dataset.page);
    if (page) void renderPage(page);
  }
}

function onScroll() {
  const box = scroller.value;
  if (!box) return;
  const mid = box.scrollTop + box.clientHeight / 3;
  for (const [page, el] of pageElements) {
    if (el.offsetTop <= mid && el.offsetTop + el.offsetHeight + PAGE_GAP > mid) {
      currentPage.value = page;
      break;
    }
  }
}

function rerenderVisible() {
  for (const page of [...rendered.keys()]) void renderPage(page);
}

function setZoom(next: number) {
  const box = scroller.value;
  const anchor = box ? box.scrollTop / Math.max(1, box.scrollHeight) : 0;
  zoom.value = Math.max(0.5, Math.min(3, Math.round(next * 10) / 10));
  void nextTick(() => {
    if (box) box.scrollTop = anchor * box.scrollHeight;
    rerenderVisible();
  });
}

function jumpPage(delta: number) {
  const target = Math.min(pageCount.value, Math.max(1, currentPage.value + delta));
  scrollToPage(target, 0);
}

watch(
  () => [props.url, props.quote, props.pageIndex] as const,
  () => {
    if (pdf.value) void applyLocate();
  },
);

onMounted(() => {
  observer = new IntersectionObserver(onIntersect, { root: scroller.value, rootMargin: '600px 0px' });
  resizeObserver = new ResizeObserver(() => {
    const width = scroller.value?.clientWidth ? scroller.value.clientWidth - PAGE_GAP : 0;
    if (width && Math.abs(width - containerWidth) > 8) {
      containerWidth = width;
      rerenderVisible();
    }
  });
  if (scroller.value) resizeObserver.observe(scroller.value);
  void load();
});

onBeforeUnmount(() => {
  disposed = true;
  locateVersion++;
  observer?.disconnect();
  resizeObserver?.disconnect();
  for (const page of [...rendered.keys()]) unrenderPage(page);
  void loadingTask?.destroy().catch(() => {});
});
</script>

<template>
  <div class="kb-pdf-locate relative flex min-h-0 flex-col overflow-hidden" data-testid="pdf-locate-viewer">
    <div v-if="loading && !pageCount" class="text-muted-foreground flex flex-1 items-center justify-center text-sm">正在加载 PDF…</div>
    <div v-else-if="error" role="alert" class="text-destructive p-4 text-sm">{{ error }}</div>
    <div v-else ref="scroller" class="bg-muted/30 relative min-h-0 flex-1 overflow-auto p-3 outline-none" tabindex="0" :aria-label="filename" @scroll.passive="onScroll">
      <div
        v-for="page in pageCount"
        :key="page"
        :ref="(el) => setPageRef(page, el)"
        :data-page="page"
        class="bg-background relative mx-auto mb-3 shadow-sm"
        :style="pageStyle(page)"
      >
        <div aria-hidden="true" class="pointer-events-none absolute inset-0 z-10">
          <div
            v-for="(mark, markIndex) in marks[page] || []"
            :key="markIndex"
            class="absolute rounded-sm"
            :class="mark.kind === 'text' ? 'bg-primary/25' : 'border-primary/60 border bg-transparent'"
            :style="{ left: `${mark.left * 100}%`, top: `${mark.top * 100}%`, width: `${mark.width * 100}%`, height: `${mark.height * 100}%` }"
          />
        </div>
      </div>
    </div>
    <div v-if="pageCount" class="bg-background/90 absolute right-3 bottom-3 z-20 flex items-center gap-1 rounded-md border px-1.5 py-1 text-xs shadow-sm">
      <span v-if="locateResult" class="text-muted-foreground mr-1 flex items-center gap-1" data-testid="pdf-locate-status">
        <Crosshair class="size-3" aria-hidden="true" />
      </span>
      <NButton quaternary size="tiny" :aria-label="'上一页'" @click="jumpPage(-1)"><ChevronLeft class="size-3.5" /></NButton>
      <span class="w-14 text-center tabular-nums">{{ pageLabel }}</span>
      <NButton quaternary size="tiny" :aria-label="'下一页'" @click="jumpPage(1)"><ChevronRight class="size-3.5" /></NButton>
      <NButton quaternary size="tiny" :aria-label="'缩小'" @click="setZoom(zoom - 0.2)"><ZoomOut class="size-3.5" /></NButton>
      <span class="w-10 text-center tabular-nums">{{ Math.round(zoom * 100) }}%</span>
      <NButton quaternary size="tiny" :aria-label="'放大'" @click="setZoom(zoom + 0.2)"><ZoomIn class="size-3.5" /></NButton>
    </div>
  </div>
</template>

<style scoped>
/* pdf.js 文本层最小样式（节选自 pdfjs-dist web/pdf_viewer.css），
   保证文本可选择、可搜索，高亮换算依赖 span 的真实布局位置。 */
.kb-pdf-locate :deep(.textLayer) {
  position: absolute;
  text-align: initial;
  inset: 0;
  overflow: clip;
  opacity: 1;
  line-height: 1;
  letter-spacing: normal;
  word-spacing: normal;
  text-size-adjust: none;
  forced-color-adjust: none;
  transform-origin: 0 0;
  z-index: 2;
  --min-font-size: 1;
  --text-scale-factor: calc(var(--total-scale-factor) * var(--min-font-size));
  --min-font-size-inv: calc(1 / var(--min-font-size));
}
.kb-pdf-locate :deep(.textLayer :is(span, br)) {
  color: transparent;
  position: absolute;
  white-space: pre;
  cursor: text;
  transform-origin: 0% 0%;
}
.kb-pdf-locate :deep(.textLayer > :not(.markedContent)),
.kb-pdf-locate :deep(.textLayer .markedContent span:not(.markedContent)) {
  z-index: 2;
  --font-height: 0;
  font-size: calc(var(--text-scale-factor) * var(--font-height));
  --scale-x: 1;
  --rotate: 0deg;
  transform: rotate(var(--rotate)) scaleX(var(--scale-x)) scale(var(--min-font-size-inv));
}
.kb-pdf-locate :deep(.textLayer .markedContent) {
  display: contents;
}
.kb-pdf-locate :deep(.textLayer ::selection) {
  background: color-mix(in srgb, AccentColor, transparent 50%);
  color: transparent;
}
.kb-pdf-locate :deep(.kb-pdf-page__canvas) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
</style>
