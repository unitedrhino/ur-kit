<!--
  文件说明：规则引擎 AI 任务创建弹窗（TASK-124 v3，两步流程）。
  第一步「配置触发」：先确定任务、时间或物模型主题，固定脚本实际入参。
  第二步「对话开发」：创建项目助手及工具外壳，用 AI 编辑 executor.js，保存后发布 clone-task。
  编排链路复刻告警 StepNotify 的「工具外壳 → tool-session → 对话 → 发布」，调度复用 clone-task。
-->
<script lang="ts" setup>
import { notifyRequestError } from '@vben/saas/request-error';

import type { AiTaskScheduleReq, RuleEngineScope } from '../aitask.api';
import type { EventTriggerConfig } from '../event-trigger';
import { $t } from '@vben/saas/locales';

import { computed, onBeforeUnmount, ref, watch } from 'vue';

import { message } from '@vben/saas';
import { AiToolDetail } from '@vben/saas/ai-tool-detail';

import { Alert, AlertDescription } from '@unitedrhino/saas-ui/ui/alert';
import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@unitedrhino/saas-ui/ui/dialog';
import { Input } from '@unitedrhino/saas-ui/ui/input';
import { Label } from '@unitedrhino/saas-ui/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@unitedrhino/saas-ui/ui/select';
import { Spinner } from '@unitedrhino/saas-ui/ui/spinner';
import { Textarea } from '@unitedrhino/saas-ui/ui/textarea';
import { VbenIcon } from '@vben-core/shadcn-ui';

import { AiTaskApi, aiTaskDevSession, createAiToolShell, deleteAiTool, getAiToolTriggerDraft, getProjectCloneGroupID, getRuleCloneGroupID, publishAiTool, updateAiToolTriggerDraft, validateAiToolArtifacts } from '../aitask.api';
import { MODEL_TOPICS, emptyEventTrigger, readEventTrigger } from '../event-trigger';
import { SIMULATE_WEEKDAY_OPTIONS, hhmmToSec } from '../shared';
import EventTriggerEditor from './event-trigger-editor.vue';

/** clone-task 支持的调度类型（none=非定时，仅手动触发；语义对齐数字人 clone-task） */
type AiTaskScheduleType = AiTaskScheduleReq['scheduleType'];

const props = defineProps<{
  /** 项目 ID（任务与工具归入项目级 CloneGroup） */
  projectID?: string;
  /** scope 指定规则的项目、企业或平台公共范围。 */
  scope?: RuleEngineScope;
  /** 非项目规则绑定的当前企业。 */
  tenantCode?: string;
  /** 已存在的未绑定工具 ID；传入时恢复开发，不再创建新工具。 */
  resumeToolID?: string;
}>();

const emit = defineEmits<{
  /** success 任务创建成功，父级刷新列表 */
  (e: 'success'): void;
  /** draftSaved 保留草稿退出，父级刷新可恢复入口。 */
  (e: 'draftSaved'): void;
  /** draftDeleted 草稿已删除，父级移除恢复入口。 */
  (e: 'draftDeleted'): void;
}>();

const open = defineModel<boolean>('open', { default: false });
const scope = computed(() => props.scope || 'project');

// ==================== 会话与工具状态 ====================

const step = ref<'dev' | 'schedule'>('schedule');
/** selectedTrigger 保存进入代码步骤时已校验的触发合同，发布时不读取卸载的编辑器。 */
const selectedTrigger = ref<AiTaskScheduleReq | null>(null);
/** draftLoaded 标记当前弹窗已发起草稿回读，避免重复请求。 */
const draftLoaded = ref(false);
/** restoringDraft 在规则快照回读完成前阻止用户进入代码步骤。 */
const restoringDraft = ref(false);
/** restoreGeneration 让关闭后的迟到回读失效，避免覆盖重新打开后的表单。 */
let restoreGeneration = 0;
const initializing = ref(false);
/** initializationPending 区分网络尚未结束与界面等待，避免超时后重复创建。 */
const initializationPending = ref(false);
/** initializationStage 展示当前真实请求阶段，不把资源创建误称为 AI 思考。 */
const initializationStage = ref('');
/** initializationError 保留可操作的失败或超时原因。 */
const initializationError = ref('');
/** initializationCancelled 关闭后阻止后续步骤，迟到的工具响应必须清理。 */
let initializationCancelled = false;
/** initializationTimer 仅限制界面等待，不丢弃可能已创建资源的网络响应。 */
let initializationTimer: ReturnType<typeof setTimeout> | undefined;
const projectCloneGroupID = ref<string | undefined>(undefined);
/** devCloneID 项目级 规则引擎 AI 任务开发助手 clone（对话记忆挂载 + 任务绑定） */
const devCloneID = ref<string | undefined>(undefined);
/** toolID 已创建的 AI 工具外壳 ID（AiToolDetail 按 toolID 定位会话与产物） */
const toolID = ref<string | null>(null);
/** artifactsSaved AI 已保存工具产物（executor.js 等），进入下一步的前提 */
const artifactsSaved = ref(false);
/** saving 第二步提交中（发布 + 建任务） */
const saving = ref(false);

/** triggerInstruction 给对话模型与用户相同的订阅合同，避免生成轮询设备列表的脚本。 */
const triggerInstruction = computed(() => {
  const req = selectedTrigger.value;
  if (!req) return '';
  if (req.triggerType !== 'subscribe_message') return `当前规则：${scheduleSummary.value}。这是定时或手动任务；每次只执行一次，不自行循环。process.argv[2] 是 JSON，包含字符串 ${scope.value === 'project' ? 'projectID' : 'tenantCode'}、prompt；不依赖 eventPayload。`;
  let match: Record<string, string> = {};
  try { match = JSON.parse(req.subscribePayloadFilter || '{}').topicMatch || {}; } catch { /* 已由规则编辑器校验 */ }
  /** typeKey 是物模型主题的翻译键，发送给 AI 的提示按当前语言展示。 */
  const typeKey = MODEL_TOPICS.find((item) => item.code === req.subscribeTopic)?.label;
  const type = typeKey ? $t(typeKey) : req.subscribeTopic;
  const identifier = match.actionID || match.identifier || '全部';
  const area = scope.value === 'project' ? `当前项目 ${props.projectID}` : scope.value === 'tenant' ? `当前企业 ${props.tenantCode}` : '所有企业';
  return `当前规则：${area}的${type}消息触发；主题 ${req.subscribeTopic}，产品 ${match.productID || '全部产品'}，设备 ${match.deviceName || '全部设备'}，物模型标识 ${identifier}。平台负责订阅及范围隔离，代码不要轮询设备列表或自行订阅消息。每次运行只处理本条消息：JSON.parse(process.argv[2] || '{}') 中有 prompt 和完整原始消息 eventPayload；${scope.value === 'project' ? 'projectID 为字符串' : scope.value === 'common' ? 'tenantCode 是平台编码，eventPayload.tenantCode 是消息所属企业' : 'tenantCode 为当前企业编码'}。先检查 eventPayload 是否存在，按用户需求读取其中的参数做进一步判断。手动执行时 eventPayload 不存在，应明确处理这种情况。`;
});

/** devContext 面板顶部开发依据摘要，与实际送入 AI 的指令保持一致。 */
const devContext = computed(() => ({
  title: $t('iotApp.project.aiCtxTitle'),
  triggerCondition: triggerInstruction.value,
  inputFields: selectedTrigger.value?.triggerType === 'subscribe_message' ? [scope.value === 'project' ? 'projectID：字符串项目 ID' : 'tenantCode：当前执行企业编码', 'prompt：任务说明', 'eventPayload：本次完整原始消息；手动运行时不存在'] : [scope.value === 'project' ? $t('iotApp.project.aiInputFields') : 'tenantCode：当前执行企业编码', $t('iotApp.project.aiInputPrompt')],
  outputFields: [$t('iotApp.project.aiOutputFields')],
}));

/** stopInitializationWait 释放等待计时器，关闭或卸载后不遗留动画计时。 */
function stopInitializationWait() {
  clearTimeout(initializationTimer);
  initializationTimer = undefined;
  initializing.value = false;
}

/** cancelInitialization 允许关闭弹窗，但保留未决请求以回收迟到的草稿。 */
function cancelInitialization() {
  if (!initializationPending.value) return;
  initializationCancelled = true;
  stopInitializationWait();
  initializationError.value = $t('iotApp.project.initCancelled');
}

/** initialize 按项目、开发会话、工具三个阶段初始化；同一时间只允许一个创建请求。 */
async function initialize() {
  if (initializationPending.value || toolID.value) return;
  artifactsSaved.value = false;
  initializationCancelled = false;
  initializationError.value = '';
  initializationPending.value = true;
  initializing.value = true;
  /** initializingProjectID 固定本次请求的项目，防止异步期间切换上下文。 */
  const initializingProjectID = props.projectID;
  const initializingContext = `${scope.value}:${props.projectID || props.tenantCode}`;
  initializationTimer = setTimeout(() => {
    initializing.value = false;
    initializationError.value = $t('iotApp.project.initTimeout', { stage: initializationStage.value });
  }, 30_000);
  try {
    initializationStage.value = $t('iotApp.project.initStage1');
    projectCloneGroupID.value = scope.value === 'project'
      ? await getProjectCloneGroupID(initializingProjectID!)
      : await getRuleCloneGroupID(scope.value as 'tenant' | 'common', props.tenantCode!, true);
    if (!projectCloneGroupID.value) throw new Error($t('iotApp.ruleTrigger.cloneGroupFailed'));
    if (initializationCancelled) return;
    initializationStage.value = $t('iotApp.project.initStage2');
    /** resp 项目开发助手响应，成功后才允许创建工具草稿。 */
    const resp = await aiTaskDevSession({
      projectID: scope.value === 'project' ? initializingProjectID : undefined,
      cloneGroupID: projectCloneGroupID.value,
    });
    if (initializationCancelled) return;
    if (!resp.cloneID) throw new Error($t('iotApp.project.sessionCreateFailed'));
    devCloneID.value = resp.cloneID;

    if (props.resumeToolID) {
      initializationStage.value = $t('iotApp.project.initStage3');
      let completed = false;
      try {
        await validateAiToolArtifacts(props.resumeToolID);
        completed = true;
      } catch {
        // 未完成三件套是正常草稿状态，恢复编辑器后由用户继续开发。
      }
      if (initializationCancelled || initializingContext !== `${scope.value}:${props.projectID || props.tenantCode}`) return;
      toolID.value = props.resumeToolID;
      artifactsSaved.value = completed;
      initializationError.value = '';
      return;
    }
    initializationStage.value = $t('iotApp.project.initStage3Tool');
    /** shell 工具创建的唯一响应；即使界面已经超时也必须接收并处理其 ID。 */
    const shell = await createAiToolShell({
      name: $t('iotApp.project.aiTaskDefaultName', { code: Date.now().toString(36).slice(-4).toUpperCase() }),
      description: $t('iotApp.project.aiTaskDefaultDesc'),
      cloneGroupID: projectCloneGroupID.value,
      trigger: selectedTrigger.value!,
    });
    /** newID 只保存实际返回的工具资源 ID，不在超时后盲目重试创建。 */
    const newID = shell?.id;
    if (newID == null) throw new Error($t('iotApp.project.toolCreateFailed'));
    toolID.value = String(newID);
    if (initializationCancelled || initializingContext !== `${scope.value}:${props.projectID || props.tenantCode}`) {
      await deleteAiTool(toolID.value);
      toolID.value = null;
      devCloneID.value = undefined;
      projectCloneGroupID.value = undefined;
      initializationError.value = $t('iotApp.project.draftCleaned');
      return;
    }
    initializationError.value = '';
  } catch (error: any) {
    initializationError.value = toolID.value
      ? $t('iotApp.project.draftCleanFailed')
      : $t('iotApp.project.initFailedWithReason', { stage: initializationStage.value, reason: error?.msg || error?.message || $t('iotApp.project.retryLater') });
    if (open.value || toolID.value) notifyRequestError(error, () => initializationError.value, (text) => message.error(text));
  } finally {
    stopInitializationWait();
    initializationPending.value = false;
  }
}

// 外部关闭或卸载同样取消后续阶段；快速重新打开也不会发出第二个创建请求。
watch(open, (val) => {
  if (!val) cancelInitialization();
  else if (props.resumeToolID && !draftLoaded.value) void restoreDraftTrigger(props.resumeToolID);
});
onBeforeUnmount(cancelInitialization);

/** restoreDraftTrigger 从工具输入契约回读规则；旧草稿仍可手工配置后继续开发。 */
async function restoreDraftTrigger(id: string) {
  const generation = ++restoreGeneration;
  draftLoaded.value = true;
  restoringDraft.value = true;
  try {
    const trigger = await getAiToolTriggerDraft(id);
    if (!open.value || restoreGeneration !== generation || props.resumeToolID !== id || !trigger) return;
    if (trigger.ruleScope && trigger.ruleScope !== scope.value || trigger.scopeProjectID && trigger.scopeProjectID !== props.projectID) throw new Error($t('iotApp.ruleTrigger.scopeMismatch'));
    Object.assign(scheduleForm.value, {
      name: trigger.name, desc: trigger.desc || '', scheduleType: trigger.scheduleType,
      intervalMin: trigger.scheduleInterval || 5, repeatTimes: trigger.repeatTimes || 0,
      timeoutSeconds: trigger.timeoutSeconds || 300,
      onceTime: trigger.scheduleTime?.slice(0, 16) || '',
      dailyTime: trigger.scheduleDailyTimeSec == null ? '08:00' : `${String(Math.floor(trigger.scheduleDailyTimeSec / 3600)).padStart(2, '0')}:${String(Math.floor(trigger.scheduleDailyTimeSec % 3600 / 60)).padStart(2, '0')}`,
      weeklyDay: trigger.scheduleWeeklyDay ?? 1,
      weeklyTime: trigger.scheduleWeeklyTimeSec == null ? '08:00' : `${String(Math.floor(trigger.scheduleWeeklyTimeSec / 3600)).padStart(2, '0')}:${String(Math.floor(trigger.scheduleWeeklyTimeSec % 3600 / 60)).padStart(2, '0')}`,
    });
    eventConfig.value = readEventTrigger(trigger);
  } catch (error: any) {
    if (restoreGeneration === generation && open.value) notifyRequestError(error, () => error?.message || $t('iotApp.ruleTrigger.invalidDraftTrigger'), (text) => message.error(text));
  } finally {
    if (restoreGeneration === generation) restoringDraft.value = false;
  }
}

/** 回读真实三件套成功才开放下一步，保存部分文件不能绕过门槛。 */
async function onArtifactsSaved() {
  artifactsSaved.value = false;
  const savedToolID = toolID.value;
  if (!savedToolID) return;
  try {
    await validateAiToolArtifacts(savedToolID);
    if (toolID.value !== savedToolID) return;
    artifactsSaved.value = true;
    message.success($t('iotApp.project.aiTaskSaved'));
  } catch (error: any) {
    notifyRequestError(error, () => error?.message || $t('iotApp.project.artifactsIncomplete'), (text) => message.error(text));
  }
}

/** onToolDeleted 用户在工具详情内删除了工具：重置流程并关闭弹窗 */
function onToolDeleted() {
  message.success($t('iotApp.project.toolDeleted'));
  resetAndClose();
  emit('draftDeleted');
}

// ==================== 调度配置 ====================

const scheduleForm = ref({
  name: '',
  desc: '',
  scheduleType: 'interval' as AiTaskScheduleType,
  intervalMin: 5,
  onceTime: '',
  dailyTime: '08:00',
  weeklyDay: 1,
  weeklyTime: '08:00',
  repeatTimes: 0,
  timeoutSeconds: 300,
});
/** eventConfig 保存第一步事件来源，工具草稿可回读此配置。 */
const eventConfig = ref<EventTriggerConfig>(emptyEventTrigger());
const triggerEditor = ref<InstanceType<typeof EventTriggerEditor> | null>(null);

/** gotoDev 先验证规则，再初始化带准确入参契约的 AI 工具。 */
async function gotoDev() {
  if (initializationPending.value || restoringDraft.value) return;
  try {
    const req = buildScheduleReq();
    if (!req.name) throw new Error($t('iotApp.project.taskNameWarn'));
    const previous = selectedTrigger.value;
    if (toolID.value) {
      await updateAiToolTriggerDraft(toolID.value, req);
      if (previous && (previous.triggerType !== req.triggerType || previous.subscribeTopic !== req.subscribeTopic || previous.subscribePayloadFilter !== req.subscribePayloadFilter)) artifactsSaved.value = false;
    }
    selectedTrigger.value = req;
    if (!toolID.value) {
      step.value = 'dev';
      await initialize();
    } else if (projectCloneGroupID.value && devCloneID.value) {
      step.value = 'dev';
    } else {
      throw new Error($t('iotApp.ruleTrigger.sessionNotReady'));
    }
  } catch (error: any) {
    notifyRequestError(error, () => error?.message || $t('iotApp.ruleTrigger.checkTriggerConfig'), (text) => message.error(text));
  }
}

/** buildScheduleReq 组装任务保存请求（调度字段语义对齐 clone-task） */
function buildScheduleReq(): AiTaskScheduleReq {
  const f = scheduleForm.value;
  const req: AiTaskScheduleReq = {
    ruleScope: scope.value,
    name: f.name.trim(),
    desc: f.desc.trim() || undefined,
    scheduleType: f.scheduleType,
    timeoutSeconds: f.timeoutSeconds,
    repeatTimes: f.repeatTimes,
  };
  if (eventConfig.value.triggerType === 'subscribe_message') {
    const event = triggerEditor.value?.serialize();
    if (!event) throw new Error($t('iotApp.ruleTrigger.sourcesNotReady'));
    Object.assign(req, event);
    req.scheduleType = 'none';
  }
  if (eventConfig.value.triggerType !== 'subscribe_message' && f.scheduleType === 'interval') req.scheduleInterval = Math.max(1, Math.round(f.intervalMin || 1));
  if (eventConfig.value.triggerType !== 'subscribe_message' && f.scheduleType === 'once') {
    if (!f.onceTime || Number.isNaN(Date.parse(f.onceTime)) || Date.parse(f.onceTime) <= Date.now()) throw new Error($t('iotApp.project.futureTimeRequired'));
    req.scheduleTime = new Date(f.onceTime).toISOString();
  }
  if (!Number.isInteger(f.timeoutSeconds) || f.timeoutSeconds < 1) throw new Error($t('iotApp.project.timeoutPositive'));
  if (!Number.isInteger(f.repeatTimes) || f.repeatTimes < 0) throw new Error($t('iotApp.project.repeatNonNegative'));
  if (eventConfig.value.triggerType !== 'subscribe_message' && f.scheduleType === 'daily') req.scheduleDailyTimeSec = hhmmToSec(f.dailyTime) ?? 0;
  if (eventConfig.value.triggerType !== 'subscribe_message' && f.scheduleType === 'weekly') {
    req.scheduleWeeklyDay = f.weeklyDay;
    req.scheduleWeeklyTimeSec = hhmmToSec(f.weeklyTime) ?? 0;
  }
  return req;
}

/** scheduleSummary 调度预览文案（保存前确认） */
const scheduleSummary = computed(() => {
  if (eventConfig.value.triggerType === 'subscribe_message') return `${scope.value === 'project' ? $t('iotApp.ruleTrigger.scopeProjectShort') : scope.value === 'tenant' ? $t('iotApp.ruleTrigger.scopeTenantShort') : $t('iotApp.ruleTrigger.scopeAllShort')} ${$t('iotApp.ruleTrigger.runOnMessage')}`;
  const f = scheduleForm.value;
  switch (f.scheduleType) {
    case 'interval': {
      return $t('iotApp.project.intervalSummary', { minutes: Math.max(1, Math.round(f.intervalMin || 1)) });
    }
    case 'daily': {
      return $t('iotApp.project.dailySummary', { time: f.dailyTime || '00:00' });
    }
    case 'weekly': {
      const day = SIMULATE_WEEKDAY_OPTIONS.find((item) => item.value === f.weeklyDay)?.label || $t('iotApp.project.weekdayUnknown');
      return $t('iotApp.project.weeklySummary', { day, time: f.weeklyTime || '00:00' });
    }
    case 'once': {
      return f.onceTime ? $t('iotApp.project.onceSummary', { time: f.onceTime.replace('T', ' ') }) : $t('iotApp.project.onceNoTime');
    }
    default: {
      return $t('iotApp.project.manualOnlySummary');
    }
  }
});

async function onSaveTask() {
  if (!toolID.value || !devCloneID.value || !projectCloneGroupID.value || !artifactsSaved.value || !selectedTrigger.value || step.value !== 'dev' || saving.value) return;
  if (!scheduleForm.value.name.trim()) {
    message.warning($t('iotApp.project.taskNameWarn'));
    return;
  }
  saving.value = true;
  try {
    const req = selectedTrigger.value;
    await publishAiTool(toolID.value);
    await AiTaskApi.create({
      cloneGroupID: projectCloneGroupID.value,
      cloneID: devCloneID.value,
      toolID: toolID.value,
      name: req.name,
      desc: req.desc,
      toolInputs: JSON.stringify(scope.value === 'project'
        ? { projectID: props.projectID, prompt: req.desc || req.name }
        : { tenantCode: props.tenantCode, prompt: req.desc || req.name }),
      triggerType: req.triggerType,
      subscribeTopic: req.subscribeTopic,
      subscribePayloadFilter: req.subscribePayloadFilter,
      scopeProjectID: req.scopeProjectID,
      scheduleType: req.scheduleType,
      scheduleInterval: req.scheduleInterval,
      scheduleTime: req.scheduleTime,
      scheduleDailyTimeSec: req.scheduleDailyTimeSec,
      scheduleWeeklyDay: req.scheduleWeeklyDay,
      scheduleWeeklyTimeSec: req.scheduleWeeklyTimeSec,
      timeoutSeconds: req.timeoutSeconds,
      repeatTimes: req.repeatTimes,
    });
    message.success(req.triggerType === 'subscribe_message' ? $t('iotApp.ruleTrigger.eventTaskCreated') : $t('iotApp.project.taskCreatedRunning'));
    emit('success');
    resetAndClose();
  } catch (error: any) {
    notifyRequestError(error, () => error?.msg || error?.message || $t('iotApp.project.saveTaskFailedRetry'), (text) => message.error(text));
  } finally {
    saving.value = false;
  }
}

/** 草稿关闭必须确认；只有删除成功才放弃状态，发布后创建失败也能重试。 */
const discardOpen = ref(false);
const discarding = ref(false);
function requestClose() {
  if (saving.value || discarding.value) return;
  if (initializationPending.value) {
    cancelInitialization();
    open.value = false;
    return;
  }
  if (toolID.value) discardOpen.value = true;
  else resetAndClose();
}
async function discardDraft() {
  discarding.value = true;
  try {
    if (toolID.value) await deleteAiTool(toolID.value);
    discardOpen.value = false;
    resetAndClose();
    emit('draftDeleted');
  } catch (error: any) {
    notifyRequestError(error, () => error?.msg || error?.message || $t('iotApp.project.saveDraftFailedKept'), (text) => message.error(text));
  } finally {
    discarding.value = false;
  }
}

/** keepDraftAndClose 保留工具和会话，退出后可从规则引擎列表继续开发。 */
function keepDraftAndClose() {
  if (!toolID.value || saving.value || discarding.value) return;
  discardOpen.value = false;
  resetAndClose();
  emit('draftSaved');
  message.success($t('iotApp.project.draftKeptHint'));
}

/** 清理已提交或已删除的草稿状态。 */
function resetAndClose() {
  restoreGeneration++;
  open.value = false;
  // 未决请求由自己的 finally 收尾；这里只清理已提交或已删除草稿的界面状态。
  if (!initializationPending.value) {
    initializationError.value = '';
    initializationStage.value = '';
    stopInitializationWait();
  }
  step.value = 'schedule';
  selectedTrigger.value = null;
  draftLoaded.value = false;
  restoringDraft.value = false;
  toolID.value = null;
  devCloneID.value = undefined;
  artifactsSaved.value = false;
  projectCloneGroupID.value = undefined;
  Object.assign(scheduleForm.value, { name: '', desc: '', scheduleType: 'interval', intervalMin: 5, onceTime: '', dailyTime: '08:00', weeklyDay: 1, weeklyTime: '08:00', repeatTimes: 0, timeoutSeconds: 300 });
  eventConfig.value = emptyEventTrigger();
}
</script>

<template>
  <Dialog :open="open" @update:open="(val: boolean) => !val && requestClose()">
    <DialogContent
      data-testid="aitask-dialog"
      :class="[
        'flex w-[calc(100vw-2rem)] flex-col gap-3 overflow-hidden p-4 sm:p-5',
        step === 'dev' ? 'h-[calc(100dvh-2rem)] max-h-[960px] max-w-7xl' : 'h-[calc(100dvh-2rem)] max-h-[860px] max-w-5xl',
      ]"
    >
      <DialogHeader data-testid="aitask-compact-header" class="shrink-0 gap-y-1 pr-7">
        <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <DialogTitle class="flex items-center gap-2">
            {{ resumeToolID ? $t('iotApp.project.resumeAiTaskTitle') : $t('iotApp.project.newAiTaskTitle') }}
            <span class="rounded bg-sky-500/15 px-1.5 py-0.5 text-xs font-medium text-sky-600">{{ $t('iotApp.project.btnAiCode') }}</span>
          </DialogTitle>
          <!-- 步骤与标题共用一行，避免独立步骤栏挤占工作台正文高度。 -->
          <div class="text-muted-foreground flex shrink-0 items-center gap-2 text-xs">
            <span :class="step === 'schedule' ? 'text-foreground font-medium' : ''">{{ $t('iotApp.ruleTrigger.defineTrigger') }}</span>
            <VbenIcon icon="lucide:chevron-right" class="size-3" />
            <span :class="step === 'dev' ? 'text-foreground font-medium' : ''">{{ $t('iotApp.ruleTrigger.editCode') }}</span>
          </div>
        </div>
        <DialogDescription class="text-xs sm:text-sm">
          {{ $t('iotApp.ruleTrigger.intro') }}
        </DialogDescription>
      </DialogHeader>

      <!-- 固定高度内容容器，防止长文档把操作按钮挤出视口。 -->
      <div class="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
        <!-- 第二步：基于已选规则对话开发。 -->
        <div v-if="step === 'dev'" class="flex min-h-0 flex-1 flex-col">
          <div v-if="initializing || initializationError" class="flex min-h-0 flex-1 flex-col">
            <div class="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-3 text-center text-sm" role="status" aria-live="polite">
              <Spinner v-if="initializing" class="size-5" />
              <p>{{ initializing ? initializationStage : initializationError }}</p>
              <p v-if="initializing" class="text-xs">{{ $t('iotApp.project.preparingEditor') }}</p>
            </div>
            <div class="border-border/70 flex shrink-0 justify-end gap-2 border-t pt-3">
              <Button variant="outline" size="sm" @click="requestClose">{{ $t('iotApp.ota.closeLabel') }}</Button>
              <Button v-if="initializationError && !toolID" size="sm" :disabled="initializationPending" data-testid="aitask-init-retry" @click="initialize">
                {{ initializationPending ? $t('iotApp.project.waitingConfirm') : $t('iotApp.project.retryInit') }}
              </Button>
            </div>
          </div>
          <template v-else-if="toolID">
            <AiToolDetail
              :tool-id="Number(toolID)"
              :clone-id="devCloneID"
              :dev-context="devContext"
              :instruction="triggerInstruction"
              compact
              class="min-h-0 flex-1"
              @close="requestClose"
              @artifacts-saved="onArtifactsSaved"
              @deleted="onToolDeleted"
            />
            <div class="border-border/70 flex shrink-0 items-center justify-end gap-2 border-t pt-3">
              <span v-if="artifactsSaved" class="flex items-center gap-1 text-xs text-emerald-600">
                <VbenIcon icon="lucide:check-circle-2" class="size-3.5" />
                {{ $t('iotApp.project.toolSaved') }}
              </span>
              <Button variant="outline" size="sm" @click="requestClose">{{ $t('iotApp.project.saveDraftExit') }}</Button>
              <Button variant="outline" size="sm" data-testid="aitask-back-to-trigger" @click="step = 'schedule'">
                <VbenIcon icon="lucide:arrow-left" class="size-4" />
                {{ $t('iotApp.ruleTrigger.backToTrigger') }}
              </Button>
              <Button size="sm" :disabled="!artifactsSaved || !devCloneID || saving" data-testid="aitask-save" @click="onSaveTask">
                <Spinner v-if="saving" class="size-3.5" />
                {{ saving ? $t('iotApp.project.saving') : $t('iotApp.project.publishAndCreate') }}
              </Button>
            </div>
          </template>
        </div>

        <!-- 第一步：配置规则和运行参数。 -->
        <div v-else class="flex min-h-0 flex-1 flex-col" data-testid="aitask-schedule-panel">
          <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
            <Alert class="border-primary/20 bg-primary/5 px-3 py-2">
              <AlertDescription class="text-muted-foreground text-xs">
                {{ $t('iotApp.ruleTrigger.codeIntro') }}
              </AlertDescription>
            </Alert>

            <section class="bg-card rounded-lg border p-4 shadow-sm">
              <div class="mb-3 flex items-center gap-2">
                <VbenIcon icon="lucide:file-text" class="text-primary size-4" />
                <h3 class="text-sm font-medium">{{ $t('iotApp.project.taskInfoHeading') }}</h3>
              </div>
              <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div class="flex flex-col gap-1.5">
                  <Label class="text-xs">{{ $t('iotApp.project.taskNameLabel') }} <span class="text-destructive">*</span></Label>
                  <Input v-model="scheduleForm.name" :placeholder="$t('iotApp.project.taskNamePh')" data-testid="aitask-name" />
                </div>
                <div v-if="eventConfig.triggerType === 'schedule'" class="flex flex-col gap-1.5">
                  <Label class="text-xs">{{ $t('iotApp.project.scheduleType') }}</Label>
                  <Select v-model="scheduleForm.scheduleType">
                    <SelectTrigger data-testid="aitask-schedule-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interval">{{ $t('iotApp.project.scheduleInterval') }}</SelectItem>
                      <SelectItem value="daily">{{ $t('iotApp.project.scheduleDaily') }}</SelectItem>
                      <SelectItem value="weekly">{{ $t('iotApp.project.scheduleWeekly') }}</SelectItem>
                      <SelectItem value="once">{{ $t('iotApp.project.scheduleOnceItem') }}</SelectItem>
                      <SelectItem value="none">{{ $t('iotApp.project.scheduleNoneItem') }}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="flex flex-col gap-1.5 md:col-span-2">
                  <Label class="text-xs">{{ $t('iotApp.project.taskDescLabel') }}</Label>
                  <Textarea v-model="scheduleForm.desc" :rows="2" :placeholder="$t('iotApp.project.taskDescPh')" />
                </div>
              </div>
            </section>

            <section class="bg-card rounded-lg border p-4 shadow-sm">
              <div class="mb-3 flex items-center gap-2">
                <VbenIcon icon="lucide:calendar-clock" class="text-primary size-4" />
                <h3 class="text-sm font-medium">{{ $t('iotApp.ruleTrigger.triggerConfig') }}</h3>
              </div>
              <EventTriggerEditor ref="triggerEditor" v-model="eventConfig" :project-i-d="projectID" :scope="scope" />
              <div v-if="eventConfig.triggerType === 'schedule'" class="mt-3 grid grid-cols-1 items-end gap-3 md:grid-cols-2">
                <div v-if="scheduleForm.scheduleType === 'interval'" class="flex flex-col gap-1.5">
                  <Label class="text-xs">{{ $t('iotApp.project.intervalMinutesLabel') }}</Label>
                  <Input v-model.number="scheduleForm.intervalMin" type="number" :min="1" data-testid="aitask-interval" />
                </div>
                <div v-if="scheduleForm.scheduleType === 'once'" class="flex flex-col gap-1.5">
                  <Label class="text-xs">{{ $t('iotApp.project.execTimeLabel') }}</Label>
                  <Input v-model="scheduleForm.onceTime" type="datetime-local" />
                </div>
                <div v-if="scheduleForm.scheduleType === 'daily'" class="flex flex-col gap-1.5">
                  <Label class="text-xs">{{ $t('iotApp.project.dailyTimeLabel') }}</Label>
                  <Input v-model="scheduleForm.dailyTime" type="time" />
                </div>
                <template v-if="scheduleForm.scheduleType === 'weekly'">
                  <div class="flex flex-col gap-1.5">
                    <Label class="text-xs">{{ $t('iotApp.project.weeklyLabel') }}</Label>
                    <Select v-model.number="scheduleForm.weeklyDay">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="item in SIMULATE_WEEKDAY_OPTIONS" :key="item.value" :value="item.value">
                          {{ item.label }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <Label class="text-xs">{{ $t('iotApp.project.execTimeLabel') }}</Label>
                    <Input v-model="scheduleForm.weeklyTime" type="time" />
                  </div>
                </template>
                <div class="bg-muted/40 text-muted-foreground flex min-h-9 items-center gap-2 rounded-md border px-3 text-xs md:col-span-2">
                  <VbenIcon icon="lucide:info" class="size-3.5 shrink-0" />
                  <span>{{ $t('iotApp.project.currentPlan', { plan: scheduleSummary }) }}</span>
                </div>
              </div>
              <p v-else class="text-muted-foreground mt-3 text-xs">{{ scheduleSummary }}</p>
            </section>

            <section class="bg-card rounded-lg border p-4 shadow-sm">
              <div class="mb-3 flex items-center gap-2">
                <VbenIcon icon="lucide:settings-2" class="text-primary size-4" />
                <h3 class="text-sm font-medium">{{ $t('iotApp.project.execControlHeading') }}</h3>
              </div>
              <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div class="flex flex-col gap-1.5">
                  <Label class="text-xs">{{ $t('iotApp.project.repeatTimesShort') }}</Label>
                  <Input v-model.number="scheduleForm.repeatTimes" type="number" :min="0" />
                  <span class="text-muted-foreground text-xs">{{ $t('iotApp.project.repeatHint') }}</span>
                </div>
                <div class="flex flex-col gap-1.5">
                  <Label class="text-xs">{{ $t('iotApp.project.timeoutSecondsLabel') }}</Label>
                  <Input v-model.number="scheduleForm.timeoutSeconds" type="number" :min="1" />
                  <span class="text-muted-foreground text-xs">{{ $t('iotApp.project.timeoutHint') }}</span>
                </div>
              </div>
            </section>
          </div>
          <div class="border-border/70 mt-3 flex shrink-0 items-center justify-end gap-2 border-t pt-3">
            <Button variant="outline" size="sm" @click="requestClose">{{ $t('iotApp.ota.closeLabel') }}</Button>
            <Button size="sm" :disabled="initializationPending || restoringDraft" data-testid="aitask-goto-dev" @click="gotoDev">
              {{ restoringDraft ? $t('iotApp.schemaForm.restoringDraft') : $t('iotApp.schemaForm.nextCodeEdit') }}
              <VbenIcon icon="lucide:arrow-right" class="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
  <Dialog :open="discardOpen" @update:open="(value: boolean) => !discarding && (discardOpen = value)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ $t('iotApp.project.exitDevTitle') }}</DialogTitle>
        <DialogDescription>{{ $t('iotApp.project.exitDevDesc') }}</DialogDescription>
      </DialogHeader>
      <div class="flex flex-wrap justify-end gap-2">
        <Button variant="outline" :disabled="discarding" @click="discardOpen = false">{{ $t('iotApp.project.keepEditing') }}</Button>
        <Button :disabled="discarding" data-testid="aitask-keep-draft" @click="keepDraftAndClose">{{ $t('iotApp.project.saveDraftExit') }}</Button>
        <Button variant="destructive" :disabled="discarding" @click="discardDraft">{{ discarding ? $t('iotApp.project.cleaning') : $t('iotApp.project.discardAndClean') }}</Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
