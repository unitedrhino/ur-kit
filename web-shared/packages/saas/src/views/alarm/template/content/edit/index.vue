<script setup lang="ts">
import { notifyRequestError } from '@vben/saas/request-error';

import type { ContentTemplate } from '../../../composables/useAlarmConvert';

/**
 * 文件说明：通知内容模板新建/编辑页
 * 以独立三步表单编辑模板基础信息、触发/恢复内容及扩展请求头，并映射后端完整契约。
 */
import { computed, nextTick, onMounted, ref } from 'vue';
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
import { createNotifyTemplate, getNotifyTemplateOne, testSendNotifyTemplate, updateNotifyTemplate } from '../../../api/alarm-notify-template.api';
import AlarmSelect from '../../../components/AlarmSelect.vue';
import { fromNotifyTemplate, toNotifyTemplateCreateReq, toNotifyTemplateUpdateReq } from '../../../composables/useAlarmConvert';
import { useAlarmNotifyChannel } from '../../../composables/useAlarmNotifyChannel';
import StepOverview from '../../../rule/edit/components/StepOverview.vue';

interface HeaderRow {
  id: string;
  key: string;
  value: string;
}

interface FormIssue {
  field: 'channel' | 'headers' | 'name' | 'recoveryBody' | 'remark' | 'triggerBody';
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
const testingTiming = ref<'' | 'recovery' | 'trigger'>('');
// 步骤标题与说明经 $t 渲染，语言切换时随响应式更新。
const steps = computed(() => [
  { title: $t('iotApp.alarmCommon.templateInfo'), description: $t('iotApp.alarmContentTpl.stepInfoDesc') },
  { title: $t('iotApp.alarmContentTpl.stepContentTitle'), description: $t('iotApp.alarmContentTpl.stepContentDesc') },
  { title: $t('iotApp.alarmCommon.checkAndSave'), description: $t('iotApp.alarmContentTpl.stepConfirmTitle') },
]);

const { channels, loadChannels } = useAlarmNotifyChannel();

/** channelOptions 将后端可执行渠道转换为统一下拉选项。 */
const channelOptions = computed(() => channels.value.map((channel) => ({ label: channel.name, value: channel.code })));

/** handleStatusChange 将分组按钮值映射为后端状态枚举。 */
function handleStatusChange(value: unknown) {
  if (value === '1' || value === '2') form.value.status = Number(value) as 1 | 2;
}

const form = ref<ContentTemplate>({
  id: '',
  name: '',
  channel: '',
  ref: 0,
  status: 1,
  remark: '',
  triggerTitle: '',
  triggerBody: '',
  recoveryTitle: '',
  recoveryBody: '',
  headers: {},
});

const headerRows = ref<HeaderRow[]>([]);
let headerCounter = 0;

// desc 保存 i18n 键，渲染处经 $t 输出当前语言文案；key 为后端模板变量原样输出
const variables = [
  { key: '{{.policyName}}', desc: 'iotApp.alarmContentTpl.varPolicyName' },
  { key: '{{.object}}', desc: 'iotApp.alarmContentTpl.varObject' },
  { key: '{{.currentLevelFmt}}', desc: 'iotApp.alarmContentTpl.varLevel' },
  { key: '{{.currentValueContent}}', desc: 'iotApp.alarmContentTpl.varValue' },
  { key: '{{.triggerTimeFmt}}', desc: 'iotApp.alarmContentTpl.varTriggerTime' },
  { key: '{{.recoveryTimeFmt}}', desc: 'iotApp.alarmContentTpl.varRecoveryTime' },
  { key: '{{.consoleLink}}', desc: 'iotApp.alarmContentTpl.varConsoleLink' },
];

/** confirmSummary 组装确认页的摘要行：名称、渠道与正文填写状态。 */
const confirmSummary = computed(() => {
  const channel = channels.value.find((item) => item.code === form.value.channel)?.name || form.value.channel || $t('iotApp.alarmContentTpl.channelUnselected');
  const triggerState = form.value.triggerBody?.trim() ? $t('iotApp.alarmContentTpl.filled') : $t('iotApp.alarmCondTpl.unfilled');
  const recoveryState = form.value.recoveryBody?.trim() ? $t('iotApp.alarmContentTpl.filled') : $t('iotApp.alarmCondTpl.unfilled');
  return `${form.value.name || $t('iotApp.alarmCondTpl.unfilled')}；${channel}；${$t('iotApp.alarmNotify.triggerLabel')}${triggerState}，${$t('iotApp.alarmNotify.recoveryLabel')}${recoveryState}`;
});

function createHeaderRow(key = '', value = ''): HeaderRow {
  headerCounter++;
  return { id: `header-${Date.now()}-${headerCounter}`, key, value };
}

function addHeader() {
  headerRows.value = [...headerRows.value, createHeaderRow()];
}

function removeHeader(id: string) {
  headerRows.value = headerRows.value.filter((item) => item.id !== id);
}

function headersFromRows(): Record<string, string> {
  return Object.fromEntries(headerRows.value.map((item) => [item.key.trim(), item.value] as const).filter(([key]) => !!key));
}

const allIssues = computed<FormIssue[]>(() => {
  const issues: FormIssue[] = [];
  const name = form.value.name.trim();
  if (!name) issues.push({ step: 1, field: 'name', message: '请输入模板名称' });
  else if (name.length > 100) issues.push({ step: 1, field: 'name', message: '模板名称不能超过 100 个字符' });
  if ((form.value.remark?.length ?? 0) > 500) issues.push({ step: 1, field: 'remark', message: '模板描述不能超过 500 个字符' });
  if (!form.value.channel) issues.push({ step: 1, field: 'channel', message: '请选择通知渠道' });
  else if (!channels.value.some((item) => item.code === form.value.channel)) {
    issues.push({ step: 1, field: 'channel', message: '当前通知渠道不在可执行渠道列表中，请重新选择' });
  }
  if (!form.value.triggerBody?.trim()) issues.push({ step: 2, field: 'triggerBody', message: '请填写告警触发时的通知正文' });
  if (!form.value.recoveryBody?.trim()) issues.push({ step: 2, field: 'recoveryBody', message: '请填写告警恢复时的通知正文' });

  const nonEmptyRows = headerRows.value.filter((item) => item.key.trim() || item.value);
  if (nonEmptyRows.some((item) => !item.key.trim())) {
    issues.push({ step: 2, field: 'headers', message: '扩展请求头存在未填写名称的项目' });
  }
  const keys = nonEmptyRows.map((item) => item.key.trim()).filter(Boolean);
  if (new Set(keys).size !== keys.length) {
    issues.push({ step: 2, field: 'headers', message: '扩展请求头名称不能重复' });
  }
  return issues;
});

const visibleIssues = computed(() => {
  if (step.value === 3) return allIssues.value;
  if (!attemptedSteps.value.includes(step.value)) return [];
  return allIssues.value.filter((issue) => issue.step === step.value);
});

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
  router.push(`${props.routePrefix}/template/content`);
}

let activeInput: HTMLInputElement | HTMLTextAreaElement | null = null;

function onInputFocus(event: Event) {
  activeInput = event.target as HTMLInputElement | HTMLTextAreaElement;
}

async function insertVariable(key: string) {
  if (!activeInput) {
    message.warning('请先点击需要插入变量的标题或正文输入框');
    return;
  }
  const start = activeInput.selectionStart ?? 0;
  const end = activeInput.selectionEnd ?? 0;
  const value = activeInput.value;
  activeInput.value = value.slice(0, start) + key + value.slice(end);
  activeInput.dispatchEvent(new Event('input'));
  await nextTick();
  activeInput.focus();
  const position = start + key.length;
  activeInput.setSelectionRange(position, position);
}

function requestForm(): ContentTemplate {
  return {
    ...form.value,
    recoveryTitle: form.value.triggerTitle,
    headers: headersFromRows(),
  };
}

/** 创建接口没有状态字段；新建禁用模板时在拿到 ID 后补一次完整更新。 */
async function save() {
  attemptedSteps.value = [1, 2];
  if (allIssues.value.length > 0) {
    step.value = allIssues.value[0]!.step;
    message.error(`还有 ${allIssues.value.length} 项需要完善：${allIssues.value[0]!.message}`);
    return;
  }
  saving.value = true;
  try {
    const payload = requestForm();
    if (isEdit.value) {
      await updateNotifyTemplate(toNotifyTemplateUpdateReq(payload));
    } else {
      const created = await createNotifyTemplate(toNotifyTemplateCreateReq(payload));
      if (payload.status === 2 && created?.id) {
        await updateNotifyTemplate(toNotifyTemplateUpdateReq({ ...payload, id: created.id }));
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

async function testSend(timing: 'recovery' | 'trigger') {
  if (!isEdit.value) {
    message.warning('请先保存模板，再执行测试发送');
    return;
  }
  testingTiming.value = timing;
  try {
    await testSendNotifyTemplate(templateId.value, timing);
    message.success(timing === 'trigger' ? '已触发告警通知测试' : '已触发恢复通知测试');
  } catch (error: any) {
    notifyRequestError(error, () => error?.response?.data?.message ?? error?.message ?? $t('ui.actionMessage.sendFailed'), (text) => message.error(text));
  } finally {
    testingTiming.value = '';
  }
}

onMounted(async () => {
  loading.value = true;
  try {
    await loadChannels();
    if (!isEdit.value) return;
    const data = await getNotifyTemplateOne(templateId.value);
    form.value = fromNotifyTemplate(data);
    headerRows.value = Object.entries(data.headers ?? {}).map(([key, value]) => createHeaderRow(key, value));
  } catch (error: any) {
    notifyRequestError(error, () => error?.response?.data?.message ?? error?.message ?? $t('ui.actionMessage.loadFailed'), (text) => message.error(text));
  } finally {
    loading.value = false;
  }
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
        <AlertTitle>{{ $t('iotApp.alarmRule.issuesPending', { count: visibleIssues.length }) }}</AlertTitle>
        <AlertDescription>
          <ul class="mt-2 flex list-disc flex-col gap-1 pl-5">
            <li v-for="issue in visibleIssues" :key="`${issue.step}-${issue.field}-${issue.message}`">{{ issue.message }}</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div v-if="step === 1" class="flex flex-col gap-5">
        <div class="border-border border-b pb-4">
          <div class="text-sm font-medium">{{ $t('iotApp.alarmContentTpl.identityTitle') }}</div>
          <div class="text-muted-foreground mt-1 text-xs leading-5">{{ $t('iotApp.alarmContentTpl.contractHint') }}</div>
        </div>

        <FieldGroup class="gap-5">
          <Field class="grid grid-cols-[120px_1fr] items-start gap-4" :data-invalid="Boolean(issueFor('name'))">
            <FieldLabel for="notify-template-name" class="pt-2">
              {{ $t('iotApp.alarmCommon.templateName') }}
              <span class="text-destructive">*</span>
            </FieldLabel>
            <FieldContent class="max-w-xl">
              <Input
                id="notify-template-name"
                data-testid="notify-template-name"
                v-model="form.name"
                maxlength="100"
                :placeholder="$t('iotApp.alarmContentTpl.namePh')"
                :aria-invalid="Boolean(issueFor('name'))"
              />
              <FieldError v-if="issueFor('name')">{{ issueFor('name') }}</FieldError>
              <FieldDescription v-else>{{ $t('iotApp.alarmCommon.requiredMax100') }}</FieldDescription>
            </FieldContent>
          </Field>

          <Field class="grid grid-cols-[120px_1fr] items-start gap-4" :data-invalid="Boolean(issueFor('remark'))">
            <FieldLabel for="notify-template-description" class="pt-2">{{ $t('iotApp.alarmContentTpl.descLabel') }}</FieldLabel>
            <FieldContent class="max-w-xl">
              <Textarea
                id="notify-template-description"
                v-model="form.remark"
                maxlength="500"
                rows="3"
                :placeholder="$t('iotApp.alarmContentTpl.descPh')"
                :aria-invalid="Boolean(issueFor('remark'))"
              />
              <FieldDescription>{{ form.remark?.length ?? 0 }}/500</FieldDescription>
            </FieldContent>
          </Field>

          <Field class="grid grid-cols-[120px_1fr] items-start gap-4" :data-invalid="Boolean(issueFor('channel'))">
            <FieldTitle class="pt-2">
              {{ $t('iotApp.alarmContentTpl.channelLabel') }}
              <span class="text-destructive">*</span>
            </FieldTitle>
            <FieldContent class="max-w-md">
              <AlarmSelect
                v-model="form.channel"
                data-testid="notify-template-channel"
                :class="issueFor('channel') ? 'border-destructive' : ''"
                :options="channelOptions"
                :placeholder="$t('iotApp.alarmContentTpl.channelRequired')"
              />
              <FieldError v-if="issueFor('channel')">{{ issueFor('channel') }}</FieldError>
              <FieldDescription v-else>{{ $t('iotApp.alarmContentTpl.channelHint') }}</FieldDescription>
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
          <div class="text-sm font-medium">{{ $t('iotApp.alarmContentTpl.bodyTitle') }}</div>
          <div class="text-muted-foreground mt-1 text-xs leading-5">{{ $t('iotApp.alarmContentTpl.bodyDesc') }}</div>
        </div>

        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div class="flex min-w-0 flex-col gap-6">
            <Field>
              <FieldLabel for="notify-template-title">{{ $t('iotApp.alarmContentTpl.subjectLabel') }}</FieldLabel>
              <Input
                id="notify-template-title"
                data-testid="notify-template-subject"
                v-model="form.triggerTitle"
                maxlength="200"
                :placeholder="$t('iotApp.alarmContentTpl.subjectPh')"
                @focus="onInputFocus"
              />
              <FieldDescription>{{ $t('iotApp.alarmContentTpl.subjectHint') }}</FieldDescription>
            </Field>

            <Field :data-invalid="Boolean(issueFor('triggerBody'))">
              <FieldLabel for="notify-template-trigger-body">
                {{ $t('iotApp.alarmContentTpl.triggerBodyLabel') }}
                <span class="text-destructive">*</span>
              </FieldLabel>
              <Textarea
                id="notify-template-trigger-body"
                data-testid="notify-template-trigger-body"
                v-model="form.triggerBody"
                rows="7"
                :placeholder="$t('iotApp.alarmContentTpl.triggerBodyPh')"
                class="font-mono"
                :aria-invalid="Boolean(issueFor('triggerBody'))"
                @focus="onInputFocus"
              />
              <FieldError v-if="issueFor('triggerBody')">{{ issueFor('triggerBody') }}</FieldError>
            </Field>

            <Field class="border-border border-t pt-5" :data-invalid="Boolean(issueFor('recoveryBody'))">
              <FieldLabel for="notify-template-recovery-body">
                {{ $t('iotApp.alarmContentTpl.recoveryBodyLabel') }}
                <span class="text-destructive">*</span>
              </FieldLabel>
              <Textarea
                id="notify-template-recovery-body"
                data-testid="notify-template-recovery-body"
                v-model="form.recoveryBody"
                rows="7"
                :placeholder="$t('iotApp.alarmContentTpl.recoveryBodyPh')"
                class="font-mono"
                :aria-invalid="Boolean(issueFor('recoveryBody'))"
                @focus="onInputFocus"
              />
              <FieldError v-if="issueFor('recoveryBody')">{{ issueFor('recoveryBody') }}</FieldError>
            </Field>

            <section class="border-border flex flex-col gap-3 border-t pt-5">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-sm font-medium">{{ $t('iotApp.alarmContentTpl.headersCount') }}</div>
                  <div class="text-muted-foreground mt-1 text-xs">{{ $t('iotApp.alarmContentTpl.headersHint') }}</div>
                </div>
                <Button variant="outline" size="sm" @click="addHeader">{{ $t('iotApp.alarmContentTpl.addHeader') }}</Button>
              </div>
              <div v-if="headerRows.length > 0" class="flex flex-col gap-2">
                <div v-for="row in headerRows" :key="row.id" class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2">
                  <Input v-model="row.key" placeholder="Header 名称" :class="issueFor('headers') ? 'border-destructive' : ''" />
                  <Input v-model="row.value" placeholder="Header 值" />
                  <Button variant="ghost" size="sm" class="text-destructive" @click="removeHeader(row.id)">删除</Button>
                </div>
              </div>
              <div v-else class="text-muted-foreground text-xs">{{ $t('iotApp.alarmContentTpl.noHeaders') }}</div>
              <div v-if="issueFor('headers')" class="text-destructive text-xs">{{ issueFor('headers') }}</div>
            </section>
          </div>

          <aside class="border-border lg:border-l lg:pl-5">
            <div class="text-sm font-medium">{{ $t('iotApp.alarmContentTpl.variablesTitle') }}</div>
            <div class="text-muted-foreground mt-1 text-xs leading-5">{{ $t('iotApp.alarmContentTpl.variablesHint') }}</div>
            <div class="mt-3 flex flex-col gap-2">
              <Button
                v-for="variable in variables"
                :key="variable.key"
                variant="outline"
                class="border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 h-auto w-full justify-start px-2 py-1.5 text-left text-xs"
                @click="insertVariable(variable.key)"
              >
                <span class="block">
                  <span class="block font-mono">{{ variable.key }}</span>
                  <span class="text-muted-foreground mt-0.5 block">{{ $t(variable.desc) }}</span>
                </span>
              </Button>
            </div>
          </aside>
        </div>
      </div>

      <div v-else class="flex flex-col gap-5 text-sm">
        <StepOverview
          :title="$t('iotApp.alarmContentTpl.confirmStepTitle')"
          :description="$t('iotApp.alarmContentTpl.confirmStepDesc')"
          :summary-label="$t('iotApp.alarmContentTpl.confirmLabel')"
          :summary="confirmSummary"
        />
        <div class="grid gap-4 md:grid-cols-2">
          <div><span class="text-muted-foreground">{{ $t('iotApp.alarmCommon.templateName') }}：</span>{{ form.name || $t('iotApp.alarmCondTpl.unfilled') }}</div>
          <div>
            <span class="text-muted-foreground">{{ $t('iotApp.alarmContentTpl.channelLabel') }}：</span>{{ channels.find((item) => item.code === form.channel)?.name || form.channel || $t('iotApp.alarmCondTpl.unselected') }}
          </div>
          <div><span class="text-muted-foreground">{{ $t('iotApp.alarmCommon.enableStatus') }}：</span>{{ form.status === 1 ? $t('iotApp.common.enable') : $t('iotApp.common.disable') }}</div>
          <div><span class="text-muted-foreground">{{ $t('iotApp.alarmContentTpl.headersCount') }}：</span>{{ headerRows.filter((item) => item.key.trim()).length }}</div>
          <div><span class="text-muted-foreground">{{ $t('iotApp.alarmContentTpl.triggerBodyLabel') }}：</span>{{ form.triggerBody?.trim() ? $t('iotApp.alarmContentTpl.filled') : $t('iotApp.alarmCondTpl.unfilled') }}</div>
          <div><span class="text-muted-foreground">{{ $t('iotApp.alarmContentTpl.recoveryBodyLabel') }}：</span>{{ form.recoveryBody?.trim() ? $t('iotApp.alarmContentTpl.filled') : $t('iotApp.alarmCondTpl.unfilled') }}</div>
        </div>
        <div class="border-border flex flex-wrap items-center gap-3 border-t pt-4">
          <span class="text-muted-foreground text-xs">测试发送使用后端的 trigger / recovery 契约，仅对已保存模板开放。</span>
          <Button variant="outline" size="sm" :disabled="!isEdit || !!testingTiming" @click="testSend('trigger')">
            {{ testingTiming === 'trigger' ? '发送中...' : '测试告警通知' }}
          </Button>
          <Button variant="outline" size="sm" :disabled="!isEdit || !!testingTiming" @click="testSend('recovery')">
            {{ testingTiming === 'recovery' ? '发送中...' : '测试恢复通知' }}
          </Button>
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
