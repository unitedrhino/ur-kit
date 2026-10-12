<script setup lang="ts">
import { notifyRequestError } from '@vben/saas/request-error';

import type { AlarmRule } from '../../types/alarm-v2.types';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

/**
 * 文件说明：告警规则新建/编辑页
 * 使用 4 步任务向导串联监控范围、触发条件、通知配置和创建前检查，并统一处理错误定位。
 */
import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { useProjectStore } from '@vben/stores';
import { useTabs } from '@vben/hooks';
import { message } from '@vben/saas';

import { Alert, AlertDescription, AlertTitle } from '@unitedrhino/saas-ui/ui/alert';
import { Button } from '@unitedrhino/saas-ui/ui/button';

import { StepShell } from '../../../../components/step-shell';
import { createAlarmInfo, getAlarmInfoOne, updateAlarmInfo, updateAlarmInfoStatus } from '../../api/alarm-info.api';
import { loadAlarmCapabilities } from '../../composables/useAlarmCapabilities';
import { summarizeTriggerConditions } from '../../composables/useAlarmRuleValidation';
import { fromAlarmInfo, toAlarmInfoCreateReq, toAlarmInfoUpdateReq } from '../../composables/useAlarmConvert';
import { getAlarmRuleEditorState } from '../../composables/useAlarmRuleEditor';
import { validateAlarmRule } from '../../composables/useAlarmRuleValidation';
import StepBasic from './components/StepBasic.vue';
import StepCondition from './components/StepCondition.vue';
import StepConfirm from './components/StepConfirm.vue';
import StepNotify from './components/StepNotify.vue';

/** routePrefix 用于保存成功后跳回规则列表，供 iot（默认）与能源中心等宿主复用。 */
const props = withDefaults(
  defineProps<{
    routePrefix?: string;
  }>(),
  {
    routePrefix: '/iot/alarm',
  },
);
const route = useRoute();
const router = useRouter();

/** contentTemplateRoutePrefix 通知内容模板管理的路由前缀：与宿主传入的告警路由前缀一致（如 /iot/alarm、/structure-monitor/alarm）。 */
const contentTemplateRoutePrefix = computed(() => props.routePrefix);
const { setTabTitle } = useTabs();
const projectStore = useProjectStore();

const ruleId = route.params.id as string | undefined;
const editorState = getAlarmRuleEditorState(ruleId);

const step = ref(1);
const maxVisitedStep = ref(editorState.maxVisitedStep);
const attemptedSteps = ref<number[]>([]);
const saving = ref(false);
// capabilityLoading 表示规则编辑器正在获取后端能力契约。
const capabilityLoading = ref(true);
// capabilityError 保存能力契约加载失败后的阻断提示。
const capabilityError = ref('');
// 步骤标题与说明经 $t 渲染，语言切换时随响应式更新。
const steps = computed(() => [
  { title: $t('iotApp.alarmRule.stepMonitor'), description: $t('iotApp.alarmRule.stepMonitorDesc') },
  { title: $t('iotApp.alarmRule.stepWhen'), description: $t('iotApp.alarmRule.stepWhenDesc') },
  { title: $t('iotApp.alarmRule.stepNotify'), description: $t('iotApp.alarmRule.stepNotifyDesc') },
  { title: $t('iotApp.alarmCommon.checkAndCreate'), description: $t('iotApp.alarmRule.stepConfirmDesc') },
]);

const form = ref<AlarmRule>({
  name: '',
  target: {
    selectType: 'all',
    targetKind: 'product',
    productID: '',
    devices: [],
    areas: [],
    groups: [],
  },
  evalPeriod: 1,
  status: 1,
  if: { triggers: [] },
  notify: { ladders: [] },
  desc: '',
});

/** ruleTargetLabel 组装当前规则的告警来源摘要（如「电表 / 全部设备」），供 AI 判断工具创建时封装上下文。 */
const ruleTargetLabel = computed(() => {
  const t = form.value.target;
  if (!t) return '';
  const kind = t.targetKind === 'category' ? t.categoryName || $t('iotApp.alarmRule.categoryLabel') : t.productName || t.productID || $t('iotApp.alarmRule.productLabel');
  const scope =
    t.selectType === 'fixed'
      ? `${$t('iotApp.alarmRule.scopeDevice')}${t.devices?.length ? `(${t.devices.length})` : ''}`
      : t.selectType === 'area'
        ? $t('iotApp.alarmRule.scopeArea')
        : t.selectType === 'group'
          ? $t('iotApp.alarmRule.scopeGroup')
          : $t('iotApp.alarmRule.scopeAll');
  return `${kind} / ${scope}`;
});

/** aiToolContext 提供给 AI 工具创建者用于封装精确上下文：产品 ID/名称、物模型类型、设备范围、评估周期，
 *  让 AI 一次性拿到可执行的参数，避免就「具体哪个产品/什么范围」等问题发起澄清。 */
const aiToolContext = computed(() => {
  const t = form.value.target;
  const scope =
    t?.selectType === 'fixed'
      ? `指定设备(${t.devices?.length ?? 0}台)`
      : t?.selectType === 'area'
        ? '指定区域'
        : t?.selectType === 'group'
          ? '指定分组'
          : '全部设备';
  return {
    sourceType: t?.targetKind === 'category' ? '品类' : '产品',
    productID: t?.productID || '',
    productName: t?.productName || '',
    categoryID: t?.categoryID || '',
    categoryName: t?.categoryName || '',
    scope,
    evalPeriod: `${form.value.evalPeriod ?? 1}分钟`,
    // 触发条件可读摘要（如「同时满足：Ua的60秒内的最新值>200」）：AI 开发判断工具的核心依据
    triggerCondition: summarizeTriggerConditions(form.value.if?.triggers ?? []),
  };
});

/** 当前表单的全部阻断性问题，供步骤导航和确认页共同消费。 */
const allIssues = computed(() => validateAlarmRule(form.value));

/** 当前步骤已经尝试继续后才展示错误，避免用户刚进入页面就看到满屏红字。 */
const visibleStepIssues = computed(() => {
  if (!attemptedSteps.value.includes(step.value) && step.value !== 4) return [];
  return allIssues.value.filter((issue) => issue.step === step.value);
});

/** 返回步骤当前状态，用于在步骤条中展示完成或待修正。 */
function stepState(stepNumber: number): 'complete' | 'error' | 'pending' {
  const issues = allIssues.value.filter((issue) => issue.step === stepNumber);
  if (attemptedSteps.value.includes(stepNumber) && issues.length > 0) return 'error';
  if (stepNumber < step.value && issues.length === 0) return 'complete';
  return 'pending';
}

/** initializeEditor 先加载后端能力矩阵，再初始化规则详情。 */
async function initializeEditor() {
  capabilityLoading.value = true;
  capabilityError.value = '';
  try {
    await loadAlarmCapabilities();
  } catch {
    capabilityError.value = $t('iotApp.alarmRule.capabilityFailedDesc');
    capabilityLoading.value = false;
    return;
  }
  await setTabTitle(editorState.title);
  if (ruleId) {
    try {
      const data = await getAlarmInfoOne(ruleId);
      form.value = fromAlarmInfo(data);
    } catch (requestError) {
      notifyRequestError(requestError, () => $t('iotApp.alarmRule.loadDetailFailed'), (text) => message.error(text));
    }
  }
  capabilityLoading.value = false;
}

onMounted(() => {
  initializeEditor();

  // 项目切换守卫：编辑/新建期间切换项目会导致保存时报"规则不属于当前项目"
  // （dmsvr 按当前项目上下文校验归属），检测到项目变化立即退出编辑页回列表。
  const openedProjectID = projectStore.currentProjectID;
  watch(
    () => projectStore.currentProjectID,
    (value) => {
      if (value && value !== openedProjectID) {
        message.warning('项目已切换，请重新进入规则编辑');
        router.replace(`${props.routePrefix}/rule`);
      }
    },
  );
});

function next() {
  if (!validateStep(step.value)) return;
  if (step.value < 4) {
    step.value++;
    maxVisitedStep.value = Math.max(maxVisitedStep.value, step.value);
  }
}

function prev() {
  if (step.value > 1) step.value--;
}

function validateStep(current: number): boolean {
  if (!attemptedSteps.value.includes(current)) {
    attemptedSteps.value = [...attemptedSteps.value, current];
  }
  const issues = allIssues.value.filter((issue) => issue.step === current);
  if (issues.length === 0) return true;
  message.error(issues[0]!.message);
  return false;
}

async function save() {
  const issues = allIssues.value;
  if (issues.length > 0) {
    attemptedSteps.value = [1, 2, 3];
    step.value = issues[0]!.step;
    message.error(`还有 ${issues.length} 项需要完善：${issues[0]!.message}`);
    return;
  }
  saving.value = true;
  try {
    if (ruleId) {
      await updateAlarmInfo(toAlarmInfoUpdateReq(form.value));
      await updateAlarmInfoStatus(ruleId, form.value.status);
      message.success('更新成功');
    } else {
      const created = await createAlarmInfo(toAlarmInfoCreateReq(form.value));
      if (form.value.status !== 1 && created?.id) {
        await updateAlarmInfoStatus(created.id, form.value.status);
      }
      message.success('创建成功');
    }
    router.push(`${props.routePrefix}/rule`);
  } catch (error: any) {
    const detail = error?.response?.data?.message ?? error?.message;
    notifyRequestError(error, () => detail || (ruleId ? $t('orgManage.common.updateFailed') : $t('ui.actionMessage.createFailed')), (text) => message.error(text));
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Page content-class="!p-0">
    <div
      v-if="capabilityLoading"
      class="text-muted-foreground flex min-h-[calc(100vh-56px)] items-center justify-center text-sm"
      data-testid="alarm-capability-loading"
    >
      {{ $t('iotApp.alarmRule.capabilityLoading') }}
    </div>
    <div v-else-if="capabilityError" class="p-6" data-testid="alarm-capability-error">
      <Alert variant="destructive">
        <AlertTitle>{{ $t('iotApp.alarmRule.capabilityFailed') }}</AlertTitle>
        <AlertDescription class="mt-2">
          {{ capabilityError }}
        </AlertDescription>
        <Button class="mt-4" variant="outline" @click="initializeEditor">{{ $t('iotApp.alarmCommon.reload') }}</Button>
      </Alert>
    </div>
    <div v-else>
      <StepShell :steps="steps" :step="step" :max-visited-step="maxVisitedStep" :step-state="stepState" :on-step-click="(s: number) => (step = s)">
        <Alert v-if="visibleStepIssues.length > 0" class="mb-4" variant="destructive">
          <AlertTitle>{{ $t('iotApp.alarmRule.issuesPending', { count: visibleStepIssues.length }) }}</AlertTitle>
          <AlertDescription>
            <ul class="mt-2 flex list-disc flex-col gap-1 pl-5">
              <li v-for="issue in visibleStepIssues" :key="`${issue.field}-${issue.message}`">
                {{ issue.message }}
              </li>
            </ul>
          </AlertDescription>
        </Alert>

        <!-- 步骤内容 -->
        <StepBasic v-if="step === 1" v-model="form" :issues="visibleStepIssues" />
        <StepCondition v-if="step === 2" v-model:triggers="form.if.triggers" :issues="visibleStepIssues" :target="form.target" />
        <StepNotify v-if="step === 3" v-model:ladders="form.notify.ladders" v-model:aiConfig="form.aiConfig" :issues="visibleStepIssues" :rule-name="form.name" :target-label="ruleTargetLabel" :project-id="form.projectID" :ai-tool-context="aiToolContext" :content-template-route-prefix="contentTemplateRoutePrefix" />
        <StepConfirm v-if="step === 4" :form="form" :issues="allIssues" />

        <template #footer>
          <!-- 底部操作：属于当前步骤的表单内容区域。 -->
          <div class="mt-6 flex justify-end gap-3 border-t pt-4">
            <Button v-if="step > 1" type="button" variant="outline" @click="prev">{{ $t('iotApp.alarmCommon.prevStep') }}</Button>
            <Button v-if="step < 4" @click="next">{{ $t('iotApp.alarmCommon.checkAndContinue') }}</Button>
            <Button v-if="step === 4" :disabled="saving || allIssues.length > 0" @click="save">
              {{ saving ? $t('iotApp.alarmCommon.saving') : ruleId ? $t('iotApp.alarmCommon.saveChanges') : $t('iotApp.alarmRule.createRule') }}
            </Button>
          </div>
        </template>
      </StepShell>
    </div>
  </Page>
</template>
