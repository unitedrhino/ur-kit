<script setup lang="ts">
import { notifyRequestError } from '@vben/saas/request-error';

/**
 * 文件说明：告警规则编辑页 Step 3 —— 通知阶梯编辑器
 * 每个阶梯包含通知时机、告警级别、多渠道与对应模板、延迟、通知目标和回调配置。
 */
import type { ContentTemplate } from '../../../composables/useAlarmConvert';
import type { AlarmAiConfig, AlarmLevel, CallbackConfig, NotifyLadder, NotifyTargetCandidate } from '../../../types/alarm-v2.types';
import type { AlarmRuleIssue } from '../../../composables/useAlarmRuleValidation';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { CoreApi } from '@vben/api';
import { $t } from '@vben/locales';
import { message } from '@vben/saas';
import { AiToolDetail } from '@vben/saas/ai-tool-detail';
import { useProjectStore } from '@vben/stores';

import { validateDirectContact } from '../../../utils/notify-contact';

import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Checkbox } from '@unitedrhino/saas-ui/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@unitedrhino/saas-ui/ui/dialog';
import { Field, FieldGroup, FieldLabel, FieldTitle } from '@unitedrhino/saas-ui/ui/field';
import { Input } from '@unitedrhino/saas-ui/ui/input';
import { Textarea } from '@unitedrhino/saas-ui/ui/textarea';

import { createNotifyTemplate, getNotifyTemplateList } from '../../../api/alarm-notify-template.api';
import {
  ALARM_JUDGE_TOOL_OUTPUT_SCHEMA,
  ALARM_JUDGE_TOOL_SCHEMA,
  alarmAiToolSession,
  createAiTool,
  getAiToolList,
  getProjectCloneGroup,
  publishAiTool,
} from '../../../api/ai-tool.api';
import { checkAiAvailable } from '../../../../../components/ai-chat/api';
import AlarmSelect from '../../../components/AlarmSelect.vue';
import { fromNotifyTemplate, toNotifyTemplateCreateReq } from '../../../composables/useAlarmConvert';
import { useAlarmNotifyChannel } from '../../../composables/useAlarmNotifyChannel';
import {
  callbackAuthTypesFromCapabilities,
  callbackMethodsFromCapabilities,
  notifyTimingOptionsFromCapabilities,
} from '../../../composables/useAlarmCapabilities';
import { AlarmLevelList } from '../../../types/alarm-v2.types';
import StepOverview from './StepOverview.vue';

const props = defineProps<{
  ladders: NotifyLadder[];
  /** 规则级 AI 判断配置，告警通知前由绑定的 AI 工具判断是否通知。 */
  aiConfig?: AlarmAiConfig;
  /** 当前步骤需要展示的校验问题。 */
  issues?: AlarmRuleIssue[];
  /** 规则名称：用于创建工具时生成可区分名称与封装上下文。 */
  ruleName?: string;
  /** 告警来源/目标摘要：描述告警监控对象（如「电表-全部设备」）。 */
  targetLabel?: string;
  /** 项目 ID：工具归入项目级 CloneGroup。 */
  projectID?: string;
  /** 精确上下文（产品ID/名称/物模型类型/范围/评估周期），供 AI 需求描述使用，避免 AI 就参数发起澄清。 */
  aiToolContext?: {
    sourceType?: string;
    productID?: string;
    productName?: string;
    categoryID?: string;
    categoryName?: string;
    scope?: string;
    evalPeriod?: string;
    triggerCondition?: string;
  };
  /** 通知内容模板管理的宿主路由前缀（「管理模板」跳转用），默认 iot。 */
  contentTemplateRoutePrefix?: string;
}>();

const emit = defineEmits<{
  (e: 'update:ladders', value: NotifyLadder[]): void;
  (e: 'update:aiConfig', value: AlarmAiConfig | undefined): void;
}>();

/** contentTemplatePrefix 实际使用的模板管理路由前缀（宿主未传时回退 iot）。 */
const router = useRouter();
const contentTemplatePrefix = computed(() => props.contentTemplateRoutePrefix ?? '/iot/alarm');

// AI 判断配置双向绑定：不绑定工具时保持 undefined（不启用），绑定工具时注入 enable:true。
const aiConfigModel = computed({
  get: () => props.aiConfig,
  set: (val) => emit('update:aiConfig', val),
});

/** 更新 AI 判断配置字段 */
function updateAiConfig(patch: Partial<AlarmAiConfig>) {
  const current = aiConfigModel.value ?? { enable: true, timeout: 10 };
  emit('update:aiConfig', { ...current, ...patch });
}

/** aiEnabled 表示 AI 对话/工具能力是否可用，复用控制台聊天框的判断接口（check-available）。未配置时 AI 判断块置灰并提示。 */
const aiEnabled = ref(false);

/** 检查 AI 是否可用；接口失败时默认不可用，保证未开启 AI 环境的告警编辑不被阻塞。 */
async function loadAiAvailability() {
  try {
    const resp = await checkAiAvailable();
    aiEnabled.value = resp.available === true;
  } catch {
    aiEnabled.value = false;
  }
}

// ==================== AI 工具选择与创建 ====================

/** CREATE_TOOL_VALUE 下拉首项「+ 创建工具」的占位值，选中时不绑定工具而是打开创建弹窗。 */
const CREATE_TOOL_VALUE = '__create__';

/** aiToolList 已有 AI 工具列表（下拉展示 name）。 */
const aiToolList = ref<{ label: string; value: string }[]>([]);
/** aiToolOptions 下拉选项：首项固定为「+ 创建工具」，其后为已有工具，末项「不使用 AI 判断」用于解除绑定（不启用）。 */
const aiToolOptions = computed(() => [{ label: $t('iotApp.alarmNotify.createTool'), value: CREATE_TOOL_VALUE }, ...aiToolList.value, { label: $t('iotApp.alarmNotify.noAiTool'), value: '' }]);
/** aiToolLoading 工具列表加载状态。 */
const aiToolLoading = ref(false);
/** createDialogOpen 创建/查看工具弹窗开关。 */
const createDialogOpen = ref(false);
/** dialogMode 弹窗模式：create 为新建生成，edit 为查看/修改已有工具。 */
const dialogMode = ref<'create' | 'edit'>('create');
/** creatingTool 是否为当前正在创建/生成/编辑的工具（弹窗内）。 */
const creatingToolID = ref<string | null>(null);

/** 创建弹窗的「开发依据」摘要：触发条件 + 契约字段清单（只读展示，替代预填提示词）。 */
const toolDevContextSummary = computed(() => {
  const inputFields = parseSchemaFieldNames(ALARM_JUDGE_TOOL_SCHEMA, 'input');
  const outputFields = parseSchemaFieldNames(ALARM_JUDGE_TOOL_OUTPUT_SCHEMA, undefined);
  return {
    triggerCondition: props.aiToolContext?.triggerCondition || '',
    inputFields,
    outputFields,
  };
});

/** parseSchemaFieldNames 从契约 JSON 里解析字段名清单（缺省段名时直接取顶层 properties）。 */
function parseSchemaFieldNames(schemaJson: string, section?: string): string[] {
  try {
    const parsed = JSON.parse(schemaJson);
    const props = section ? parsed?.[section]?.properties : parsed?.properties;
    return props ? Object.keys(props) : [];
  } catch {
    return [];
  }
}

/** 加载可选的 AI 工具列表。 */
async function loadAiTools() {
  aiToolLoading.value = true;
  try {
    // 仅列出当前项目 CloneGroup 下的工具，避免与对话/设备等其他用途工具混淆。
    const cloneGroupID = await loadProjectCloneGroup();
    const resp = await getAiToolList(1, 100, '', cloneGroupID);
    const list = (resp?.list ?? []) as Array<{ id?: number | string; name?: string; code?: string }>;
    aiToolList.value = list
      .filter((item) => item.id != null)
      .map((item) => ({
        label: item.name || item.code || `工具#${item.id}`,
        value: String(item.id),
      }));
  } catch {
    aiToolList.value = [];
  } finally {
    aiToolLoading.value = false;
  }
}

/** aiToolID 当前绑定的工具 ID（与 aiConfigModel.toolID 同步，只读用于展示）。 */
const aiToolID = computed(() => (aiConfigModel.value?.toolID ? String(aiConfigModel.value.toolID) : ''));

/** 下拉选择：首项「+ 创建工具」打开创建弹窗且不改变当前绑定；「不使用 AI 判断」解除绑定（不启用）；其余项绑定到 AI 判断配置。 */
function onToolSelect(value: string) {
  if (value === CREATE_TOOL_VALUE) {
    openCreateDialog();
    return;
  }
  if (!value) {
    emit('update:aiConfig', undefined);
    return;
  }
  updateAiConfig({ enable: true, toolID: String(value) });
}

/** 打开查看/修改弹窗：载入当前绑定的工具，复用共享 AiToolDetail 组件查看三件套并对话修改。 */
async function openEditDialog() {
  if (!aiToolID.value) return;
  dialogMode.value = 'edit';
  creatingToolID.value = aiToolID.value;
  createDialogOpen.value = true;
  // 编辑模式同样初始化项目级告警 clone（幂等：已存在直接返回），
  // 保证修改对话与创建对话共享同一 persona 与项目记忆；失败静默降级为无 clone 会话。
  aiToolCloneID.value = undefined;
  try {
    const projectID = props.projectID || projectStore.currentProjectID || undefined;
    const cloneGroupID = await loadProjectCloneGroup();
    if (cloneGroupID == null) return;
    const sessionResp = await alarmAiToolSession({
      toolID: Number(aiToolID.value),
      cloneGroupID,
      ruleName: props.ruleName || '',
      sourceLabel: props.targetLabel || '',
      productID: props.aiToolContext?.productID || '',
      productName: props.aiToolContext?.productName || '',
      categoryName: props.aiToolContext?.categoryName || '',
      scopeLabel: props.aiToolContext?.scope || '',
      evalPeriod: props.aiToolContext?.evalPeriod || '',
      projectID: Number(projectID) || 0,
    });
    aiToolCloneID.value = sessionResp?.cloneID;
  } catch {
    // 静默降级：clone 初始化失败仅影响记忆复用，不阻塞编辑
  }
}

/** 编辑模式下 AI 修改保存完成：AiToolDetail 内部已刷新内容，这里同步刷新下拉工具列表（名称可能变更）。 */
async function onToolEdited() {
  await loadAiTools();
  message.success('AI 工具修改已保存并生效');
}

/** 项目上下文：告警规则所属项目（决定 AI 工具归入哪个项目级 CloneGroup，与项目同一权限）。 */
const projectStore = useProjectStore();

/** projectCloneGroupID 当前项目 CloneGroup 缓存：工具列表过滤、工具归组与会话初始化共用，避免重复拉取列表。 */
const projectCloneGroupID = ref<number | undefined>(undefined);

/** aiToolCloneID 创建工具时初始化的项目级告警 clone ID：传给面板 completions，使 AI 记忆挂项目 clone、越用越好用。 */
const aiToolCloneID = ref<number | undefined>(undefined);

/** 加载当前项目对应的 CloneGroup ID（项目创建时自动生成，ThirdID=projectID）；失败/未匹配时返回 undefined 走后端默认。 */
async function loadProjectCloneGroup(): Promise<number | undefined> {
  if (projectCloneGroupID.value != null) return projectCloneGroupID.value;
  const projectID = props.projectID || projectStore.currentProjectID || undefined;
  const cloneGroup = (await getProjectCloneGroup(projectID)) as { id?: number } | null;
  projectCloneGroupID.value = cloneGroup?.id;
  return projectCloneGroupID.value;
}

/** 打开创建工具弹窗：先建 shell 并初始化项目级告警 clone，再交给共享工具详情界面继续开发。 */
async function openCreateDialog() {
  dialogMode.value = 'create';
  createDialogOpen.value = true;
  creatingToolID.value = null;
  aiToolCloneID.value = undefined;
  try {
    const projectID = props.projectID || projectStore.currentProjectID || undefined;
    const cloneGroupID = await loadProjectCloneGroup();
    // 工具名唯一：规则名 + 来源摘要 + 时间戳，便于后期在工具列表按名称查找定位。
    const ruleName = (props.ruleName || '未命名规则').slice(0, 24);
    const source = (props.targetLabel || '默认来源').slice(0, 16);
    const ts = Date.now().toString(36).slice(-4).toUpperCase();
    const toolName = `AI判断-${ruleName}-${source}-${ts}`.slice(0, 50);
    const code = `alarm_ai_${Date.now()}`;
    const resp = await createAiTool({
      name: toolName,
      code,
      toolType: 'script',
      description: '用于告警触发后判断是否通知（AI 生成）',
      // 入参契约与 dmsvr AiJudgeInputs 12 字段对齐；出参契约独立固化（shouldNotify/recommendText）。
      // 契约在创建工具时固化到工具定义（AI 开发与引擎执行共用），与 clone/提示词解耦
      inputSchema: ALARM_JUDGE_TOOL_SCHEMA,
      outputSchema: ALARM_JUDGE_TOOL_OUTPUT_SCHEMA,
      ...(cloneGroupID != null ? { cloneGroupID: String(cloneGroupID) } : {}),
    });
    const newID = resp?.id as unknown as string | number | undefined;
    if (newID == null) {
      message.error('创建工具失败，请重试');
      createDialogOpen.value = false;
      return;
    }
    // 工具外壳创建成功后立即展示详情；项目会话初始化只增强记忆能力，不应阻塞用户进入编辑界面。
    creatingToolID.value = String(newID);
    // 初始化项目级告警 clone（persona=告警定制提示词，记忆挂项目 clone）；
    // 初始化失败不阻塞创建流程，面板退化为无 clone 的普通会话。
    try {
      const sessionResp = await alarmAiToolSession({
        toolID: Number(newID),
        cloneGroupID: cloneGroupID ?? 0,
        ruleName: props.ruleName || '',
        sourceLabel: props.targetLabel || '',
        productID: props.aiToolContext?.productID || '',
        productName: props.aiToolContext?.productName || '',
        categoryName: props.aiToolContext?.categoryName || '',
        scopeLabel: props.aiToolContext?.scope || '',
        evalPeriod: props.aiToolContext?.evalPeriod || '',
        triggerCondition: props.aiToolContext?.triggerCondition || '',
        projectID: Number(projectID) || 0,
      });
      aiToolCloneID.value = sessionResp?.cloneID;
    } catch {
      // 静默降级：clone 初始化失败仅影响记忆复用，不阻塞工具创建
    }
  } catch (error: any) {
    notifyRequestError(error, () => error?.message || $t('iotApp.project.toolCreateFailed'), (text) => message.error(text));
    createDialogOpen.value = false;
  }
}

/** 工具被删除：查看态解除当前绑定；创建态只清理新建草稿，保留原有规则绑定。 */
function onToolDeleted() {
  if (dialogMode.value === 'edit') {
    emit('update:aiConfig', undefined);
  }
  creatingToolID.value = null;
  void loadAiTools();
  message.success(dialogMode.value === 'edit' ? '工具已删除，AI 判断绑定已解除' : '新建工具草稿已删除');
}

/** AI 生成完成并保存后（仅创建模式）：自动发布 + 绑定 + 刷新列表，最后关闭弹窗。编辑模式的保存由 AiToolDetail 内部处理并触发 onToolEdited。 */
async function onToolArtifactsSaved() {
  const toolID = creatingToolID.value;
  if (!toolID) {
    message.error('生成结果缺少工具 ID');
    return;
  }
  try {
    await publishAiTool(toolID);
    updateAiConfig({ toolID });
    await loadAiTools();
    message.success('AI 工具生成并发布成功');
  } catch (error: any) {
    notifyRequestError(error, () => error?.message || $t('ui.actionMessage.publishFailedManual'), (text) => message.error(text));
  } finally {
    createDialogOpen.value = false;
    creatingToolID.value = null;
  }
}

/** onToolArtifactsSavedOrEdited 根据弹窗模式处理产物保存：创建态发布并绑定，查看态仅刷新现有工具。 */
async function onToolArtifactsSavedOrEdited() {
  if (dialogMode.value === 'create') {
    await onToolArtifactsSaved();
    return;
  }
  await onToolEdited();
}

// 通知渠道：使用项目统一的渠道 composable，内部已处理 fallback
const { channels, loadChannels } = useAlarmNotifyChannel();

const allTemplates = ref<ContentTemplate[]>([]);
const loading = ref(false);
/** 通知目标用户的独立加载状态，避免与通知模板加载互相干扰。 */
const targetLoading = ref(false);
/** 通知目标加载失败时展示的可重试提示。 */
const targetError = ref('');

// 通知目标候选只使用真实用户接口数据，接口失败或为空时保持空列表
const targetCandidates = ref<NotifyTargetCandidate[]>([]);

/** callbackMethodOptions 定义回调请求方法。 */
const callbackMethodOptions = computed(() => callbackMethodsFromCapabilities().map((value) => ({ label: value, value })));

/** callbackAuthOptions 定义回调认证方式。 */
const callbackAuthOptions = computed(() =>
  callbackAuthTypesFromCapabilities().map((value) => ({
    label: value === 'none' ? '无认证' : value === 'basic' ? 'Basic' : 'Bearer',
    value,
  })),
);

/** notifyTimingOptions 仅展示后端能力接口允许的通知时机。 */
const notifyTimingOptions = computed(() => notifyTimingOptionsFromCapabilities());

/** 加载通知模板列表 */
async function loadTemplates() {
  loading.value = true;
  try {
    const res = await getNotifyTemplateList({ page: { page: 1, size: 100 } });
    allTemplates.value = (res.list || []).map(fromNotifyTemplate);
  } finally {
    loading.value = false;
  }
}

/** 把后端用户记录转换为通知目标候选 */
function mapUserToCandidate(userTenant: CoreApi.UserTenant): NotifyTargetCandidate | undefined {
  const userID = String(userTenant.userID || userTenant.user?.userID || '');
  if (!userID) return undefined;
  const user = userTenant.user;
  return {
    id: `user:${userID}`,
    name: user?.nickName || user?.userName || userID,
    type: 'user',
    typeLabel: '用户',
  };
}

/** 加载当前组织内启用的真实用户，作为告警通知接收人候选。 */
async function loadTargets() {
  targetLoading.value = true;
  targetError.value = '';
  try {
    const resp = await CoreApi.postApiV1SystemTenantUserGetList({
      page: { page: 1, size: 500 },
      status: 1,
    });
    targetCandidates.value = (resp?.list ?? []).map(mapUserToCandidate).filter((item): item is NotifyTargetCandidate => Boolean(item));
  } catch (error: any) {
    console.error('加载通知目标用户失败：', error?.message ?? error);
    targetCandidates.value = [];
    targetError.value = '用户列表加载失败';
  } finally {
    targetLoading.value = false;
  }
}

onMounted(() => {
  if (!laddersModel.value.length) addLadder();
  loadChannels();
  loadTemplates();
  loadTargets();
  loadAiAvailability();
  loadAiTools();
});

const laddersModel = computed({
  get: () => props.ladders,
  set: (val) => emit('update:ladders', val),
});

/** 汇总通知方案数量和覆盖级别，供步骤概览突出展示。 */
const notifySummary = computed(() => {
  if (laddersModel.value.length === 0) return $t('iotApp.alarmNotify.noPlan');
  const selectedLevels = new Set(laddersModel.value.flatMap((ladder) => ladder.levels));
  const levelNames = AlarmLevelList.filter((level) => selectedLevels.has(level.value)).map((level) => level.label);
  return levelNames.length
    ? $t('iotApp.alarmNotify.planSummary', { count: laddersModel.value.length, levels: levelNames.join('、') })
    : $t('iotApp.alarmNotify.planSummaryNoLevel', { count: laddersModel.value.length });
});

let idCounter = 1;
function newId(): string {
  return `ladder-${Date.now()}-${idCounter++}`;
}

function createCallback(): CallbackConfig {
  return {
    id: `cb-${Date.now()}-${idCounter++}`,
    url: '',
    method: (callbackMethodOptions.value[0]?.value ?? 'POST') as CallbackConfig['method'],
    headers: { 'Content-Type': 'application/json' },
    bodyTemplate: '',
    authType: (callbackAuthOptions.value[0]?.value ?? 'none') as CallbackConfig['authType'],
    timeoutSeconds: 30,
    retryTimes: 0,
  };
}

/** 为新增通知方案选择一个仍有可用级别的通知时机。 */
function nextLadderTiming(preferredTiming?: NotifyLadder['timing']): NotifyLadder['timing'] | undefined {
  const timings = preferredTiming
    ? [preferredTiming, ...notifyTimingOptions.value.map((item) => item.value).filter((timing) => timing !== preferredTiming)]
    : notifyTimingOptions.value.map((item) => item.value);
  return timings.find((timing) => availableLevelsForTiming(timing).length > 0);
}

function createLadder(preferredTiming?: NotifyLadder['timing']): NotifyLadder | undefined {
  const timing = nextLadderTiming(preferredTiming);
  if (!timing) return undefined;
  return {
    id: newId(),
    order: laddersModel.value.length + 1,
    timing,
    levels: availableLevelsForTiming(timing),
    channels: [],
    channelTemplates: {},
    delaySeconds: 0,
    repeatIntervalSeconds: 0,
    repeatMaxCount: 0,
    targets: { userIDs: [] },
    callbacks: [],
  };
}

/** 按当前视觉顺序重建后端使用的阶梯序号。 */
function normalizeOrders(ladders: NotifyLadder[]): NotifyLadder[] {
  return ladders.map((ladder, index) => ({ ...ladder, order: index + 1 }));
}

function addLadder() {
  const ladder = createLadder();
  if (!ladder) return;
  laddersModel.value = normalizeOrders([...laddersModel.value, ladder]);
}

function removeLadder(idx: number) {
  const list = [...laddersModel.value];
  list.splice(idx, 1);
  laddersModel.value = normalizeOrders(list);
}

function moveLadder(idx: number, dir: -1 | 1) {
  const list = [...laddersModel.value];
  const target = idx + dir;
  if (target < 0 || target >= list.length) return;
  const tmp = list[idx]!;
  list[idx] = list[target]!;
  list[target] = tmp;
  laddersModel.value = normalizeOrders(list);
}

function cloneLadder(idx: number) {
  const source = laddersModel.value[idx]!;
  const timing = nextLadderTiming(source.timing);
  if (!timing) return;
  const cloned = structuredClone(source);
  laddersModel.value = normalizeOrders([
    ...laddersModel.value.slice(0, idx + 1),
    {
      ...cloned,
      id: newId(),
      timing,
      levels: availableLevelsForTiming(timing),
      callbacks: cloned.callbacks?.map((callback) => ({ ...callback, id: `cb-${Date.now()}-${idCounter++}` })),
    },
    ...laddersModel.value.slice(idx + 1),
  ]);
}

function templatesForChannel(channelCode: string) {
  return allTemplates.value.filter((t) => t.channel === channelCode);
}

/** timingOptions 标识当前通知方案无法选择的通知时机。 */
function timingOptions(ladder: NotifyLadder) {
  return notifyTimingOptions.value.map((timing) => ({
    ...timing,
    disabled: isTimingUnavailable(ladder, timing.value),
  }));
}

/** CREATE_TEMPLATE_VALUE 模板下拉末项「+ 新建模板」的占位值，选中时打开快速创建弹窗。 */
const CREATE_TEMPLATE_VALUE = '__create_template__';

/** templateOptions 返回指定渠道真实可用的消息模板，末项追加「+ 新建模板」入口。 */
function templateOptions(channelCode: string) {
  return [
    ...templatesForChannel(channelCode).map((template) => ({
      label: template.name,
      value: template.id,
    })),
    { label: $t('iotApp.alarmCondTpl.addTemplate'), value: CREATE_TEMPLATE_VALUE },
  ];
}

/** quickCreateState 快速创建弹窗状态：打开的阶梯 id、渠道与表单草稿。 */
const quickCreate = ref<{
  ladderID: string;
  channel: string;
  open: boolean;
  name: string;
  subject: string;
  triggerBody: string;
  recoveryBody: string;
  saving: boolean;
} | null>(null);

/** openQuickCreate 打开快速创建弹窗（记录阶梯与渠道，预填默认内容）。 */
function openQuickCreate(ladder: NotifyLadder, channelCode: string) {
  quickCreate.value = {
    ladderID: ladder.id,
    channel: channelCode,
    open: true,
    name: '',
    subject: '告警通知',
    triggerBody: '【{{.policyName}}】{{.object}} 触发{{.currentLevelFmt}}告警：{{.currentValueContent}}（{{.triggerTimeFmt}}）',
    recoveryBody: '【{{.policyName}}】{{.object}} 告警已恢复（{{.recoveryTimeFmt}}）',
    saving: false,
  };
}

/** submitQuickCreate 提交快速创建：调 createNotifyTemplate 后刷新列表并选中新模板。 */
async function submitQuickCreate() {
  const state = quickCreate.value;
  if (!state || state.saving) return;
  if (!state.name.trim()) {
    message.warning('请填写模板名称');
    return;
  }
  if (!state.triggerBody.trim() || !state.recoveryBody.trim()) {
    message.warning('请填写触发内容与恢复内容');
    return;
  }
  state.saving = true;
  try {
    const resp = await createNotifyTemplate(
      toNotifyTemplateCreateReq({
        id: '',
        name: state.name.trim(),
        channel: state.channel,
        triggerTitle: state.subject,
        triggerBody: state.triggerBody,
        recoveryBody: state.recoveryBody,
      } as unknown as ContentTemplate),
    );
    const newID = String((resp as { id?: number | string })?.id ?? '');
    await loadTemplates();
    const ladder = laddersModel.value.find((l) => l.id === state.ladderID);
    if (ladder) {
      onChannelTemplateChange(ladder, state.channel, newID);
    }
    message.success('模板创建成功');
    quickCreate.value = null;
  } catch (error) {
    console.error('创建通知模板失败：', error);
    notifyRequestError(error, () => $t('ui.actionMessage.createFailed'), (text) => message.error(text));
  } finally {
    if (state) state.saving = false;
  }
}

/** goManageTemplates 跳转到当前宿主的通知内容模板管理列表页。 */
function goManageTemplates(_channelCode: string) {
  router.push(`${contentTemplatePrefix.value}/template/content`);
}

function isChannelSelected(ladder: NotifyLadder, channelCode: string): boolean {
  return ladder.channels.includes(channelCode);
}

function toggleChannel(ladder: NotifyLadder, channelCode: string) {
  const channels = ladder.channels.includes(channelCode) ? ladder.channels.filter((c) => c !== channelCode) : [...ladder.channels, channelCode];
  const channelTemplates = { ...ladder.channelTemplates };
  if (channels.includes(channelCode) && !channelTemplates[channelCode]) {
    channelTemplates[channelCode] = templatesForChannel(channelCode)[0]?.id ?? '';
  }
  if (!channels.includes(channelCode)) {
    delete channelTemplates[channelCode];
  }
  updateLadder(ladder, { channels, channelTemplates });
}

function onChannelTemplateChange(ladder: NotifyLadder, channelCode: string, templateID: string) {
  // 占位值「+ 新建模板」：打开快速创建弹窗，不写入选中模板
  if (templateID === CREATE_TEMPLATE_VALUE) {
    openQuickCreate(ladder, channelCode);
    return;
  }
  updateLadder(ladder, {
    channelTemplates: { ...ladder.channelTemplates, [channelCode]: templateID },
  });
}

function updateLadder(ladder: NotifyLadder, patch: Partial<NotifyLadder>) {
  laddersModel.value = laddersModel.value.map((l) => (l.id === ladder.id ? { ...l, ...patch } : l));
}

function toggleLevel(ladder: NotifyLadder, level: AlarmLevel) {
  const levels = ladder.levels.includes(level) ? ladder.levels.filter((lv) => lv !== level) : [...ladder.levels, level];
  updateLadder(ladder, { levels });
}

/** 把通知时机展开为后端判重使用的实际触发阶段。 */
function timingScopes(timing: NotifyLadder['timing']): Array<'recovery' | 'trigger'> {
  if (timing === 'both') return ['trigger', 'recovery'];
  return [timing];
}

/** 判断两个通知时机是否会覆盖同一个实际触发阶段。 */
function timingsOverlap(left: NotifyLadder['timing'], right: NotifyLadder['timing']): boolean {
  const rightScopes = timingScopes(right);
  return timingScopes(left).some((timing) => rightScopes.includes(timing));
}

/** 返回指定通知时机下尚未被其他阶梯占用的告警级别。 */
function availableLevelsForTiming(timing: NotifyLadder['timing'], excludeLadderId?: string): AlarmLevel[] {
  return AlarmLevelList.map((item) => item.value).filter(
    (level) => !laddersModel.value.some((ladder) => ladder.id !== excludeLadderId && ladder.levels.includes(level) && timingsOverlap(ladder.timing, timing)),
  );
}

/** 是否还存在至少一个后端允许的新通知级别与时机组合。 */
const canAddLadder = computed(() => notifyTimingOptions.value.some((timing) => availableLevelsForTiming(timing.value).length > 0));

/** 判断当前通知方案是否可以切换到指定时机。 */
function isTimingUnavailable(ladder: NotifyLadder, timing: NotifyLadder['timing']): boolean {
  return availableLevelsForTiming(timing, ladder.id).length === 0;
}

/** 切换通知时机时只保留仍合法的级别；原选择全部冲突时自动选择第一个可用级别。 */
function onTimingChange(ladder: NotifyLadder, timing: NotifyLadder['timing']) {
  const availableLevels = availableLevelsForTiming(timing, ladder.id);
  if (!availableLevels.length) return;
  const levels = ladder.levels.filter((level) => availableLevels.includes(level));
  updateLadder(ladder, { timing, levels: levels.length > 0 ? levels : [availableLevels[0]!] });
}

/** 判断某级别是否已被其他相同时机的阶梯占用。 */
function isLevelUnavailable(ladder: NotifyLadder, level: AlarmLevel): boolean {
  return laddersModel.value.some((item) => item.id !== ladder.id && item.levels.includes(level) && timingsOverlap(item.timing, ladder.timing));
}

/** 判断当前阶梯的级别选择是否存在后端契约错误。 */
function hasLevelIssue(ladder: NotifyLadder): boolean {
  return props.issues?.some((issue) => issue.nodeId === ladder.id && issue.control === 'levels') ?? false;
}

/** 判断当前通知阶梯或其中指定控件是否存在契约错误。 */
function hasLadderIssue(ladder: NotifyLadder, control?: AlarmRuleIssue['control']): boolean {
  return props.issues?.some((issue) => issue.nodeId === ladder.id && (!control || issue.control === control)) ?? false;
}

/** 判断接口回调中的指定控件是否存在契约错误。 */
function hasCallbackIssue(callback: CallbackConfig, control: AlarmRuleIssue['control']): boolean {
  return props.issues?.some((issue) => issue.nodeId === callback.id && issue.control === control) ?? false;
}

function addCallback(ladder: NotifyLadder) {
  updateLadder(ladder, { callbacks: [...(ladder.callbacks ?? []), createCallback()] });
}

function removeCallback(ladder: NotifyLadder, cbId: string) {
  updateLadder(ladder, { callbacks: (ladder.callbacks ?? []).filter((cb) => cb.id !== cbId) });
}

// 目标选择器
const targetPanelOpen = ref(false);
/** targetPanelLadderId 只记录当前弹窗对应的方案 ID，避免方案更新后继续读取旧对象。 */
const targetPanelLadderId = ref<string | null>(null);
/** targetPanelLadder 始终从最新的通知方案列表中解析弹窗目标。 */
const targetPanelLadder = computed(() => {
  if (!targetPanelLadderId.value) return null;
  return laddersModel.value.find((ladder) => ladder.id === targetPanelLadderId.value) ?? null;
});
const targetFilter = ref('');

function openTargetSelector(ladder: NotifyLadder) {
  targetPanelLadderId.value = ladder.id;
  targetPanelOpen.value = true;
}

function closeTargetSelector() {
  targetPanelOpen.value = false;
  targetPanelLadderId.value = null;
  targetFilter.value = '';
}

/** onTargetPanelOpenChange 统一处理按钮、遮罩和键盘关闭弹窗。 */
function onTargetPanelOpenChange(open: boolean) {
  if (open) {
    targetPanelOpen.value = true;
  } else {
    closeTargetSelector();
  }
}

function selectedTargetIds(ladder: NotifyLadder): string[] {
  return (ladder.targets.userIDs ?? []).map((id) => `user:${id}`);
}

function isTargetSelected(ladder: NotifyLadder | null | undefined, candidate: NotifyTargetCandidate): boolean {
  if (!ladder) return false;
  return selectedTargetIds(ladder).includes(candidate.id);
}

function toggleTarget(ladder: NotifyLadder | null | undefined, candidate: NotifyTargetCandidate) {
  if (!ladder || !candidate.id.startsWith('user:')) return;
  const userIDs = [...(ladder.targets.userIDs ?? [])];
  const userID = candidate.id.slice('user:'.length);
  updateLadder(ladder, {
    targets: {
      userIDs: userIDs.includes(userID) ? userIDs.filter((id) => id !== userID) : [...userIDs, userID],
    },
  });
}

function removeTarget(ladder: NotifyLadder, candidate: NotifyTargetCandidate) {
  toggleTarget(ladder, candidate);
}

/** 直接填写联系人的输入草稿（按阶梯 id 维护，避免多阶梯相互干扰）。 */
const directContactDraft = reactive<Record<string, { phone: string; email: string }>>({});

/** draft 惰性初始化，保证模板中始终有可绑定的对象。 */
function directDraftOf(ladder: NotifyLadder) {
  if (!directContactDraft[ladder.id]) {
    directContactDraft[ladder.id] = { phone: '', email: '' };
  }
  return directContactDraft[ladder.id]!;
}

/** addDirectContact 把输入框中的手机号/邮箱写入阶梯目标（格式校验 + 去重）。 */
function addDirectContact(ladder: NotifyLadder, kind: 'phone' | 'email') {
  const draft = directDraftOf(ladder);
  const raw = kind === 'phone' ? draft.phone : draft.email;
  const key = kind === 'phone' ? 'phones' : 'emails';
  const check = validateDirectContact(kind, raw, ladder.targets[key] ?? []);
  if (!check.ok) {
    if (check.reason !== 'empty') message.warning(check.reason ?? '输入不合法');
    return;
  }
  const list = [...(ladder.targets[key] ?? []), check.value];
  updateLadder(ladder, { targets: { ...ladder.targets, [key]: list } } as NotifyLadder);
  if (kind === 'phone') draft.phone = '';
  else draft.email = '';
}

/** removeDirectContact 从阶梯目标中移除一个直接填写的手机号/邮箱。 */
function removeDirectContact(ladder: NotifyLadder, kind: 'phone' | 'email', value: string) {
  const key = kind === 'phone' ? 'phones' : 'emails';
  const list = (ladder.targets[key] ?? []).filter((v) => v !== value);
  updateLadder(ladder, { targets: { ...ladder.targets, [key]: list } } as NotifyLadder);
}

/** isChannelOn 判断阶梯是否勾选了指定渠道。 */
function isChannelOn(ladder: NotifyLadder, code: string) {
  return ladder.channels.includes(code);
}

function selectedTargets(ladder: NotifyLadder): NotifyTargetCandidate[] {
  const ids = selectedTargetIds(ladder);
  return targetCandidates.value.filter((c) => ids.includes(c.id));
}

const filteredTargets = computed(() => {
  const q = targetFilter.value.trim();
  if (!q) return targetCandidates.value;
  return targetCandidates.value.filter((c) => c.name.includes(q) || c.typeLabel.includes(q) || c.type.includes(q));
});
</script>

<template>
  <div class="flex flex-col gap-5">
    <StepOverview
      title="配置通知方案"
      description="为告警级别配置通知时机、渠道、消息模板和接收人；需要时可增加延迟与接口回调。"
      summary-label="当前通知配置"
      :summary="notifySummary"
    />

    <div class="text-sm font-medium">
      通知方案
      <span class="text-destructive" aria-label="必填">*</span>
    </div>

    <div
      v-for="(ladder, idx) in laddersModel"
      :key="ladder.id"
      class="bg-card rounded-xl border p-4 shadow-sm"
      :class="hasLadderIssue(ladder) ? 'border-destructive' : ''"
      data-testid="alarm-notify-ladder"
    >
      <div class="mb-3 flex items-center justify-between">
        <span class="text-sm font-medium">通知方案 {{ idx + 1 }}</span>
        <div class="flex items-center gap-2">
          <Button size="xs" variant="outline" :disabled="idx === 0" @click="moveLadder(idx, -1)">↑</Button>
          <Button size="xs" variant="outline" :disabled="idx === laddersModel.length - 1" @click="moveLadder(idx, 1)"> ↓ </Button>
          <Button v-if="canAddLadder" size="xs" variant="ghost" @click="cloneLadder(idx)">复制</Button>
          <Button class="text-destructive" size="xs" variant="ghost" @click="removeLadder(idx)">删除</Button>
        </div>
      </div>

      <div class="grid gap-4 text-sm">
        <!-- 通知时机 -->
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-muted-foreground">
            通知时机
            <span class="text-destructive" aria-label="必填">*</span>
          </span>
          <AlarmSelect
            data-testid="alarm-notify-timing"
            :model-value="ladder.timing"
            class="h-8 w-32 text-xs"
            :class="hasLadderIssue(ladder, 'timing') ? 'border-destructive' : ''"
            :options="timingOptions(ladder)"
            @update:model-value="onTimingChange(ladder, $event as NotifyLadder['timing'])"
          />
        </div>

        <!-- 告警级别 -->
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-muted-foreground">
            告警级别
            <span class="text-destructive" aria-label="必填">*</span>
          </span>
          <Button
            v-for="lv in AlarmLevelList"
            :key="lv.value"
            :data-testid="`alarm-notify-level-${lv.value}`"
            size="xs"
            variant="outline"
            :aria-pressed="ladder.levels.includes(lv.value)"
            :disabled="!ladder.levels.includes(lv.value) && isLevelUnavailable(ladder, lv.value)"
            :class="{
              'border-primary bg-primary/5 text-primary': ladder.levels.includes(lv.value) && !hasLevelIssue(ladder),
              'border-destructive bg-destructive/5 text-destructive': ladder.levels.includes(lv.value) && hasLevelIssue(ladder),
            }"
            @click="toggleLevel(ladder, lv.value)"
          >
            {{ lv.label }}
          </Button>
        </div>

        <!-- 渠道与模板 -->
        <div class="flex flex-col gap-2">
          <div class="text-muted-foreground">
            通知渠道
            <span class="text-destructive" aria-label="必填">*</span>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <Button
              v-for="ch in channels"
              :key="ch.code"
              :data-testid="`alarm-notify-channel-${ch.code}`"
              size="xs"
              variant="outline"
              :aria-pressed="isChannelSelected(ladder, ch.code)"
              :class="
                isChannelSelected(ladder, ch.code)
                  ? hasLadderIssue(ladder, 'channels')
                    ? 'border-destructive bg-destructive/5 text-destructive'
                    : 'border-primary bg-primary/5 text-primary'
                  : 'border-input hover:bg-muted/50'
              "
              @click="toggleChannel(ladder, ch.code)"
            >
              {{ ch.name }}
            </Button>
          </div>

          <div v-for="ch in channels.filter((c) => isChannelSelected(ladder, c.code))" :key="ch.code" class="flex flex-wrap items-center gap-3">
            <span class="text-muted-foreground text-xs">
              {{ ch.name }} 模板
              <span class="text-destructive" aria-label="必填">*</span>
            </span>
            <AlarmSelect
              :data-testid="`alarm-notify-template-${ch.code}`"
              :model-value="ladder.channelTemplates[ch.code]"
              :disabled="loading"
              class="h-8 w-52 text-xs"
              :class="hasLadderIssue(ladder, 'channelTemplate') ? 'border-destructive' : ''"
              :options="templateOptions(ch.code)"
              placeholder="请选择消息模板"
              @update:model-value="onChannelTemplateChange(ladder, ch.code, String($event))"
            />
            <span v-if="loading" class="text-muted-foreground text-xs">模板加载中...</span>
            <span v-else-if="!templatesForChannel(ch.code).length" class="text-destructive text-xs">
              该渠道暂无可用模板，可在下拉中选择「+ 新建模板」快速创建
            </span>
            <Button
              data-testid="alarm-notify-manage-template"
              size="xs"
              variant="link"
              class="text-muted-foreground hover:text-primary h-auto p-0"
              @click="goManageTemplates(ch.code)"
            >
              管理模板
            </Button>
          </div>
        </div>

        <!-- 延迟 -->
        <div class="flex items-center gap-2">
          <span class="text-muted-foreground">延迟</span>
          <Input
            data-testid="alarm-notify-delay"
            :model-value="ladder.delaySeconds"
            type="number"
            min="0"
            class="h-8 w-24 text-xs"
            :class="hasLadderIssue(ladder, 'delaySeconds') ? 'border-destructive' : ''"
            @update:model-value="updateLadder(ladder, { delaySeconds: Number($event) })"
          />
          <span>秒</span>
        </div>

        <!-- 未处理重复提醒：告警发出后仍未恢复时按间隔重复提醒，0=不重复 -->
        <div class="flex items-center gap-2">
          <span class="text-muted-foreground">未处理重复提醒</span>
          <span class="text-muted-foreground text-xs">每</span>
          <Input
            data-testid="alarm-notify-repeat-interval"
            :model-value="ladder.repeatIntervalSeconds ? ladder.repeatIntervalSeconds / 60 : 0"
            type="number"
            min="0"
            step="0.5"
            class="h-8 w-20 text-xs"
            @update:model-value="updateLadder(ladder, { repeatIntervalSeconds: Math.round(Number($event) * 60) })"
          />
          <span class="text-muted-foreground text-xs">分钟重复一次，最多</span>
          <Input
            data-testid="alarm-notify-repeat-max"
            :model-value="ladder.repeatMaxCount"
            type="number"
            min="0"
            class="h-8 w-16 text-xs"
            @update:model-value="updateLadder(ladder, { repeatMaxCount: Number($event) })"
          />
          <span class="text-muted-foreground text-xs">次（0=不重复 / 不限）</span>
        </div>

        <!-- 通知目标 -->
        <div>
          <div class="text-muted-foreground mb-2">
            通知目标
            <span class="text-destructive" aria-label="必填">*</span>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span
              v-for="t in selectedTargets(ladder)"
              :key="t.id"
              class="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs"
            >
              {{ t.name }}
              <Button class="hover:text-destructive size-4 p-0" size="icon-sm" variant="ghost" @click="removeTarget(ladder, t)">×</Button>
            </span>
            <Button
              data-testid="alarm-notify-add-target"
              size="xs"
              variant="outline"
              class="border-dashed"
              :class="hasLadderIssue(ladder, 'targets') ? 'border-destructive text-destructive' : ''"
              @click="openTargetSelector(ladder)"
            >
              + 添加目标
            </Button>
          </div>

          <!-- 直接填写手机号/邮箱：仅短信/邮件渠道生效，站内信不支持直接地址 -->
          <div v-if="isChannelOn(ladder, 'sms') || isChannelOn(ladder, 'email')" class="flex flex-col gap-2">
            <div v-if="isChannelOn(ladder, 'sms')" class="flex flex-wrap items-center gap-2">
              <span class="text-muted-foreground text-xs">短信直接通知</span>
              <span
                v-for="p in ladder.targets.phones ?? []"
                :key="p"
                class="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs"
              >
                {{ p }}
                <Button class="hover:text-destructive size-4 p-0" size="icon-sm" variant="ghost" @click="removeDirectContact(ladder, 'phone', p)">×</Button>
              </span>
              <Input
                :data-testid="`alarm-notify-direct-phone-${ladder.id}`"
                :model-value="directDraftOf(ladder).phone"
                placeholder="输入手机号，回车添加"
                class="h-8 w-48 text-xs"
                @update:model-value="directDraftOf(ladder).phone = String($event)"
                @keydown.enter.prevent="addDirectContact(ladder, 'phone')"
              />
              <Button data-testid="alarm-notify-add-phone" size="xs" variant="outline" @click="addDirectContact(ladder, 'phone')">添加手机号</Button>
            </div>
            <div v-if="isChannelOn(ladder, 'email')" class="flex flex-wrap items-center gap-2">
              <span class="text-muted-foreground text-xs">邮件直接通知</span>
              <span
                v-for="e in ladder.targets.emails ?? []"
                :key="e"
                class="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs"
              >
                {{ e }}
                <Button class="hover:text-destructive size-4 p-0" size="icon-sm" variant="ghost" @click="removeDirectContact(ladder, 'email', e)">×</Button>
              </span>
              <Input
                :data-testid="`alarm-notify-direct-email-${ladder.id}`"
                :model-value="directDraftOf(ladder).email"
                placeholder="输入邮箱，回车添加"
                class="h-8 w-48 text-xs"
                @update:model-value="directDraftOf(ladder).email = String($event)"
                @keydown.enter.prevent="addDirectContact(ladder, 'email')"
              />
              <Button data-testid="alarm-notify-add-email" size="xs" variant="outline" @click="addDirectContact(ladder, 'email')">添加邮箱</Button>
            </div>
            <span class="text-muted-foreground text-xs">提示：直接填写的手机号/邮箱仅通过短信/邮件渠道接收，站内信仅发送给已选用户。</span>
          </div>
        </div>

        <!-- 回调配置 -->
        <div>
          <div class="mb-2 flex items-center justify-between">
            <span class="text-muted-foreground">接口回调</span>
            <Button data-testid="alarm-notify-add-callback" size="xs" variant="outline" @click="addCallback(ladder)">+ 添加回调</Button>
          </div>
          <div
            v-for="cb in ladder.callbacks"
            :key="cb.id"
            class="bg-background mb-2 rounded-lg border p-2"
            :class="props.issues?.some((issue) => issue.nodeId === cb.id) ? 'border-destructive' : ''"
          >
            <div class="mb-2 flex items-center justify-between">
              <span class="text-xs font-medium">回调</span>
              <Button class="text-destructive h-auto p-0" size="xs" variant="link" @click="removeCallback(ladder, cb.id!)">删除</Button>
            </div>
            <FieldGroup class="grid grid-cols-1 gap-2 md:grid-cols-2">
              <Field :data-invalid="hasCallbackIssue(cb, 'callbackUrl')">
                <FieldLabel :for="`alarm-callback-url-${cb.id}`">
                  回调 URL
                  <span class="text-destructive" aria-label="必填">*</span>
                </FieldLabel>
                <Input
                  data-testid="alarm-callback-url"
                  :id="`alarm-callback-url-${cb.id}`"
                  v-model="cb.url"
                  placeholder="https://example.com/webhook"
                  class="h-8 text-xs"
                  :aria-invalid="hasCallbackIssue(cb, 'callbackUrl')"
                />
              </Field>
              <Field :data-invalid="hasCallbackIssue(cb, 'callbackMethod')">
                <FieldTitle>请求方法</FieldTitle>
                <AlarmSelect
                  data-testid="alarm-callback-method"
                  :model-value="cb.method"
                  class="h-8 text-xs"
                  :class="hasCallbackIssue(cb, 'callbackMethod') ? 'border-destructive' : ''"
                  :options="callbackMethodOptions"
                  @update:model-value="cb.method = $event as CallbackConfig['method']"
                />
              </Field>
              <Field :data-invalid="hasCallbackIssue(cb, 'callbackTimeoutSeconds')">
                <FieldLabel :for="`alarm-callback-timeout-${cb.id}`">超时秒数</FieldLabel>
                <Input
                  data-testid="alarm-callback-timeout"
                  :id="`alarm-callback-timeout-${cb.id}`"
                  :model-value="cb.timeoutSeconds"
                  type="number"
                  min="1"
                  class="h-8 text-xs"
                  :aria-invalid="hasCallbackIssue(cb, 'callbackTimeoutSeconds')"
                  @update:model-value="cb.timeoutSeconds = Number($event)"
                />
              </Field>
              <Field :data-invalid="hasCallbackIssue(cb, 'callbackRetryTimes')">
                <FieldLabel :for="`alarm-callback-retries-${cb.id}`">重试次数</FieldLabel>
                <Input
                  data-testid="alarm-callback-retries"
                  :id="`alarm-callback-retries-${cb.id}`"
                  :model-value="cb.retryTimes"
                  type="number"
                  min="0"
                  class="h-8 text-xs"
                  :aria-invalid="hasCallbackIssue(cb, 'callbackRetryTimes')"
                  @update:model-value="cb.retryTimes = Number($event)"
                />
              </Field>
              <Field :data-invalid="hasCallbackIssue(cb, 'callbackAuthToken')">
                <FieldTitle>鉴权方式</FieldTitle>
                <AlarmSelect
                  data-testid="alarm-callback-auth"
                  :model-value="cb.authType"
                  class="h-8 text-xs"
                  :class="hasCallbackIssue(cb, 'callbackAuthToken') ? 'border-destructive' : ''"
                  :options="callbackAuthOptions"
                  @update:model-value="cb.authType = $event as CallbackConfig['authType']"
                />
              </Field>
              <Field v-if="cb.authType !== 'none'" :data-invalid="hasCallbackIssue(cb, 'callbackAuthToken')">
                <FieldLabel :for="`alarm-callback-token-${cb.id}`">鉴权 Token</FieldLabel>
                <Input
                  data-testid="alarm-callback-token"
                  :id="`alarm-callback-token-${cb.id}`"
                  v-model="cb.authToken"
                  class="h-8 text-xs"
                  :aria-invalid="hasCallbackIssue(cb, 'callbackAuthToken')"
                />
              </Field>
            </FieldGroup>
            <Field class="mt-2">
              <FieldLabel :for="`alarm-callback-body-${cb.id}`">请求体模板</FieldLabel>
              <Textarea
                data-testid="alarm-callback-body"
                :id="`alarm-callback-body-${cb.id}`"
                v-model="cb.bodyTemplate"
                placeholder="JSON 模板"
                rows="2"
                class="text-xs"
              />
            </Field>
          </div>
        </div>
      </div>
    </div>

    <Button v-if="canAddLadder" class="border-dashed" variant="outline" @click="addLadder">+ 添加通知方案</Button>

    <!-- AI 判断配置：告警触发后、通知前由绑定的 AI 工具判断是否通知 -->
    <div class="bg-card rounded-xl border p-4 shadow-sm" :class="{ 'pointer-events-none opacity-60': !aiEnabled }" data-testid="alarm-ai-config">
      <div class="mb-3 flex items-center justify-between">
        <span class="text-sm font-medium">AI 判断（可选）</span>
      </div>

      <!-- 未配置 AI 能力时置灰并提示 -->
      <p v-if="!aiEnabled" class="text-destructive text-xs" data-testid="alarm-ai-disabled-hint">
        AI 判断不可用：请先在系统配置中开启 AI 服务（配置 AiHttp 工具运行器）后再使用该功能。
      </p>

      <template v-if="aiEnabled">
        <FieldGroup class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field>
            <FieldLabel for="alarm-ai-tool">AI 工具</FieldLabel>
            <div class="flex items-center gap-2">
              <AlarmSelect
                id="alarm-ai-tool"
                data-testid="alarm-ai-tool"
                :model-value="aiToolID"
                :disabled="aiToolLoading"
                class="h-8 flex-1 text-xs"
                placeholder="不启用（选择工具后启用）"
                :options="aiToolOptions"
                @update:model-value="onToolSelect(String($event))"
              />
              <!-- 仅当已绑定工具且该工具仍在当前下拉选项中（未被删除/未跨项目）时展示；
                   绑定失效时下拉回退 placeholder，此时不应出现「查看/修改」 -->
              <Button
                v-if="aiToolID && aiToolOptions.some((o) => o.value === aiToolID)"
                type="button"
                size="xs"
                variant="outline"
                data-testid="alarm-ai-edit-tool"
                @click="openEditDialog"
              >
                查看/修改
              </Button>
            </div>
            <p class="text-muted-foreground mt-1 text-xs">
              下拉首项「+ 创建工具」由 AI 根据描述生成，保存后自动发布并绑定；选中已有工具后可点「查看/修改」调整；选择「不使用 AI 判断」则直接通知。
            </p>
          </Field>
          <Field>
            <FieldLabel for="alarm-ai-timeout">超时（秒）</FieldLabel>
            <Input
              id="alarm-ai-timeout"
              data-testid="alarm-ai-timeout"
              :model-value="aiConfigModel?.timeout ?? 10"
              type="number"
              min="1"
              max="30"
              class="h-8 text-xs"
              @update:model-value="updateAiConfig({ timeout: Number($event) })"
            />
          </Field>
        </FieldGroup>
        <p class="text-muted-foreground text-xs">AI 判断在告警触发后、发送通知前执行；工具出参 shouldNotify 决定是否通知，建议文本用于审计。</p>
      </template>
    </div>

    <!-- 创建/查看工具弹窗：两种模式统一复用共享详情组件，避免布局、预览与对话能力产生差异。 -->
    <Dialog :open="createDialogOpen" @update:open="(o: boolean) => (createDialogOpen = o)">
      <DialogContent v-if="createDialogOpen" class="max-w-7xl">
        <DialogHeader>
          <DialogTitle>{{ dialogMode === 'create' ? '创建 AI 判断工具' : 'AI 判断工具详情' }}</DialogTitle>
          <DialogDescription v-if="dialogMode === 'create'">AI 将按当前告警契约生成并持续更新工具，保存后自动发布并绑定到 AI 判断。</DialogDescription>
          <DialogDescription v-else
            >查看工具的 executor.js / skill.md / manifest，可运行验证；在右侧对话框描述修改点，AI 修改保存后立即生效。</DialogDescription
          >
        </DialogHeader>
        <!-- 统一固定高度：详情与对话各自内部滚动，输入区固定在右栏底部且始终可见。 -->
        <div class="flex h-[80vh] min-h-0 flex-col overflow-hidden">
          <AiToolDetail
            v-if="creatingToolID"
            :tool-id="Number(creatingToolID)"
            :clone-id="aiToolCloneID"
            :dev-context="toolDevContextSummary"
            @close="createDialogOpen = false"
            @artifacts-saved="onToolArtifactsSavedOrEdited"
            @deleted="onToolDeleted"
          />
          <div v-else class="text-muted-foreground flex flex-1 items-center justify-center text-sm">正在初始化工具...</div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- 目标选择弹窗 -->
    <Dialog :open="targetPanelOpen" @update:open="onTargetPanelOpenChange">
      <DialogContent v-if="targetPanelLadder" class="max-w-md">
        <DialogHeader>
          <DialogTitle>选择通知目标</DialogTitle>
          <DialogDescription>搜索并勾选需要接收告警通知的用户。</DialogDescription>
        </DialogHeader>
        <Input v-model="targetFilter" placeholder="搜索用户" />
        <div class="flex max-h-72 flex-col gap-1 overflow-y-auto">
          <div v-if="targetLoading" class="text-muted-foreground py-8 text-center text-sm">用户列表加载中...</div>
          <div v-else-if="targetError" class="py-8 text-center text-sm">
            <div class="text-destructive">{{ targetError }}</div>
            <Button class="mt-2 h-auto p-0" size="xs" variant="link" type="button" @click="loadTargets">重新加载</Button>
          </div>
          <div v-else-if="filteredTargets.length === 0" class="text-muted-foreground py-8 text-center text-sm">
            {{ targetFilter.trim() ? '没有匹配的用户' : '当前组织暂无可选用户' }}
          </div>
          <FieldGroup v-else class="gap-1">
            <Field v-for="c in filteredTargets" :key="c.id" class="hover:bg-muted/50 rounded-md p-2" orientation="horizontal">
              <Checkbox
                :id="`alarm-target-${c.id}`"
                :model-value="isTargetSelected(targetPanelLadder, c)"
                @update:model-value="toggleTarget(targetPanelLadder, c)"
              />
              <FieldLabel :for="`alarm-target-${c.id}`" class="w-full cursor-pointer font-normal">
                <span>{{ c.name }}</span>
                <span class="text-muted-foreground ml-auto text-xs">{{ c.typeLabel }}</span>
              </FieldLabel>
            </Field>
          </FieldGroup>
        </div>
        <div class="mt-4 flex justify-end">
          <Button @click="closeTargetSelector">确定</Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- 快速创建通知模板弹窗 -->
    <Dialog
      :open="quickCreate?.open ?? false"
      @update:open="
        (v: boolean) => {
          if (!v && quickCreate) quickCreate.open = v;
        }
      "
    >
      <DialogContent class="sm:max-w-lg" data-testid="alarm-template-quick-create">
        <DialogHeader>
          <DialogTitle>
            新建通知模板
            <span class="text-muted-foreground ml-2 text-xs">
              {{ quickCreate?.channel === 'sms' ? '短信' : quickCreate?.channel === 'email' ? '邮件' : '站内信' }}渠道
            </span>
          </DialogTitle>
          <DialogDescription>创建后自动选为当前渠道的通知模板。</DialogDescription>
        </DialogHeader>
        <FieldGroup class="grid grid-cols-1 gap-3">
          <Field>
            <FieldLabel :for="'alarm-tpl-name'">模板名称 <span class="text-destructive" aria-label="必填">*</span></FieldLabel>
            <Input id="alarm-tpl-name" v-model="quickCreate!.name" data-testid="alarm-tpl-name" placeholder="例如：冷库温度持续过高" />
          </Field>
          <Field>
            <FieldLabel :for="'alarm-tpl-subject'">通知标题</FieldLabel>
            <Input id="alarm-tpl-subject" v-model="quickCreate!.subject" data-testid="alarm-tpl-subject" placeholder="例如：设备告警通知" />
          </Field>
          <Field>
            <FieldLabel :for="'alarm-tpl-trigger'">触发内容 <span class="text-destructive" aria-label="必填">*</span></FieldLabel>
            <Textarea id="alarm-tpl-trigger" v-model="quickCreate!.triggerBody" data-testid="alarm-tpl-trigger" :rows="3" />
          </Field>
          <Field>
            <FieldLabel :for="'alarm-tpl-recovery'">恢复内容 <span class="text-destructive" aria-label="必填">*</span></FieldLabel>
            <Textarea id="alarm-tpl-recovery" v-model="quickCreate!.recoveryBody" data-testid="alarm-tpl-recovery" :rows="3" />
          </Field>
        </FieldGroup>
        <div class="mt-4 flex justify-end gap-2">
          <Button variant="outline" @click="quickCreate = null">取消</Button>
          <Button data-testid="alarm-tpl-save" :disabled="quickCreate?.saving" @click="submitQuickCreate">
            {{ quickCreate?.saving ? '创建中...' : '创建' }}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
