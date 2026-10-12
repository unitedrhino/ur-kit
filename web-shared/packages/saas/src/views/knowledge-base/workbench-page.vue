<!-- 文件说明：知识库一体化文档工作区壳层，负责库/树/统计/详情加载、URL 导航与轮询协调；目录树、上传、ZIP、文档面板与设置拆分在 components/ 子组件。 -->
<script setup lang="ts">
import { $t } from '../../locales';
import type { LocationQueryRaw } from 'vue-router';

import type { CitationLocateRequest, CitationLocateResult } from './citation-locate';
import type { KnowledgeCompileStatusResp, KnowledgeDetail, KnowledgeFieldReferencePendingSummaryItem, KnowledgeItem, KnowledgeTreeNode } from './data';
import type { KnowledgeWorkbenchTab } from './workbench';

import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Badge } from '@unitedrhino/saas-ui/ui/badge';
import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@unitedrhino/saas-ui/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@unitedrhino/saas-ui/ui/dropdown-menu';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@unitedrhino/saas-ui/ui/empty';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@unitedrhino/saas-ui/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@unitedrhino/saas-ui/ui/tabs';
import { createReusableTemplate, useMediaQuery } from '@vueuse/core';
import { ArrowLeft, Download, Folder, MoreHorizontal, RefreshCw, Upload } from 'lucide-vue-next';

import { useTaskPolling } from '../../hooks/use-task-polling';
import { useToast } from '../../hooks/use-toast';
import { useSessionStore } from '../../store/session';
import { locateCitationInText, parseCitationLocateQuery } from './citation-locate';
import CompileProgressBar from './components/compile-progress-bar.vue';
import DocumentPane from './components/document-pane.vue';
import DocumentTree from './components/document-tree.vue';
import ImportDialog from './components/import-dialog.vue';
import SettingsPanel from './components/settings-panel.vue';
import ZipTransfer from './components/zip-transfer.vue';
import { statusLabel } from './data';
import { Api } from './index.api';
import { processingStageNames } from './processing';
import KnowledgeRetrievalPanel from './retrieval-panel.vue';
import SourcePreview from './source-preview.vue';
import {
  canWriteKnowledge,
  getErrorMessage,
  knowledgeStatusClass,
  normalizeDocumentID,
  normalizeDocumentView,
  normalizeKnowledgeWorkbenchTab,
  resolveDocumentSelection,
} from './workbench';

import './workbench.css';

const props = withDefaults(defineProps<Props>(), {
  mode: 'platform',
  listPath: '/ai-center/knowledge-base',
});

/** 一个目录模板复用于桌面和临时侧栏，保留重型 Tree 及所有节点操作。 */
const [DefineDirectory, ReuseDirectory] = createReusableTemplate();

interface Props {
  /** 返回列表的路由地址。 */
  listPath?: string;
  /** platform 拥有全部操作；tenant 中的平台共享库只读。 */
  mode?: 'platform' | 'tenant';
}

const route = useRoute();
const router = useRouter();
const sessionStore = useSessionStore();
const { toast } = useToast();

/** 当前知识库信息经 info/get-one 直连获取，深链进入不依赖列表分页。 */
const activeKnowledge = ref<KnowledgeItem | null>(null);
const activeId = ref(Number(route.params.id || 0));
const activeDocumentId = ref(0);
const selectedTreeKeys = ref<Array<number | string>>([]);
/** 最近选中的文件夹，作为头部上传的默认导入位置。 */
const selectedFolderNode = ref<KnowledgeTreeNode | null>(null);
const treeNodes = ref<KnowledgeTreeNode[]>([]);
const treeKeyword = ref('');
const treeLoading = ref(false);
const treeError = ref('');
const detail = ref<KnowledgeDetail | null>(null);
const detailLoading = ref(false);
const detailError = ref('');
const parsedFullText = ref('');
const parsedLoading = ref(false);
/** 解析结果请求失败与内容为空分别呈现；序号隔离同一文档的并发刷新。 */
const parsedError = ref('');
const compileStatus = ref<KnowledgeCompileStatusResp | null>(null);
const statusError = ref('');
/** URL 是文档视图唯一来源，前进后退与刷新无需额外同步。 */
const previewMode = computed(() => normalizeDocumentView(route.query.view));
const desktop = useMediaQuery('(min-width: 1024px)');
/** 关联视图仅临时覆盖目录显示，不改变用户此前收起偏好。 */
const directoryExpanded = ref(true);
const directoryOpen = ref(false);
const directoryVisible = computed(() => desktop.value && directoryExpanded.value && previewMode.value !== 'relations');
const expandedTreeKeys = ref<Array<number | string>>([]);
/** 目录、状态、详情与解析请求按序号隔离，覆盖 A→B→A 的旧响应回流。 */
let treeRequest = 0;
let statusRequest = 0;
let detailRequest = 0;
let parsedRequest = 0;
const workbenchTab = ref<KnowledgeWorkbenchTab>('content');
const retryLoading = ref(false);
const fullRetryLoading = ref(false);
/** 高级处理重试独立反馈，不干扰正文阅读和原有失败文档重试。 */
const processingRetrying = ref(false);
const processingRetryError = ref('');
/** 重跑确认：单阶段与全量重编译会替换既有产物，提交前需用户确认。 */
const retryConfirmOpen = ref(false);
const pendingRetryStage = ref('');
const pendingRetryAll = ref(false);
/** 字段引用失效计数：documentID → 数量，用于目录角标与关联视图提示条。 */
const fieldPendingSummary = ref<Record<number, number>>({});
/** 证据 chip 带入的引用定位请求；仅对打开时的目标文档生效，切换文档后失效。 */
const citationRequest = ref<CitationLocateRequest | null>(parseCitationLocateQuery(route.query));
const citationDocumentId = ref(Number(route.query.doc || 0));
/** 文本视图的三态反馈：解析全文就绪后按锚点+引文兜底判定。 */
const textCitationLocate = ref<CitationLocateResult | null>(null);
/** PDF 原文定位的三态反馈：由 pdf-locate-viewer 在页文本中匹配后上报。 */
const pdfCitationLocate = ref<CitationLocateResult | null>(null);
/** 解析全文响应携带的 chunk 实时锚点（码点下标）。 */
const citationAnchors = ref<Array<{ artifactID: number; charEnd: number; charStart: number; chunkIndex: number }>>([]);
/** 定位视图是否已按文件类型自动分流（PDF 留在原文件视图，其余切解析阅读）。 */
let citationViewApplied = false;
/** 文本视图三态是否已判定完成，避免编译轮询期间重复全文扫描。 */
let textLocateDone = false;
/** 定位参数在 URL 中的键；落地消费后移除，浏览器前进/后退或刷新重放时据此识别并重新消费。 */
const CITATION_QUERY_KEYS = ['chunk', 'cs', 'ce', 'pi', 'q'] as const;
/** 地址栏定位参数指纹：五个键的 JSON 序列化，用于感知参数消失/重现。 */
const citationQueryKey = computed(() => JSON.stringify(CITATION_QUERY_KEYS.map((key) => route.query[key] ?? null)));
/** getContent 响应的锚点原文类型（retrieval.ts 同款形状）。 */
const documentPaneRef = ref<InstanceType<typeof DocumentPane>>();
const importDialogRef = ref<InstanceType<typeof ImportDialog>>();
const zipTransferRef = ref<InstanceType<typeof ZipTransfer>>();

const canWriteActive = computed(() => {
  return canWriteKnowledge(activeKnowledge.value ?? undefined, props.mode);
});
const activeDocumentPendingCount = computed(() => fieldPendingSummary.value[activeDocumentId.value] ?? 0);
const documentCount = computed(() => compileStatus.value?.documentCount ?? activeKnowledge.value?.documentCount ?? 0);
/** 父目录以最新目录树为准，移动后立即同步位置，根目录下不重复展示文件名。 */
const activeDocumentFolder = computed(() => {
  /** 返回目标节点的父路径；未找到返回 undefined，根目录返回空字符串。 */
  function findParentPath(nodes: KnowledgeTreeNode[], parents: string[] = []): string | undefined {
    for (const node of nodes) {
      if (node.id === activeDocumentId.value) return parents.join(' / ');
      const found = node.children?.length ? findParentPath(node.children, [...parents, node.name]) : undefined;
      if (found !== undefined) return found;
    }
    return undefined;
  }
  return findParentPath(treeNodes.value) ?? (detail.value?.document?.path || '').replaceAll('\\', '/').split('/').slice(0, -1).filter(Boolean).join(' / ');
});

const resolvedSourcePreviewURL = computed(() => {
  const documentID = detail.value?.document?.id;
  if (!documentID) return '';
  const params = new URLSearchParams({
    'app-id': String(import.meta.env.VITE_GLOB_APPID || ''),
    documentID: String(documentID),
    'tenant-code': sessionStore.tenantCode || '',
    token: sessionStore.token || '',
  });
  const name = encodeURIComponent(detail.value?.document?.name || 'preview.bin');
  return `/api/v1/ai/knowledge/document/source-preview/${name}?${params.toString()}`;
});

const activeDocumentName = computed(() => detail.value?.document?.name || $t('knowledgeBase.text_777cbf94dccc'));
/** citationIsPdf 按扩展名判断定位目标是否 PDF，决定反馈来源与初始视图分流。 */
const citationIsPdf = computed(() => /\.pdf$/i.test(detail.value?.document?.path || activeDocumentName.value || ''));
/** activeCitationLocate 面板展示的三态反馈：PDF 原文视图用组件上报结果，其余用全文判定。 */
const activeCitationLocate = computed(() => (citationIsPdf.value && previewMode.value === 'source' ? pdfCitationLocate.value : textCitationLocate.value));
/** pendingRetryStageLabel 确认弹窗中的阶段中文名。 */
const pendingRetryStageLabel = computed(() => processingStageNames[pendingRetryStage.value] || pendingRetryStage.value);

/** 文档面板的视图双向代理：读取走 URL 派生值，写入转入浏览器历史。 */
const previewModeProxy = computed({
  get: () => previewMode.value,
  set: (view) => switchDocumentView(view),
});

/** switchWorkbenchTab 更新主导航并将状态写入 URL，支持复制链接和前进后退。 */
function switchWorkbenchTab(value: number | string) {
  const nextTab = normalizeKnowledgeWorkbenchTab(value);
  workbenchTab.value = nextTab;
  void router.push({ query: { ...route.query, tab: nextTab } });
}

/** switchDocumentView 保留文档和知识库参数，将每次主动切换纳入浏览器历史。 */
function switchDocumentView(value: number | string) {
  void router.push({ query: { ...route.query, doc: activeDocumentId.value || undefined, view: normalizeDocumentView(value) } });
}

/** handleTreeSelect 目录树选中文件后写入 URL，并关闭临时侧栏。 */
function handleTreeSelect(node: KnowledgeTreeNode) {
  directoryOpen.value = false;
  void router.push({ query: { ...route.query, doc: node.id, view: previewMode.value } });
}

/** toggleDirectory 桌面普通阅读切换常驻目录，关联或窄屏使用临时侧栏。 */
function toggleDirectory() {
  if (desktop.value && previewMode.value !== 'relations') directoryExpanded.value = !directoryExpanded.value;
  else directoryOpen.value = true;
}

/** openFileImport 以最近选中的文件夹为目标打开文件上传。 */
function openFileImport() {
  if (!canWriteActive.value) return;
  importDialogRef.value?.open(selectedFolderNode.value, 'file');
}

/** openFolderImport 以最近选中的文件夹为目标打开文件夹上传。 */
function openFolderImport() {
  if (!canWriteActive.value) return;
  importDialogRef.value?.open(selectedFolderNode.value, 'folder');
}

/** loadKnowledge 直连获取当前知识库信息，用于头部和设置页。 */
async function loadKnowledge() {
  if (!activeId.value) {
    activeKnowledge.value = null;
    return;
  }
  try {
    activeKnowledge.value = await Api.getOne(activeId.value);
  } catch (error) {
    statusError.value = getErrorMessage(error, $t('knowledgeBase.text_0b4d0328612e'));
  }
}

/** loadTree 加载当前知识库目录并恢复合理的文档选中项。 */
async function loadTree() {
  if (!activeId.value) return;
  const request = ++treeRequest;
  treeLoading.value = true;
  treeError.value = '';
  try {
    const response = await Api.getTree(activeId.value);
    if (request !== treeRequest) return;
    treeNodes.value = response.nodes ?? [];
    syncDocumentSelection(treeNodes.value);
  } catch (error) {
    if (request !== treeRequest) return;
    treeNodes.value = [];
    treeError.value = getErrorMessage(error, $t('knowledgeBase.text_2b03996fd9c2'));
  } finally {
    if (request === treeRequest) treeLoading.value = false;
  }
}

/** loadStatus 加载当前库的编译和失败统计。 */
async function loadStatus() {
  if (!activeId.value) return;
  const request = ++statusRequest;
  try {
    const response = await Api.getStatus(activeId.value);
    if (request === statusRequest) compileStatus.value = response;
  } catch (error) {
    if (request === statusRequest) statusError.value = getErrorMessage(error, $t('knowledgeBase.text_bbb29016752c'));
  }
}

/** loadFieldPendingSummary 加载知识库内各文档的引用失效数量；失败静默，仅影响角标展示。 */
async function loadFieldPendingSummary() {
  if (!activeId.value) {
    fieldPendingSummary.value = {};
    return;
  }
  try {
    const items: KnowledgeFieldReferencePendingSummaryItem[] = await Api.getFieldReferencePendingSummary(activeId.value);
    const summary: Record<number, number> = {};
    for (const item of items) {
      if (item.documentID) summary[item.documentID] = item.count;
    }
    fieldPendingSummary.value = summary;
  } catch {
    fieldPendingSummary.value = {};
  }
}

/** handleFieldReferencesChanged 引用变化后同步失效角标，不干扰当前阅读视图。 */
function handleFieldReferencesChanged() {
  void loadFieldPendingSummary();
}

/** loadDetail 加载当前文档与已生成产物。 */
async function loadDetail(documentID: number, silent = false) {
  const request = ++detailRequest;
  if (!documentID) {
    detail.value = null;
    detailLoading.value = false;
    parsedFullText.value = '';
    return;
  }
  if (!silent) detailLoading.value = true;
  detailError.value = '';
  try {
    const response = await Api.getDetail(documentID);
    if (request === detailRequest && documentID === activeDocumentId.value) detail.value = response;
  } catch (error) {
    if (request === detailRequest && documentID === activeDocumentId.value) {
      if (!silent) detail.value = null;
      detailError.value = getErrorMessage(error, $t('knowledgeBase.text_d6d6188048e7'));
    }
  } finally {
    if (request === detailRequest) detailLoading.value = false;
  }
}

/** loadParsedText 按需读取源文件解析全文与切片定位锚点，不拼入 AI 整理内容。 */
async function loadParsedText(documentID: number) {
  const request = ++parsedRequest;
  parsedError.value = '';
  if (!documentID) {
    parsedLoading.value = false;
    return;
  }
  parsedLoading.value = true;
  try {
    const response = await Api.getContent(documentID);
    if (request !== parsedRequest || activeDocumentId.value !== documentID) return;
    parsedFullText.value = response.parsedFullText || '';
    citationAnchors.value = (response.chunkAnchors ?? []).map((anchor) => ({
      artifactID: Number(anchor.artifactID || 0),
      charEnd: Number(anchor.charEnd || 0),
      charStart: Number(anchor.charStart || 0),
      chunkIndex: Number(anchor.chunkIndex || 0),
    }));
  } catch {
    if (request === parsedRequest && activeDocumentId.value === documentID) parsedError.value = $t('knowledgeBase.text_52e6d03e1426');
  } finally {
    if (request === parsedRequest) parsedLoading.value = false;
  }
}

/** resolveTextCitationLocate 在解析全文就绪后判定文本视图的三态反馈；一次定位后不再随轮询重复计算。 */
function resolveTextCitationLocate() {
  if (textLocateDone || !citationRequest.value || !parsedFullText.value || citationIsPdf.value) return;
  textLocateDone = true;
  textCitationLocate.value = locateCitationInText(parsedFullText.value, citationRequest.value, citationAnchors.value);
}

/** stripCitationQuery 把定位参数从当前地址栏移除；无定位参数时不发起导航。 */
function stripCitationQuery() {
  const rest: LocationQueryRaw = { ...route.query };
  let dirty = false;
  for (const key of CITATION_QUERY_KEYS) {
    if (key in rest) {
      delete rest[key];
      dirty = true;
    }
  }
  if (dirty) void router.replace({ query: rest });
}

/** applyCitationView 按文件类型分流初始视图：PDF 留在原文件视图，其余切解析阅读高亮。
 * 切视图与清参数合并在同一次 replace 中，避免两次导航对 route.query 的读写竞争把参数写回地址栏。 */
function applyCitationView() {
  if (citationViewApplied || !citationRequest.value || !detail.value) return;
  citationViewApplied = true;
  if (citationIsPdf.value) {
    // PDF 定位依赖原文件视图中的 pdf-locate-viewer；前一文档可能残留解析阅读视图，
    // 消费定位请求这一刻强制回原文件视图，此后不再干预用户手动切换。
    if (previewMode.value !== 'source') {
      const rest: LocationQueryRaw = { ...route.query, view: 'source' };
      for (const key of CITATION_QUERY_KEYS) delete rest[key];
      void router.replace({ query: rest });
      return;
    }
    stripCitationQuery();
    return;
  }
  if (previewMode.value !== 'reading') {
    const rest: LocationQueryRaw = { ...route.query, view: 'reading' };
    for (const key of CITATION_QUERY_KEYS) delete rest[key];
    void router.replace({ query: rest });
    return;
  }
  stripCitationQuery();
}

/** adoptCitationRequest 采纳一次（重新出现的）定位请求并重置消费状态，让既有链路重新分流、加载与判定。
 * 参数清理统一交给 applyCitationView 的原子 replace，避免同一帧内两次导航互相覆盖。 */
function adoptCitationRequest(request: CitationLocateRequest) {
  citationRequest.value = request;
  citationDocumentId.value = normalizeDocumentID(route.query.doc) || activeDocumentId.value;
  citationViewApplied = false;
  textLocateDone = false;
  textCitationLocate.value = null;
  pdfCitationLocate.value = null;
  applyCitationView();
  resolveTextCitationLocate();
}

/** refreshProcessingResults 统一刷新统计、目录与当前文档详情，保留阅读组件与滚动位置。 */
async function refreshProcessingResults() {
  await Promise.all([
    loadStatus(),
    loadDetail(activeDocumentId.value, true),
    previewMode.value === 'reading' && workbenchTab.value === 'content' ? loadParsedText(activeDocumentId.value) : Promise.resolve(),
    loadTree(),
  ]);
}

/** syncDocumentSelection 在初次进入或文档删除后选中首个可用文档。 */
function syncDocumentSelection(nodes: KnowledgeTreeNode[]) {
  const requested = normalizeDocumentID(route.query.doc);
  const selection = resolveDocumentSelection(nodes, requested);
  activeDocumentId.value = selection.documentID;
  selectedTreeKeys.value = selection.selectedKeys;
  if (route.query.doc && requested !== selection.documentID) void router.replace({ query: { ...route.query, doc: selection.documentID || undefined } });
}

/** retryFailed 重试失败文档并刷新状态。 */
async function retryFailed() {
  if (!activeId.value || !canWriteActive.value) return;
  retryLoading.value = true;
  try {
    await Api.retryCompile(activeId.value, 'failed_only');
    toast({ title: $t('knowledgeBase.text_e34f24cd4c90'), type: 'success' });
    await Promise.all([loadStatus(), loadKnowledge()]);
  } catch (error) {
    statusError.value = getErrorMessage(error, $t('knowledgeBase.text_8af761b2b4bf'));
  } finally {
    retryLoading.value = false;
  }
}

/** retryProcessingStage 仅重试当前文档阶段，关系处理由后端按库级依赖执行。 */
async function retryProcessingStage(stage: string) {
  if (!activeId.value || !activeDocumentId.value || !canWriteActive.value || processingRetrying.value) return;
  processingRetrying.value = true;
  processingRetryError.value = '';
  try {
    await Api.retryCompile(activeId.value, 'all', { documentID: activeDocumentId.value, stages: [stage] });
    toast({ title: $t('knowledgeBase.text_a23465e96a31'), type: 'success' });
    await refreshProcessingResults();
  } catch (error) {
    processingRetryError.value = getErrorMessage(error, $t('knowledgeBase.text_cebf8a44cbd1'));
  } finally {
    processingRetrying.value = false;
  }
}

/** retryAll 提交全量重编译。 */
async function retryAll() {
  if (!activeId.value || !canWriteActive.value) return;
  fullRetryLoading.value = true;
  try {
    await Api.retryCompile(activeId.value, 'all');
    toast({ title: $t('knowledgeBase.text_ccbb8d31afac'), type: 'success' });
    await Promise.all([loadStatus(), loadKnowledge()]);
  } catch (error) {
    statusError.value = getErrorMessage(error, $t('knowledgeBase.text_3171a9d55159'));
  } finally {
    fullRetryLoading.value = false;
  }
}

/** openFailedDocument 打开失败文档并返回内容页。 */
function openFailedDocument(node: KnowledgeTreeNode) {
  void router.push({ query: { ...route.query, tab: 'content', doc: node.id, view: previewMode.value } });
}

/** requestStageRetry 单阶段重跑先弹确认，告知该阶段既有产物将被替换。 */
function requestStageRetry(stage: string) {
  pendingRetryStage.value = stage;
  pendingRetryAll.value = false;
  retryConfirmOpen.value = true;
}

/** requestAllRetry 全量重跑先弹确认，告知全部文档产物将被重建。 */
function requestAllRetry() {
  pendingRetryAll.value = true;
  retryConfirmOpen.value = true;
}

/** confirmRetry 确认后按待办类型执行重跑。 */
async function confirmRetry() {
  retryConfirmOpen.value = false;
  if (pendingRetryAll.value) {
    await retryAll();
    return;
  }
  await retryProcessingStage(pendingRetryStage.value);
}

/** handleNodeDeleted 删除节点后清理当前文档并统一刷新树与统计。 */
async function handleNodeDeleted(node: KnowledgeTreeNode) {
  if (activeDocumentId.value === node.id) activeDocumentId.value = 0;
  await Promise.all([loadTree(), loadStatus(), loadKnowledge()]);
}

/** handleBatchDeleted 批量删除后按实际删除节点清理当前文档并统一刷新。 */
async function handleBatchDeleted(nodes: KnowledgeTreeNode[]) {
  if (nodes.some((node) => node.id === activeDocumentId.value)) activeDocumentId.value = 0;
  await Promise.all([loadTree(), loadStatus(), loadKnowledge()]);
  toast({ title: $t('knowledgeBase.text_a4ee8a6820f7', { arg0: nodes.length }), type: 'success' });
}

/** handleBatchRetried 批量重试提交后刷新编译状态，任务启动后由轮询接管进度。 */
async function handleBatchRetried(count: number) {
  toast({ title: $t('knowledgeBase.text_a203dc45343b', { arg0: count }), type: 'success' });
  await Promise.all([loadStatus(), loadKnowledge()]);
}

/** handleImported 上传导入或 ZIP 导入成功后统一刷新目录、统计与库信息。 */
async function handleImported() {
  await Promise.all([loadTree(), loadStatus(), loadKnowledge()]);
}

/** handleSettingsSaved 保存成功后刷新库信息并提示。 */
async function handleSettingsSaved() {
  await loadKnowledge();
  toast({ title: $t('knowledgeBase.text_cb84a961b0ed'), type: 'success' });
}

/** handleKnowledgeDeleted 删除成功后提示并返回列表。 */
function handleKnowledgeDeleted() {
  toast({ title: $t('knowledgeBase.text_afba31fcd6a8'), type: 'success' });
  void router.push(props.listPath);
}

watch(
  () => route.query.tab,
  (value) => {
    workbenchTab.value = normalizeKnowledgeWorkbenchTab(value);
  },
  { immediate: true },
);

watch(activeId, () => {
  treeRequest++;
  statusRequest++;
  treeNodes.value = [];
  compileStatus.value = null;
  activeDocumentId.value = 0;
  selectedTreeKeys.value = [];
  fieldPendingSummary.value = {};
  void Promise.all([loadTree(), loadStatus(), loadFieldPendingSummary()]);
});

watch(activeDocumentId, (documentID) => {
  detail.value = null;
  parsedFullText.value = '';
  processingRetryError.value = '';
  void loadDetail(documentID);
});

watch(
  () => route.params.id,
  (value) => {
    activeId.value = Number(value || 0);
  },
);
watch(
  () => route.query.doc,
  () => {
    if (treeNodes.value.length > 0) syncDocumentSelection(treeNodes.value);
  },
);
/** 全文只在解析阅读真正显示时获取；离开或切文档立即使旧请求失效。 */
watch([activeDocumentId, previewMode, workbenchTab], ([documentID, view, tab]) => {
  parsedRequest++;
  parsedLoading.value = false;
  if (documentID && view === 'reading' && tab === 'content') void loadParsedText(documentID);
});

/** 引用定位：文档详情就绪后分流视图；解析全文与锚点就绪后判定三态反馈。 */
watch([detail, parsedFullText, citationAnchors], () => {
  if (!citationRequest.value) return;
  applyCitationView();
  resolveTextCitationLocate();
});

/** 手动切换文档后引用定位请求立即失效，避免把上一份文档的高亮套在新文档上。 */
watch(activeDocumentId, (documentID) => {
  if (citationRequest.value && citationDocumentId.value && documentID !== citationDocumentId.value) {
    citationRequest.value = null;
    textCitationLocate.value = null;
    pdfCitationLocate.value = null;
    citationAnchors.value = [];
    textLocateDone = false;
  }
});

/** 文档详情切换后允许定位视图重新分流，避免沿用上一份文档的 PDF/阅读判定。 */
watch(
  () => detail.value?.document.id,
  () => {
    citationViewApplied = false;
  },
);

/** 浏览器刷新/前进后退会把定位参数重放回地址栏（导航意图重提交），页面内二次点击证据链也会改写参数；
 * 参数再次出现时重新消费，保证"落地消费"在任何时序下都可恢复，参数清理与视图切换随之重放。 */
watch(citationQueryKey, (key, previous) => {
  if (!key || key === previous) return;
  const request = parseCitationLocateQuery(route.query);
  if (!request) return;
  adoptCitationRequest(request);
});

/** 编译任务轮询收敛到 useTaskPolling：进行中启动、页面不可见暂停，SSE 接入后仅替换刷新来源。 */
const { start: startStatusPolling, stop: stopStatusPolling } = useTaskPolling(() =>
  Promise.all([loadStatus(), loadKnowledge(), documentPaneRef.value?.isDetailLive() ? loadDetail(activeDocumentId.value, true) : Promise.resolve()]),
);

watch(
  () => compileStatus.value?.currentTask?.status || '',
  (status, previous) => {
    const running = status === 'pending' || status === 'processing';
    if (running) startStatusPolling();
    else stopStatusPolling();
    if (!running && (previous === 'pending' || previous === 'processing')) void refreshProcessingResults();
  },
  { immediate: true },
);

onMounted(async () => {
  // 定位参数只在落地时消费一次，随后从地址栏移除；刷新不再重复滚动。
  if (citationRequest.value) stripCitationQuery();
  await loadKnowledge();
  await Promise.all([loadTree(), loadStatus(), loadFieldPendingSummary()]);
});

onUnmounted(() => {
  treeRequest++;
  statusRequest++;
  detailRequest++;
  parsedRequest++;
});
</script>

<template>
  <Page auto-content-height content-class="!p-0">
    <div class="kb-ui kb-workbench bg-muted/20 flex h-full min-h-0 flex-col">
      <header
        class="kb-workbench-header bg-background grid min-h-14 shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b px-3 py-2 sm:px-4 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"
      >
        <div class="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            class="kb-control size-8 shrink-0"
            :aria-label="$t('knowledgeBase.text_8bc423bfde45')"
            @click="router.push(listPath)"
          >
            <ArrowLeft class="size-4" />
          </Button>
          <div class="min-w-0 flex-1">
            <div class="flex min-w-0 items-center gap-2">
              <h1 class="text-foreground truncate text-base font-semibold">{{ activeKnowledge?.name || $t('knowledgeBase.text_7c06dda127d2') }}</h1>
              <Badge v-if="activeKnowledge" variant="outline" class="shrink-0 whitespace-nowrap" :class="knowledgeStatusClass(activeKnowledge.status)">
                {{ statusLabel(activeKnowledge.status) }}
              </Badge>
              <Badge v-if="activeKnowledge?.scope === 'platform'" variant="outline" class="hidden shrink-0 whitespace-nowrap sm:inline-flex">{{
                $t('knowledgeBase.text_b085853c0caf')
              }}</Badge>
            </div>
            <div class="text-muted-foreground mt-0.5 truncate text-xs">
              {{ $t('knowledgeBase.documentCount', { count: documentCount }) }}
              <span v-if="activeKnowledge?.lastCompileTime">
                {{ $t('knowledgeBase.text_ec539a245002') }} {{ new Date(activeKnowledge.lastCompileTime * 1000).toLocaleString('zh-CN', { hour12: false }) }}
              </span>
            </div>
          </div>
        </div>

        <Tabs
          :model-value="workbenchTab"
          class="col-span-2 row-start-2 w-full xl:col-span-1 xl:col-start-2 xl:row-start-1 xl:w-72"
          @update:model-value="switchWorkbenchTab"
        >
          <TabsList class="grid h-8 w-full grid-cols-3 p-0.5">
            <TabsTrigger value="content" class="text-foreground">{{ $t('knowledgeBase.text_1069127253fa') }}</TabsTrigger>
            <TabsTrigger value="retrieval" class="text-foreground">{{ $t('knowledgeBase.text_a268bd3edc58') }}</TabsTrigger>
            <TabsTrigger value="settings" class="text-foreground">{{ $t('knowledgeBase.text_7debf9cb0372') }}</TabsTrigger>
          </TabsList>
        </Tabs>

        <div class="col-start-2 row-start-1 flex items-center justify-end gap-2 xl:col-start-3">
          <Button v-if="canWriteActive" size="sm" @click="openFileImport" class="kb-control">
            <Upload class="size-4" /> {{ $t('knowledgeBase.text_955940df06e5') }}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="outline" size="icon" class="kb-control size-8" :aria-label="$t('knowledgeBase.text_77836d3a9942')"
                ><MoreHorizontal class="size-4"
              /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-48">
              <DropdownMenuItem v-if="canWriteActive" @click="openFolderImport">
                <Folder class="mr-2 size-4" /> {{ $t('knowledgeBase.text_1b27397c040c') }}
              </DropdownMenuItem>
              <DropdownMenuItem @click="zipTransferRef?.exportZip()">
                <Download class="mr-2 size-4" /> {{ $t('knowledgeBase.text_752f1ceb9690') }}
              </DropdownMenuItem>
              <DropdownMenuItem v-if="canWriteActive" @click="zipTransferRef?.openImport()">
                <Upload class="mr-2 size-4" /> {{ $t('knowledgeBase.text_cae2939c9a99') }}
              </DropdownMenuItem>
              <DropdownMenuSeparator v-if="canWriteActive" />
              <DropdownMenuItem v-if="canWriteActive" @click="requestAllRetry">
                <RefreshCw class="mr-2 size-4" /> {{ $t('knowledgeBase.text_71f3135e6b1c') }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CompileProgressBar
        :can-write="canWriteActive"
        :knowledge="activeKnowledge"
        :retry-loading="retryLoading"
        :status="compileStatus"
        @changed="handleImported"
        @error="statusError = $event"
        @open-document="openFailedDocument"
        @retry-failed="retryFailed"
      />

      <div v-if="statusError" class="border-destructive/30 bg-destructive/10 text-foreground shrink-0 border-b px-4 py-2 text-sm">
        {{ statusError }}
      </div>

      <main class="min-h-0 flex-1 overflow-auto p-3 lg:overflow-hidden lg:p-4">
        <div v-if="workbenchTab === 'content'" class="flex min-h-0 gap-3 lg:h-full lg:gap-4">
          <DefineDirectory>
            <DocumentTree
              v-model:expanded-keys="expandedTreeKeys"
              v-model:keyword="treeKeyword"
              :can-write="canWriteActive"
              :error="treeError"
              :field-pending-summary="fieldPendingSummary"
              :knowledge-id="activeId"
              :loading="treeLoading"
              :nodes="treeNodes"
              :selected-keys="selectedTreeKeys"
              @batch-deleted="handleBatchDeleted"
              @batch-retried="handleBatchRetried"
              @deleted="handleNodeDeleted"
              @error="statusError = $event"
              @folder-select="selectedFolderNode = $event"
              @refresh="loadTree"
              @select="handleTreeSelect"
              @upload-to-folder="importDialogRef?.open($event, 'file')"
            />
          </DefineDirectory>
          <div v-if="directoryVisible" class="h-full w-[272px] shrink-0"><ReuseDirectory /></div>
          <Sheet v-model:open="directoryOpen">
            <SheetContent
              class="kb-ui left-0 right-auto flex w-[min(320px,100vw)] flex-col gap-0 p-3 pt-12"
              @close-auto-focus.prevent="documentPaneRef?.focusDirectoryAction()"
            >
              <SheetTitle class="sr-only">{{ $t('knowledgeBase.text_863a3341e3a2') }}</SheetTitle>
              <SheetDescription class="sr-only">{{ $t('knowledgeBase.text_b6f10165127a') }}</SheetDescription>
              <ReuseDirectory />
            </SheetContent>
          </Sheet>

          <DocumentPane
            ref="documentPaneRef"
            v-model:preview-mode="previewModeProxy"
            :can-write="canWriteActive"
            :citation-locate="activeCitationLocate"
            :citation-pending="!!citationRequest"
            :citation-page-index="citationRequest?.pageIdx"
            :citation-quote="citationRequest?.quote || ''"
            :detail="detail"
            :detail-error="detailError"
            :detail-loading="detailLoading"
            :directory-visible="directoryVisible"
            :folder="activeDocumentFolder"
            :parsed-error="parsedError"
            :parsed-loading="parsedLoading"
            :parsed-text="parsedFullText"
            :pending-count="activeDocumentPendingCount"
            :retry-error="processingRetryError"
            :retrying="processingRetrying"
            :source-preview-u-r-l="resolvedSourcePreviewURL"
            :workbench-tab="workbenchTab"
            @changed="handleFieldReferencesChanged"
            @locate-detected="pdfCitationLocate = $event"
            @refresh="refreshProcessingResults"
            @reload-parsed="loadParsedText(activeDocumentId)"
            @retry-stage="requestStageRetry"
            @toggle-directory="toggleDirectory"
          >
            <template #source="{ filename, path }">
              <SourcePreview
                v-if="resolvedSourcePreviewURL"
                :url="resolvedSourcePreviewURL"
                :filename="filename"
                :path="path"
                fill
                class="bg-background block h-full min-h-0 w-full overflow-hidden"
              />
              <Empty v-else class="h-full">
                <EmptyHeader>
                  <EmptyTitle>{{ $t('knowledgeBase.text_ada28f766802') }}</EmptyTitle>
                  <EmptyDescription>{{ $t('knowledgeBase.text_d170346c841d') }}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </template>
          </DocumentPane>
        </div>

        <KnowledgeRetrievalPanel
          v-else-if="workbenchTab === 'retrieval'"
          embedded
          :fixed-knowledge-id="activeId"
          :fixed-knowledge-name="activeKnowledge?.name"
        />

        <div v-else class="h-full overflow-auto">
          <SettingsPanel
            :can-write="canWriteActive"
            :knowledge="activeKnowledge"
            @deleted="handleKnowledgeDeleted"
            @error="statusError = $event"
            @saved="handleSettingsSaved"
          />
        </div>
      </main>
    </div>

    <Dialog v-model:open="retryConfirmOpen">
      <DialogContent class="kb-ui p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ pendingRetryAll ? $t('knowledgeBase.text_71f3135e6b1c') : $t('knowledgeBase.text_223c77243cc9') }}</DialogTitle>
          <DialogDescription>
            {{
              pendingRetryAll
                ? $t('knowledgeBase.text_f7584ae02a03', { arg0: activeKnowledge?.name || '' })
                : $t('knowledgeBase.text_faaba8b67139', { arg0: activeDocumentName, arg1: pendingRetryStageLabel })
            }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="retryConfirmOpen = false" class="kb-control">{{ $t('knowledgeBase.text_4d0b4688c787') }}</Button>
          <Button :disabled="fullRetryLoading || processingRetrying" @click="confirmRetry" class="kb-control">{{
            $t('knowledgeBase.text_a48585c4dbc8')
          }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ImportDialog ref="importDialogRef" :knowledge-id="activeId" @imported="handleImported" @invalid-selection="statusError = $event" />
    <ZipTransfer ref="zipTransferRef" :knowledge-id="activeId" :knowledge-name="activeKnowledge?.name" @imported="handleImported" />
  </Page>
</template>
