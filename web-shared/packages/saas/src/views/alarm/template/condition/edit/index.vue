<script setup lang="ts">
import { notifyRequestError } from '@vben/saas/request-error';

import type { AlarmRuleIssue } from '../../../composables/useAlarmRuleValidation';
/**
 * 文件说明：触发条件模板新建/编辑页
 * 以独立三步表单承载模板范围、条件配置和保存前检查，并严格映射后端模板契约。
 */
import type { AlarmObjectSchema, AlarmRule, ConditionTemplate, Trigger } from '../../../types/alarm-v2.types';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { message } from '@vben/saas';

import { Alert, AlertDescription, AlertTitle } from '@unitedrhino/saas-ui/ui/alert';
import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldTitle } from '@unitedrhino/saas-ui/ui/field';
import { Input } from '@unitedrhino/saas-ui/ui/input';
import { Textarea } from '@unitedrhino/saas-ui/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@unitedrhino/saas-ui/ui/toggle-group';

import { StepShell } from '../../../../../components/step-shell';
import { createConditionTemplate, getConditionTemplateOne, updateConditionTemplate } from '../../../api/alarm-condition-template.api';
import AlarmSelect from '../../../components/AlarmSelect.vue';
import TriggerEditor from '../../../components/TriggerEditor.vue';
import { defaultAggregateForField, defaultCompareForField } from '../../../composables/useAlarmCapabilities';
import { fromConditionTemplate, toConditionTemplateCreateReq, toConditionTemplateUpdateReq } from '../../../composables/useAlarmConvert';
import { validateAlarmRule } from '../../../composables/useAlarmRuleValidation';
import { useAlarmTemplateMeta } from '../../../composables/useAlarmTemplateMeta';
import StepOverview from '../../../rule/edit/components/StepOverview.vue';

type BindType = 'category' | 'none' | 'product';

interface ConditionTemplateForm extends ConditionTemplate {
  /** 后端只允许产品和品类二选一；none 表示两个字段都不传。 */
  bindType: BindType;
  /** 产品 ID 或产品品类 ID。 */
  bindValue: string;
  /** 后端状态：1 启用，2 停用。 */
  status: 1 | 2;
}

interface FormIssue {
  conditionIssue?: AlarmRuleIssue;
  field: 'bindValue' | 'condition' | 'name' | 'summary';
  message: string;
  step: number;
}

/** routePrefix 用于保存成功后跳回模板列表，供 iot（默认）与能源中心等宿主复用。 */
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

const templateId = computed(() => String(route.params.id ?? ''));
const isEdit = computed(() => !!templateId.value);

const step = ref(1);
const maxVisitedStep = ref(1);
const attemptedSteps = ref<number[]>([]);
const loading = ref(false);
const saving = ref(false);
// 步骤标题与说明经 $t 渲染，语言切换时随响应式更新。
const steps = computed(() => [
  { title: $t('iotApp.alarmCommon.templateInfo'), description: $t('iotApp.alarmCondTpl.stepInfoDesc') },
  { title: $t('iotApp.alarmCondTpl.stepConditionTitle'), description: $t('iotApp.alarmCondTpl.stepConditionDesc') },
  { title: $t('iotApp.alarmCommon.checkAndSave'), description: $t('iotApp.alarmCondTpl.stepConfirmDesc') },
]);

const { bindOptions, schema, load: loadMeta, loadSchema, bindValueLabel } = useAlarmTemplateMeta();

/** scopeOptions 定义模板可选的三类互斥适用范围；label 经 $t 翻译。 */
const scopeOptions = computed(() => [
  { value: 'none' as BindType, label: $t('iotApp.alarmCondTpl.genericTemplate') },
  { value: 'category' as BindType, label: $t('iotApp.alarmCondTpl.categoryOpt') },
  { value: 'product' as BindType, label: $t('iotApp.alarmRule.productLabel') },
]);

/** 当前绑定范围的类型文案。 */
const bindTypeText = computed(() => (form.value.bindType === 'category' ? $t('iotApp.alarmCondTpl.categoryOpt') : $t('iotApp.alarmRule.productLabel')));

/** bindingOptions 返回当前范围类型对应的产品或品类选项。 */
const bindingOptions = computed(() => bindOptions.value.find((item) => item.value === form.value.bindType)?.children ?? []);

/** handleBindTypeChange 切换模板范围时清空上一范围的绑定值。 */
function handleBindTypeChange(value: unknown) {
  if (value !== 'none' && value !== 'category' && value !== 'product') return;
  if (form.value.bindType === value) return;
  form.value.bindType = value;
  form.value.bindValue = '';
}

/** handleStatusChange 将分组按钮值映射为后端状态枚举。 */
function handleStatusChange(value: unknown) {
  if (value === '1' || value === '2') form.value.status = Number(value) as 1 | 2;
}

/** 创建模板编辑器的最小合法条件组；模板本身不定义告警级别。 */
function createEmptyTrigger(): Trigger {
  const field = schema.value.onlineFields[0] ?? schema.value.metricFields[0] ?? schema.value.eventFields[0] ?? schema.value.actionFields[0];
  const sourceType = field?.sourceType ?? 'online';
  const aggregateMethod = defaultAggregateForField(sourceType, field?.valueType);
  return {
    id: `trigger-${Date.now()}`,
    type: 'and',
    level: 'major',
    criteria: [
      {
        id: `criterion-${Date.now()}`,
        type: 'plain',
        plain: {
          logic: 'and',
          leaves: [
            {
              id: `leaf-${Date.now()}`,
              sourceType,
              dataID: field?.dataID,
              dataName: field?.name,
              compare:
                sourceType === 'online'
                  ? { termType: 'eq', values: ['offline'] }
                  : {
                      termType: defaultCompareForField(sourceType, field?.valueType, aggregateMethod),
                      values: [''],
                    },
              period: 60,
              aggregateMethod,
              continuePeriod: 1,
            },
          ],
        },
      },
    ],
  };
}

const form = ref<ConditionTemplateForm>({
  id: '',
  name: '',
  summary: '',
  trigger: createEmptyTrigger(),
  bindType: 'none',
  bindValue: '',
  status: 1,
});

/** 通用模板没有物模型绑定，只提供后端内置在线状态字段。 */
const editorSchema = computed<AlarmObjectSchema>(() => {
  if (form.value.bindType !== 'none') return schema.value;
  return {
    metricFields: [],
    eventFields: [],
    actionFields: [],
    onlineFields: schema.value.onlineFields,
  };
});

/** 借用告警规则的条件契约校验，确保复杂判据与规则编辑页采用同一判断。 */
const conditionIssues = computed<AlarmRuleIssue[]>(() => {
  const rule: AlarmRule = {
    name: '模板条件校验',
    target: { selectType: 'all', targetKind: 'product', productID: '__template__' },
    evalPeriod: 1,
    status: 1,
    if: { triggers: [form.value.trigger] },
    notify: {
      ladders: [
        {
          id: '__template_ladder__',
          order: 1,
          timing: 'trigger',
          levels: ['major'],
          channels: ['email'],
          channelTemplates: { email: '1' },
          delaySeconds: 0,
          targets: { userIDs: [1] },
          callbacks: [],
        },
      ],
    },
  };
  return validateAlarmRule(rule).filter((issue) => issue.step === 2);
});

const allIssues = computed<FormIssue[]>(() => {
  const issues: FormIssue[] = [];
  const name = form.value.name.trim();
  if (!name) issues.push({ step: 1, field: 'name', message: '请输入模板名称' });
  else if (name.length > 100) issues.push({ step: 1, field: 'name', message: '模板名称不能超过 100 个字符' });
  if (form.value.summary.length > 500) issues.push({ step: 1, field: 'summary', message: '模板说明不能超过 500 个字符' });
  if (form.value.bindType !== 'none' && !form.value.bindValue) {
    issues.push({ step: 1, field: 'bindValue', message: '请选择需要绑定的产品或产品品类' });
  }
  conditionIssues.value.forEach((conditionIssue) => {
    issues.push({ step: 2, field: 'condition', message: conditionIssue.message, conditionIssue });
  });
  return issues;
});

const visibleIssues = computed(() => {
  if (step.value === 3) return allIssues.value;
  if (!attemptedSteps.value.includes(step.value)) return [];
  return allIssues.value.filter((issue) => issue.step === step.value);
});

const visibleConditionIssues = computed(() => visibleIssues.value.map((issue) => issue.conditionIssue).filter(Boolean) as AlarmRuleIssue[]);

function issueFor(field: FormIssue['field']): string {
  return visibleIssues.value.find((issue) => issue.field === field)?.message ?? '';
}

function stepState(stepNumber: number): 'complete' | 'error' | 'pending' {
  const issues = allIssues.value.filter((issue) => issue.step === stepNumber);
  if (attemptedSteps.value.includes(stepNumber) && issues.length > 0) return 'error';
  if (stepNumber < step.value && issues.length === 0) return 'complete';
  return 'pending';
}

function markAttempted(stepNumber: number) {
  if (!attemptedSteps.value.includes(stepNumber)) attemptedSteps.value = [...attemptedSteps.value, stepNumber];
}

function next() {
  markAttempted(step.value);
  const issue = allIssues.value.find((item) => item.step === step.value);
  if (issue) {
    message.error(issue.message);
    return;
  }
  if (step.value < 3) {
    step.value++;
    maxVisitedStep.value = Math.max(maxVisitedStep.value, step.value);
  }
}

function prev() {
  if (step.value > 1) step.value--;
}

function goBack() {
  router.push(`${props.routePrefix}/template/condition`);
}

/** 创建和更新共用完整请求，避免更新状态时清空模板条件。 */
async function save() {
  attemptedSteps.value = [1, 2];
  if (allIssues.value.length > 0) {
    step.value = allIssues.value[0]!.step;
    message.error(`还有 ${allIssues.value.length} 项需要完善：${allIssues.value[0]!.message}`);
    return;
  }
  saving.value = true;
  try {
    if (isEdit.value) {
      await updateConditionTemplate({
        ...toConditionTemplateUpdateReq(form.value, form.value.bindType, form.value.bindValue),
        status: form.value.status,
      });
    } else {
      const created = await createConditionTemplate(toConditionTemplateCreateReq(form.value, form.value.bindType, form.value.bindValue));
      if (form.value.status === 2 && created?.id) {
        await updateConditionTemplate({
          ...toConditionTemplateUpdateReq({ ...form.value, id: created.id }, form.value.bindType, form.value.bindValue),
          status: 2,
        });
      }
    }
    message.success(isEdit.value ? '模板更新成功' : '模板创建成功');
    goBack();
  } catch (error: any) {
    notifyRequestError(error, () => error?.response?.data?.message ?? error?.message ?? $t('orgManage.common.saveFailed'), (text) => message.error(text));
  } finally {
    saving.value = false;
  }
}

watch(
  () => [form.value.bindType, form.value.bindValue] as const,
  ([bindType, bindValue]) => {
    if (bindType !== 'none' && bindValue) loadSchema(bindType, bindValue);
  },
  { immediate: true },
);

onMounted(async () => {
  loading.value = true;
  try {
    await loadMeta();
    if (!isEdit.value) return;
    const data = await getConditionTemplateOne(templateId.value);
    const converted = fromConditionTemplate(data);
    const bindType: BindType = data.productCategoryID ? 'category' : data.productID ? 'product' : 'none';
    const bindValue = data.productCategoryID || data.productID || '';
    form.value = {
      ...converted,
      trigger: converted.trigger?.criteria ? converted.trigger : createEmptyTrigger(),
      bindType,
      bindValue,
      status: data.status === 2 ? 2 : 1,
    };
  } catch (error: any) {
    notifyRequestError(error, () => error?.response?.data?.message ?? error?.message ?? $t('ui.actionMessage.loadFailed'), (text) => message.error(text));
  } finally {
    loading.value = false;
  }
});

const bindingSummary = computed(() => {
  if (form.value.bindType === 'none') return $t('iotApp.alarmCondTpl.genericNoBind');
  return `${bindTypeText.value}：${bindValueLabel(form.value.bindType, form.value.bindValue) || $t('iotApp.alarmCondTpl.unselected')}`;
});
</script>

<template>
  <Page content-class="!p-0">
    <StepShell
      :steps="steps"
      :step="step"
      :max-visited-step="maxVisitedStep"
      :step-state="stepState"
      :on-step-click="(s: number) => (step = s)"
      :loading="loading"
    >
      <Alert v-if="visibleIssues.length > 0" class="mb-5" variant="destructive">
        <AlertTitle>本步骤还有 {{ visibleIssues.length }} 项需要完善</AlertTitle>
        <AlertDescription>
          <ul class="mt-2 flex list-disc flex-col gap-1 pl-5">
            <li v-for="issue in visibleIssues" :key="`${issue.step}-${issue.field}-${issue.message}`">{{ issue.message }}</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div v-if="step === 1" class="flex flex-col gap-5">
        <div class="border-border border-b pb-4">
          <div class="text-sm font-medium">{{ $t('iotApp.alarmCondTpl.scopeTitle') }}</div>
          <div class="text-muted-foreground mt-1 text-xs leading-5">{{ $t('iotApp.alarmCondTpl.bindHint') }}</div>
        </div>

        <FieldGroup class="gap-5">
          <Field class="grid grid-cols-[120px_1fr] items-start gap-4" :data-invalid="Boolean(issueFor('name'))">
            <FieldLabel for="condition-template-name" class="pt-2">
              {{ $t('iotApp.alarmCommon.templateName') }}
              <span class="text-destructive">*</span>
            </FieldLabel>
            <FieldContent class="max-w-xl">
              <Input
                id="condition-template-name"
                v-model="form.name"
                maxlength="100"
                :placeholder="$t('iotApp.alarmCondTpl.namePh')"
                :aria-invalid="Boolean(issueFor('name'))"
              />
              <FieldError v-if="issueFor('name')">{{ issueFor('name') }}</FieldError>
              <FieldDescription v-else>{{ $t('iotApp.alarmCommon.requiredMax100') }}</FieldDescription>
            </FieldContent>
          </Field>

          <Field class="grid grid-cols-[120px_1fr] items-start gap-4" :data-invalid="Boolean(issueFor('summary'))">
            <FieldLabel for="condition-template-summary" class="pt-2">{{ $t('iotApp.alarmCondTpl.descLabel') }}</FieldLabel>
            <FieldContent class="max-w-xl">
              <Textarea
                id="condition-template-summary"
                v-model="form.summary"
                maxlength="500"
                rows="3"
                :placeholder="$t('iotApp.alarmCondTpl.descPh')"
                :aria-invalid="Boolean(issueFor('summary'))"
              />
              <FieldDescription>{{ form.summary.length }}/500</FieldDescription>
            </FieldContent>
          </Field>

          <Field class="grid grid-cols-[120px_1fr] items-start gap-4" :data-invalid="Boolean(issueFor('bindValue'))">
            <FieldTitle class="pt-2">{{ $t('iotApp.alarmCondTpl.scopeLabel') }}</FieldTitle>
            <FieldContent class="max-w-xl gap-3">
              <ToggleGroup
                type="single"
                variant="outline"
                :model-value="form.bindType"
                class="flex flex-wrap justify-start gap-3"
                :aria-label="$t('iotApp.alarmCondTpl.scopeLabel')"
                @update:model-value="handleBindTypeChange"
              >
                <ToggleGroupItem
                  v-for="option in scopeOptions"
                  :key="option.value"
                  :value="option.value"
                  class="data-[state=on]:border-primary data-[state=on]:bg-primary/5 data-[state=on]:text-primary px-3"
                >
                  {{ option.label }}
                </ToggleGroupItem>
              </ToggleGroup>
              <AlarmSelect
                v-if="form.bindType !== 'none'"
                v-model="form.bindValue"
                class="w-full max-w-md"
                :class="issueFor('bindValue') ? 'border-destructive' : ''"
                :options="bindingOptions"
                :placeholder="$t('iotApp.alarmCondTpl.selectBindPh', { type: bindTypeText })"
              />
              <FieldError v-if="issueFor('bindValue')">{{ issueFor('bindValue') }}</FieldError>
              <FieldDescription v-else>{{ $t('iotApp.alarmCondTpl.genericOnlyHint') }}</FieldDescription>
            </FieldContent>
          </Field>

          <Field class="grid grid-cols-[120px_1fr] items-center gap-4">
            <FieldTitle>{{ $t('iotApp.alarmCommon.enableStatus') }}</FieldTitle>
            <ToggleGroup
              type="single"
              variant="outline"
              :model-value="String(form.status)"
              class="justify-start"
              :aria-label="$t('iotApp.alarmCommon.enableStatus')"
              @update:model-value="handleStatusChange"
            >
              <ToggleGroupItem value="1">{{ $t('iotApp.common.enable') }}</ToggleGroupItem>
              <ToggleGroupItem value="2">{{ $t('iotApp.common.disable') }}</ToggleGroupItem>
            </ToggleGroup>
          </Field>
        </FieldGroup>
      </div>

      <div v-else-if="step === 2" class="flex flex-col gap-5">
        <div class="border-border border-b pb-4">
          <div class="text-sm font-medium">{{ $t('iotApp.alarmCondTpl.conditionGroupTitle') }}</div>
          <div class="text-muted-foreground mt-1 text-xs leading-5">{{ $t('iotApp.alarmCondTpl.conditionGroupDesc') }}</div>
        </div>
        <TriggerEditor
          :trigger="form.trigger"
          :schema="editorSchema"
          :show-level="false"
          :advanced="true"
          :issues="visibleConditionIssues"
          @update:trigger="(value) => (form.trigger = value)"
        />
      </div>

      <div v-else class="flex flex-col gap-5 text-sm">
        <div class="border-border border-b pb-4">
          <div class="text-sm font-medium">{{ $t('iotApp.alarmCondTpl.confirmTitle') }}</div>
          <div class="text-muted-foreground mt-1 text-xs leading-5">{{ $t('iotApp.alarmCondTpl.confirmDesc') }}</div>
        </div>
        <StepOverview
          :title="$t('iotApp.alarmCondTpl.confirmStepTitle')"
          :description="$t('iotApp.alarmCondTpl.confirmStepDesc')"
          :summary-label="$t('iotApp.alarmCondTpl.runWay')"
          :summary="bindingSummary"
        />
        <div class="grid gap-4 md:grid-cols-2">
          <div><span class="text-muted-foreground">{{ $t('iotApp.alarmCommon.templateName') }}：</span>{{ form.name || $t('iotApp.alarmCondTpl.unfilled') }}</div>
          <div><span class="text-muted-foreground">{{ $t('iotApp.alarmCommon.enableStatus') }}：</span>{{ form.status === 1 ? $t('iotApp.common.enable') : $t('iotApp.common.disable') }}</div>
          <div class="md:col-span-2"><span class="text-muted-foreground">{{ $t('iotApp.alarmCondTpl.scopeLabel') }}：</span>{{ bindingSummary }}</div>
          <div class="md:col-span-2"><span class="text-muted-foreground">{{ $t('iotApp.alarmCondTpl.criteriaCount') }}：</span>{{ form.trigger.criteria.length }}</div>
        </div>
      </div>

      <template #footer>
        <div class="mt-6 flex justify-between gap-3 border-t pt-4">
          <Button variant="outline" @click="goBack">{{ $t('iotApp.common.cancel') }}</Button>
          <div class="flex gap-3">
            <Button v-if="step > 1" variant="outline" @click="prev">{{ $t('iotApp.alarmCommon.prevStep') }}</Button>
            <Button v-if="step < 3" @click="next">{{ $t('iotApp.alarmCommon.checkAndContinue') }}</Button>
            <Button v-else :disabled="saving" @click="save">
              {{ saving ? $t('iotApp.alarmCommon.saving') : isEdit ? $t('iotApp.alarmCommon.saveChanges') : $t('iotApp.alarmCommon.createTemplate') }}
            </Button>
          </div>
        </div>
      </template>
    </StepShell>
  </Page>
</template>
