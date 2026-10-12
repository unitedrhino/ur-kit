<script lang="ts" setup>
import { notifyRequestError } from '@vben/saas/request-error';
import { $t } from '@vben/locales';

/**
 * 文件说明：AI 工具详情组件（共享）。
 * 两栏等宽布局：skill.md 渲染预览 / AI 工具编辑助手，
 * 支持 manifest 查看、ZIP 导入导出、运行工具（动态表单 + 轮询结果 + 一键修复）、发布/停用。
 * 从 org-manage 应用 ai-center/tool/detail.vue 下沉抽象，供系统管理与告警规则等多处复用。
 *
 * 使用方式：
 *   - 嵌入模式：传 toolId，关闭时触发 close 事件（如数字分身详情 Tab、告警规则弹窗）
 *   - 独立页面模式：不传 toolId 时从路由 params.id 读取，关闭时 router.back()
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';

import { useRoute, useRouter } from 'vue-router';

import { NButton, NTag, NInput, NSpace, useDialog, useMessage } from 'naive-ui';

import { CodeBlock } from '../ai-elements/code-block';
import { AiToolDevPanel } from '../ai-tool-dev';
import { DocumentRenderer } from '../ai-tool';

import type { ToolArtifactFile, ToolInfo } from './api';
import { aiToolApi } from './api';

const props = defineProps<{
  toolId?: number; // 从父组件传入；不传则从路由参数读取
  /** 可选：项目级告警 clone ID（告警场景由外层调用 tool-session 初始化后传入），
   *  透传给右侧 AI 编辑助手使会话绑定该 clone，共享场景提示词与项目记忆；不传走通用逻辑 */
  cloneId?: number | string;
  /** 已绑定任务的工具禁止从编辑面板直接删除。 */
  allowDelete?: boolean;
  /** 紧凑嵌入模式：由外层弹窗承接关闭导航，压缩标题栏与四周留白。 */
  compact?: boolean;
  /** 开发依据摘要：创建告警工具时透传触发条件与输入输出契约，供助手按当前规则生成工具。 */
  devContext?: {
    triggerCondition?: string;
    inputFields?: string[];
    outputFields?: string[];
  };
  /** 当前工具的触发合同，发送对话时附带给 AI，供规则引擎按消息入参生成代码。 */
  instruction?: string;
}>();

const emit = defineEmits<{
  close: []; // 嵌入模式下点击返回时触发
  /** AI 修改保存完成（面板已自动刷新内容），供外层同步自身状态（如刷新工具列表）。 */
  artifactsSaved: [];
  /** 工具被删除：外层解除规则上的 AI 绑定并刷新工具列表。 */
  deleted: [];
}>();

const route = useRoute();
const router = useRouter();
const message = useMessage();
const dialog = useDialog();

const toolInfo = ref<ToolInfo>();
const executorJs = ref('');
const readmeMd = ref('');
const manifestJson = ref('');
/** 出参契约（ai_tools.output_schema）：创建工具时业务域固化，stdout 输出的一行 JSON 的结构定义 */
const outputSchema = ref('');
const loading = ref(false);
/** artifactLoaded 记录已取得的三件套文件，刷新时只重取用户实际使用过的内容。 */
const artifactLoaded = reactive<Record<ToolArtifactFile, boolean>>({
  'executor.js': false,
  'manifest.json': false,
  'skill.md': false,
});
/** artifactLoading 为各文件提供独立加载态，避免按需请求阻塞整个详情弹窗。 */
const artifactLoading = reactive<Record<ToolArtifactFile, boolean>>({
  'executor.js': false,
  'manifest.json': false,
  'skill.md': false,
});
/** artifactRequests 合并同一文件的并发读取，避免快速重复点击产生重复 OSS 请求。 */
const artifactRequests = new Map<ToolArtifactFile, Promise<void>>();

// 从 manifestJson 解析出的信息对象，用于模板展示 command / entryPoint 等字段
const manifestInfo = computed(() => {
  try {
    return JSON.parse(manifestJson.value || '{}');
  } catch {
    return {};
  }
});

// Manifest modal
const showManifestModal = ref(false);

// ZIP import/export
const importing = ref(false);
const importInputRef = ref<HTMLInputElement | null>(null);

// Run state
const runInputs = ref('{}');
const showRunModal = ref(false);
/** 源码查看弹层（executor.js 收缩为按钮后的查看入口）。 */
const showSourceModal = ref(false);
/**
 * Esc 关闭逻辑：弹层打开时按 Esc 只关闭最上层弹层，阻断事件继续传播导致外层详情弹窗一并关闭。
 * 通过 document 捕获阶段监听实现（弹层为内嵌 fixed 定位、不用 NModal teleport，详见模板注释），
 * 焦点不在组件内（target 为 body）时也能拦截；外层 Dialog 的 Esc 监听在 document 冒泡阶段，被阻断。
 */
function onRootKeydownCapture(e: KeyboardEvent) {
  if (e.key !== 'Escape') return;
  if (showSourceModal.value) {
    showSourceModal.value = false;
  } else if (showManifestModal.value) {
    showManifestModal.value = false;
  } else if (showRunModal.value) {
    // 运行中禁止关闭运行弹窗，但仍阻断 Esc 传播避免外层弹窗被连带关闭
    if (runPhase.value !== 'running') {
      showRunModal.value = false;
    }
  } else {
    // 无弹层打开时放行，由外层弹窗（如告警规则 Dialog）正常响应 Esc
    return;
  }
  e.stopImmediatePropagation();
  e.preventDefault();
}
/** 任一弹层打开时注册 document 捕获监听；全部关闭时移除 */
function syncEscListener() {
  const anyOpen = showSourceModal.value || showManifestModal.value || showRunModal.value;
  if (anyOpen) {
    document.addEventListener('keydown', onRootKeydownCapture, true);
  } else {
    document.removeEventListener('keydown', onRootKeydownCapture, true);
  }
}
watch([showSourceModal, showManifestModal, showRunModal], syncEscListener);
/** deleting 删除请求进行中。 */
const deleting = ref(false);

/** onDeleteTool 删除当前工具：确认后删除，成功后关闭弹窗并通知外层解绑刷新。 */
function onDeleteTool() {
  if (!id.value || deleting.value) return;
  dialog.warning({
    title: '确认删除',
    content: '删除后工具将不可恢复，且规则上的 AI 判断绑定会失效。确认删除该工具？',
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: () => doDeleteTool(),
  });
}

async function doDeleteTool() {
  if (!id.value || deleting.value) return;
  deleting.value = true;
  try {
    await aiToolApi.remove(id.value);
    message.success('工具已删除');
    showSourceModal.value = false;
    showRunModal.value = false;
    emit('deleted');
    emit('close');
  } catch (err: any) {
    notifyRequestError(err, () => err?.msg || $t('orgManage.common.deleteFailed'), (text) => message.error(text));
  } finally {
    deleting.value = false;
  }
}
// 弹窗阶段: input → 填参 / running → 执行中 / done → 结果
const runPhase = ref<'input' | 'running' | 'done'>('input');
// 从 manifest.json 解析出的 input schema，用于动态生成表单
// 兼容三种格式：
// 1. inputs 数组格式: [{key, label, type, required?, placeholder?}]
// 2. params 数组格式:  [{key, type, description, required?}]  (AI 常用)
// 3. parameters JSON Schema 格式: {type:"object", properties:{...}, required:[...]}
interface ManifestInput {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
}
const manifestInputs = computed<ManifestInput[]>(() => {
  try {
    const m = JSON.parse(manifestJson.value || '{}');
    // inputs 数组格式
    if (Array.isArray(m.inputs) && m.inputs.length > 0) {
      return m.inputs as ManifestInput[];
    }
    // params 数组格式（AI 生成常用，key/type/description/required）
    if (Array.isArray(m.params) && m.params.length > 0) {
      return (m.params as Array<Record<string, any>>).map((p) => ({
        key: p.key || '',
        label: p.key || '',
        type: p.type || 'string',
        required: !!p.required,
        placeholder: p.description || '',
      }));
    }
    // parameters JSON Schema 格式
    const params = m.parameters;
    if (params && params.type === 'object' && params.properties) {
      const required: string[] = params.required || [];
      return Object.entries(params.properties).map(([key, val]: [string, any]) => ({
        key,
        label: key,
        type: val.type || 'string',
        required: required.includes(key),
        placeholder: val.description || '',
      }));
    }
    return [];
  } catch {
    return [];
  }
});
// 动态表单字段值
const formValues = ref<Record<string, string>>({});
const runID = ref('');
const runStatus = ref('');
const runState = ref<Record<string, any>>({});
const runOutput = ref('');
const runLogs = ref('');
const runDuration = ref(0);
const runError = ref('');
let pollTimer: ReturnType<typeof setInterval> | null = null;

// 支持从 props 或路由参数获取 toolId
const id = computed(() => {
  if (props.toolId) return props.toolId;
  return Number(route.params.id);
});

// 返回/关闭函数
function onBack() {
  if (props.toolId) {
    // 作为组件使用时，触发 close 事件
    emit('close');
  } else {
    // 作为独立页面时，使用路由返回
    router.back();
  }
}

async function fetchTool(artifactFiles: ToolArtifactFile[] = ['skill.md']) {
  if (!id.value) return;
  loading.value = true;
  artifactFiles.forEach((file) => {
    artifactLoading[file] = true;
  });
  try {
    const res = await aiToolApi.getOne(id.value, artifactFiles);
    toolInfo.value = res.info;
    if (artifactFiles.includes('executor.js')) {
      executorJs.value = res.artifact?.executorJs ?? '';
      artifactLoaded['executor.js'] = true;
    }
    if (artifactFiles.includes('skill.md')) {
      readmeMd.value = res.artifact?.documentMd ?? '';
      artifactLoaded['skill.md'] = true;
    }
    if (artifactFiles.includes('manifest.json')) {
      manifestJson.value = res.artifact?.manifestJson ?? '';
      artifactLoaded['manifest.json'] = true;
    }
    // 出参契约（创建工具时业务域固化）：存在时格式化供 manifest 弹窗展示
    const raw = (res.info as Record<string, unknown>)?.outputSchema;
    if (typeof raw === 'string' && raw) {
      outputSchema.value = raw;
    } else if (raw && typeof raw === 'object') {
      outputSchema.value = JSON.stringify(raw, null, 2);
    } else {
      outputSchema.value = '';
    }
  } catch (err: any) {
    notifyRequestError(err, () => err?.msg || $t('ui.actionMessage.loadFailed'), (text) => message.error(text));
  } finally {
    loading.value = false;
    artifactFiles.forEach((file) => {
      artifactLoading[file] = false;
    });
  }
}

/** ensureArtifact 确保指定产物已加载；相同文件正在请求时复用同一个 Promise。 */
async function ensureArtifact(file: ToolArtifactFile) {
  if (artifactLoaded[file]) return;
  const pending = artifactRequests.get(file);
  if (pending) return pending;
  const request = fetchTool([file]).finally(() => artifactRequests.delete(file));
  artifactRequests.set(file, request);
  return request;
}

function onRefresh() {
  const files = (Object.keys(artifactLoaded) as ToolArtifactFile[]).filter((file) => artifactLoaded[file]);
  fetchTool(files.length ? files : ['skill.md']);
}

/** onOpenSource 立即打开源码层，并在层内异步加载 executor.js。 */
function onOpenSource() {
  showSourceModal.value = true;
  void ensureArtifact('executor.js');
}

/** onOpenManifest 立即打开参数层，并在层内异步加载 manifest.json。 */
function onOpenManifest() {
  showManifestModal.value = true;
  void ensureArtifact('manifest.json');
}

/** AI 调用 save_artifacts 保存文件后，前端自动刷新，并通知外层（如告警页刷新工具列表） */
async function onArtifactsSaved() {
  message.info('AI 已保存文件，正在刷新...');
  const files = (Object.keys(artifactLoaded) as ToolArtifactFile[]).filter((file) => artifactLoaded[file]);
  await fetchTool(files.length ? files : ['skill.md']);
  emit('artifactsSaved');
}

/** 将 base64 zip 数据触发浏览器下载 */
function downloadBase64Zip(base64: string, fileName: string) {
  const byteString = atob(base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** 导出当前工具为 zip */
async function onExport() {
  if (!id.value) return;
  try {
    const res = await aiToolApi.exportZip(id.value);
    downloadBase64Zip(res.zipData, res.fileName || `tool-${id.value}.zip`);
    message.success('导出成功');
  } catch (err: any) {
    notifyRequestError(err, () => err?.msg || $t('knowledgeBase.text_675338126127'), (text) => message.error(text));
  }
}

/** 触发文件选择器 */
function onImportClick() {
  importInputRef.value?.click();
}

/** 选择 zip 后导入并覆盖当前工具三件套 */
async function onImportFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input?.files?.[0];
  if (!file || !id.value) return;

  importing.value = true;
  try {
    await aiToolApi.importZip(file, id.value);
    message.success('导入成功');
    const files = (Object.keys(artifactLoaded) as ToolArtifactFile[]).filter((name) => artifactLoaded[name]);
    await fetchTool(files.length ? files : ['skill.md']);
  } catch (err: any) {
    notifyRequestError(err, () => err?.msg || $t('iotApp.categoryPage.importFailed'), (text) => message.error(text));
  } finally {
    importing.value = false;
    input.value = '';
  }
}

async function onPublish() {
  if (!toolInfo.value?.id) return;
  dialog.warning({
    title: '确认发布',
    content: `确定要发布工具 [${toolInfo.value.name}] 吗？发布后版本号加1。`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await aiToolApi.publish(toolInfo.value!.id!);
        message.success('发布成功');
        onRefresh();
      } catch (err: any) {
        notifyRequestError(err, () => err?.msg || $t('orgManage.flow.publishFailed'), (text) => message.error(text));
      }
    },
  });
}

async function onDisable() {
  if (!toolInfo.value?.id) return;
  dialog.warning({
    title: '确认停用',
    content: `确定要停用工具 [${toolInfo.value.name}] 吗？`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await aiToolApi.disable(toolInfo.value!.id!);
        message.success('已停用');
        onRefresh();
      } catch (err: any) {
        notifyRequestError(err, () => err?.msg || $t('orgManage.flow.stopFailed'), (text) => message.error(text));
      }
    },
  });
}

/** 打开运行弹窗，按需取得 manifest 后初始化动态表单或回退到 JSON 输入。 */
async function onRun() {
  await ensureArtifact('manifest.json');
  const inputs = manifestInputs.value;
  if (inputs.length > 0) {
    const vals: Record<string, string> = {};
    inputs.forEach((inp) => {
      vals[inp.key] = '';
    });
    formValues.value = vals;
  } else {
    runInputs.value = '{}';
  }
  runPhase.value = 'input';
  showRunModal.value = true;
}

/** 提交运行：有 manifest inputs 时从动态表单组装 JSON，否则用原始文本域内容 */
async function onConfirmRun() {
  const inputs = manifestInputs.value;
  let inputJson: string;
  if (inputs.length > 0) {
    const obj: Record<string, any> = {};
    inputs.forEach((inp) => {
      const val = formValues.value[inp.key];
      if (val !== '' && val !== undefined) {
        obj[inp.key] = inp.type === 'number' ? Number(val) : val;
      } else if (inp.required) {
        obj[inp.key] = inp.type === 'number' ? 0 : '';
      }
    });
    inputJson = JSON.stringify(obj);
    runInputs.value = inputJson;
  } else {
    inputJson = runInputs.value;
  }
  // 立即切换到 running 态，禁用表单
  runPhase.value = 'running';
  runStatus.value = 'running';
  runError.value = '';
  runLogs.value = '';
  runOutput.value = '';
  runDuration.value = 0;
  try {
    const res = await aiToolApi.run(id.value, inputJson);
    runID.value = res.runID;
    startPolling();
  } catch (err: any) {
    notifyRequestError(err, () => err?.msg || $t('ui.actionMessage.executeFailed'), (text) => message.error(text));
    runPhase.value = 'input';
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function onCloseRun() {
  showRunModal.value = false;
  stopPolling();
}

/** 格式化输入 JSON，用于结果展示 */
const formattedInput = computed(() => {
  try {
    return JSON.stringify(JSON.parse(runInputs.value), null, 2);
  } catch {
    return runInputs.value || '无';
  }
});

/** 格式化输出 JSON，用于结果展示 */
const formattedOutput = computed(() => {
  try {
    return JSON.stringify(JSON.parse(runOutput.value), null, 2);
  } catch {
    return runOutput.value || '无';
  }
});

async function onCopyFixPrompt() {
  const prompt = [
    '工具运行失败，请帮我修复 executor.js：',
    '',
    `入参: ${runInputs.value}`,
    `出参: ${runOutput.value}`,
    `错误信息: ${runError.value}`,
    `日志: ${runLogs.value}`,
    `执行耗时: ${formatDuration(runDuration.value)}`,
    '',
    '请分析错误原因并修复代码。',
  ].join('\n');
  try {
    await navigator.clipboard.writeText(prompt);
    message.success('已复制到剪贴板，请粘贴到右侧 AI 对话框');
    showRunModal.value = false;
  } catch (requestError) {
    notifyRequestError(requestError, () => $t('console.token.copyFailed'), (text) => message.error(text));
  }
}

function startPolling() {
  stopPolling();
  pollTimer = setInterval(async () => {
    try {
      const res = await aiToolApi.runStatus(runID.value);
      runStatus.value = res.status;
      runDuration.value = res.durationMs;
      runLogs.value = res.logs ?? '';
      runError.value = res.errorMsg ?? '';
      runOutput.value = res.output ?? '';
      if (res.state) {
        try {
          runState.value = JSON.parse(res.state);
        } catch {
          runState.value = {};
        }
      }
      if (res.status === 'success' || res.status === 'failed') {
        stopPolling();
        runPhase.value = 'done';
      }
    } catch {
      stopPolling();
    }
  }, 1500);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

onMounted(() => {
  fetchTool(['skill.md']);
});

onBeforeUnmount(() => {
  stopPolling();
  document.removeEventListener('keydown', onRootKeydownCapture, true);
});
</script>

<template>
  <div
    data-testid="ai-tool-detail"
    class="flex min-h-0 flex-col overflow-hidden"
    :class="[props.toolId ? 'h-full' : '', props.compact ? 'p-0' : 'p-4']"
    :style="props.toolId ? undefined : { height: 'calc(100dvh - 90px)' }"
  >
    <!-- Header -->
    <div class="flex shrink-0 flex-wrap items-center justify-between gap-2" :class="props.compact ? 'mb-2' : 'mb-4'">
      <div class="flex min-w-0 items-center gap-3">
        <NButton v-if="!props.compact" text @click="onBack">
          <span class="i-lucide:arrow-left size-5" />
        </NButton>
        <h1 class="text-foreground truncate font-semibold" :class="props.compact ? 'text-base' : 'text-xl'">
          {{ toolInfo?.name ?? '工具详情' }}
        </h1>
        <NTag v-if="toolInfo?.status === 1" type="info" size="small">草稿</NTag>
        <NTag v-else-if="toolInfo?.status === 2" type="success" size="small">已发布</NTag>
        <NTag v-else-if="toolInfo?.status === 3" type="error" size="small">已停用</NTag>
      </div>
      <NSpace class="shrink-0">
        <NButton size="small" @click="onOpenManifest">参数</NButton>
        <NButton size="small" @click="onOpenSource">源码</NButton>
        <NButton v-if="props.allowDelete !== false" size="small" type="error" ghost :loading="deleting" @click="onDeleteTool">删除</NButton>
        <NButton size="small" @click="onExport">导出 ZIP</NButton>
        <label>
          <NButton size="small" :loading="importing" tag="span" @click="onImportClick"> 导入 ZIP </NButton>
          <input ref="importInputRef" type="file" accept=".zip" class="hidden" @change="onImportFileChange" />
        </label>
        <NButton size="small" type="primary" @click="onRun">▶ 运行工具</NButton>
        <NButton size="small" @click="onRefresh">刷新</NButton>
        <NButton v-if="toolInfo?.status === 1" size="small" type="primary" @click="onPublish"> 发布 </NButton>
        <NButton v-if="toolInfo?.status === 2" size="small" type="warning" @click="onDisable"> 停用 </NButton>
      </NSpace>
    </div>

    <!-- Run status bar (only during running) -->
    <div v-if="runStatus === 'running'" class="bg-muted/30 border-border mb-4 shrink-0 rounded-lg border p-3">
      <div class="flex items-center gap-3 text-sm">
        <span class="text-muted-foreground">Run ID:</span>
        <code class="text-xs">{{ runID }}</code>
        <NTag type="warning" size="small">运行中</NTag>
        <span class="text-muted-foreground">{{ runDuration }}ms</span>
      </div>
    </div>

    <!-- 两栏等宽布局：文档与助手各自滚动，min-w-0 防止长代码撑破容器。 -->
    <div class="grid min-h-0 flex-1 grid-cols-2 gap-4 overflow-hidden">
      <!-- Left: skill.md 文档预览 -->
      <div class="border-border flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border" data-testid="ai-tool-detail-document-pane">
        <div class="bg-muted/30 border-border shrink-0 border-b px-3 py-2 text-sm font-medium">skill.md 文档</div>
        <div class="min-h-0 flex-1 overflow-y-auto p-4 pb-6">
          <div v-if="artifactLoading['skill.md']" class="text-muted-foreground py-8 text-center text-sm">正在加载工具文档…</div>
          <DocumentRenderer v-else :document-md="readmeMd" :state="runState" />
        </div>
      </div>

      <!-- Right: AI tool dev assistant -->
      <div class="border-border flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border" data-testid="ai-tool-detail-assistant-pane">
        <div class="min-h-0 flex-1 overflow-hidden">
          <AiToolDevPanel
            assistant-code="tool_assistant"
            session-key="tool"
            :toolID="id"
            :clone-id="props.cloneId"
            :dev-context="props.devContext"
            :instruction="props.instruction"
            @artifacts-saved="onArtifactsSaved"
          />
        </div>
      </div>
    </div>

    <!-- 源码查看弹层（executor.js，带语法高亮；Esc 只关本层）。
         不用 NModal：NModal teleport 到 body 会脱出外层 shadcn Dialog 的 DOM 树，
         导致 Dialog 的滚动锁拦截弹层内滚轮事件（无法滚动），且 Esc 不经过本组件无法分层拦截；
         内嵌 fixed 弹层留在 Dialog DOM 树内，滚动放行、Esc 由 document 捕获监听分层关闭。 -->
    <div v-if="showSourceModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showSourceModal = false">
      <div class="bg-card border-border w-[880px] max-w-[96vw] rounded-lg border p-4 shadow-lg">
        <div class="mb-2 flex items-center justify-between">
          <span class="text-foreground text-sm font-medium">executor.js</span>
          <NButton size="tiny" @click="showSourceModal = false">关闭</NButton>
        </div>
        <div class="border-border bg-background h-[72vh] overflow-y-auto overscroll-contain rounded border">
          <div v-if="artifactLoading['executor.js']" class="text-muted-foreground py-8 text-center text-sm">正在加载源码…</div>
          <CodeBlock v-else :code="executorJs" language="javascript" :show-line-numbers="true" />
        </div>
      </div>
    </div>

    <!-- Manifest 弹层（内嵌实现，原因同源码弹层） -->
    <div v-if="showManifestModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showManifestModal = false">
      <div class="bg-card border-border w-[600px] max-w-[96vw] rounded-lg border p-4 shadow-lg">
        <div class="mb-2 flex items-center justify-between">
          <span class="text-foreground text-sm font-medium">manifest.json</span>
          <NButton size="tiny" @click="showManifestModal = false">关闭</NButton>
        </div>
        <div class="max-h-[72vh] overflow-y-auto overscroll-contain">
          <div v-if="manifestInfo.command" class="mb-2 text-xs text-gray-500">
            <span class="font-medium">运行命令:</span> {{ manifestInfo.command }}
            <span v-if="manifestInfo.entryPoint" class="ml-2">| <span class="font-medium">入口:</span> {{ manifestInfo.entryPoint }}</span>
          </div>
          <pre
            class="text-foreground text-xs leading-relaxed"
            style="font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace"
          ><code>{{ artifactLoading['manifest.json'] ? '正在加载参数…' : (manifestJson || '暂无内容') }}</code></pre>
          <!-- 出参契约：创建工具时业务域固化到 ai_tools.output_schema，工具 stdout 必须按此输出 -->
          <template v-if="outputSchema">
            <div class="mb-1 mt-3 text-xs text-gray-500">
              <span class="font-medium">出参契约（outputSchema，stdout 必须输出的一行 JSON）:</span>
            </div>
            <pre
              class="text-foreground bg-muted rounded p-2 text-xs leading-relaxed"
              style="font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace"
            ><code>{{ outputSchema }}</code></pre>
          </template>
        </div>
      </div>
    </div>

    <!-- 运行弹窗：表单 + 结果 上下连续布局，始终在同一窗口（内嵌实现，原因同源码弹层） -->
    <div
      v-if="showRunModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="runPhase !== 'running' && (showRunModal = false)"
    >
      <div class="bg-card border-border w-[650px] max-w-[96vw] rounded-lg border p-4 shadow-lg" style="max-height: 75vh; overflow-y: auto">
        <div class="mb-3 flex items-center justify-between">
          <span class="text-foreground text-sm font-medium">运行工具</span>
          <NButton v-if="runPhase !== 'running'" size="tiny" @click="showRunModal = false">关闭</NButton>
        </div>
        <!-- ── 参数输入区（始终可见）── -->
        <div class="mb-4">
          <div class="mb-2 text-sm font-medium">参数</div>
          <!-- 有 manifest.inputs → 动态表单 -->
          <template v-if="manifestInputs.length > 0">
            <div v-for="inp in manifestInputs" :key="inp.key" class="mb-3">
              <label class="mb-1 block text-sm">
                {{ inp.label }}
                <span v-if="inp.required" class="text-destructive">*</span>
              </label>
              <NInput v-model:value="formValues[inp.key]" :placeholder="inp.placeholder || ''" :disabled="runPhase !== 'input'" />
            </div>
          </template>
          <!-- 无 manifest.inputs → JSON 文本域兜底 -->
          <template v-else>
            <NInput v-model:value="runInputs" type="textarea" :rows="4" placeholder="请输入 JSON 格式的输入参数" :disabled="runPhase !== 'input'" />
          </template>
        </div>

        <!-- ── 操作按钮 ── -->
        <div class="mb-3 flex justify-end gap-2">
          <NButton v-if="runPhase === 'input'" @click="showRunModal = false">取消</NButton>
          <NButton v-if="runPhase !== 'done'" type="primary" :loading="runPhase === 'running'" :disabled="runPhase === 'running'" @click="onConfirmRun">
            {{ runPhase === 'running' ? '执行中...' : '运行' }}
          </NButton>
          <NButton v-if="runPhase === 'done'" @click="onCloseRun">关闭</NButton>
        </div>

        <!-- ── 分隔 + 结果区（running / done 时出现）── -->
        <template v-if="runPhase !== 'input'">
          <div class="border-border mb-3 border-t" />

          <!-- 执行中 -->
          <div v-if="runPhase === 'running'" class="bg-muted/30 mb-3 rounded p-3 text-center text-sm">
            <span class="i-lucide:loader-circle text-primary mr-2 inline-block size-4 animate-spin align-middle" />
            工具正在执行中...
            <span class="text-muted-foreground ml-3">{{ runDuration }}ms</span>
          </div>

          <!-- 执行结果 -->
          <template v-if="runPhase === 'done'">
            <div class="mb-3 flex items-center gap-3">
              <span class="text-sm font-medium">状态:</span>
              <NTag :type="runStatus === 'success' ? 'success' : 'error'" size="small">
                {{ runStatus === 'success' ? '成功' : '失败' }}
              </NTag>
              <span class="text-muted-foreground text-sm">耗时: {{ formatDuration(runDuration) }}</span>
            </div>

            <!-- 入参 -->
            <div class="mb-3">
              <div class="mb-1 text-sm font-medium">入参</div>
              <pre
                class="bg-muted/30 max-h-[200px] overflow-auto rounded p-3 text-xs leading-relaxed"
                style="font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace"
              ><code>{{ formattedInput }}</code></pre>
            </div>

            <!-- 出参 -->
            <div class="mb-3">
              <div class="mb-1 text-sm font-medium">出参</div>
              <pre
                class="bg-muted/30 max-h-[200px] overflow-auto rounded p-3 text-xs leading-relaxed"
                style="font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace"
              ><code>{{ formattedOutput }}</code></pre>
            </div>

            <!-- 日志 -->
            <div v-if="runLogs" class="mb-3">
              <div class="mb-1 text-sm font-medium">日志</div>
              <pre
                class="bg-muted/30 max-h-[200px] overflow-auto rounded p-3 text-xs leading-relaxed"
                style="font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace"
              ><code>{{ runLogs }}</code></pre>
            </div>

            <!-- 错误信息 -->
            <div v-if="runStatus === 'failed' && runError" class="mb-3">
              <div class="text-destructive mb-1 text-sm font-medium">错误信息</div>
              <pre
                class="border-destructive/30 bg-destructive/10 text-destructive max-h-[200px] overflow-auto rounded border p-3 text-xs leading-relaxed"
                style="font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace"
              ><code>{{ runError }}</code></pre>
            </div>

            <div v-if="runStatus === 'failed'" class="flex justify-start">
              <NButton type="warning" size="small" @click="onCopyFixPrompt">一键修复</NButton>
            </div>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>
