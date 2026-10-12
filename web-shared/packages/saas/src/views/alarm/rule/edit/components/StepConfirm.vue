<script setup lang="ts">
/**
 * 文件说明：告警规则编辑页 Step 4 —— 确认保存
 * 以只读形式汇总展示基本信息、触发条件、通知配置，供用户最终确认。
 * 本组件只读取真实接口与后端当前支持的通知渠道，不使用演示数据回退。
 */
import type { AlarmRule, Criterion, LeafCondition, NotifyContentTemplate, NotifyLadder, NotifyTargetCandidate } from '../../../types/alarm-v2.types';
import type { AlarmRuleIssue } from '../../../composables/useAlarmRuleValidation';
import { levelLabel } from '../../../types/alarm-v2.types';
import { AlarmLevelList, CmpTypeList, selectTypeText, SelectTypeList } from '../../../types/alarm-v2.types';

import { computed, onMounted, ref } from 'vue';

import { $t } from '@vben/locales';

import { CoreApi } from '@vben/api';

import { getNotifyTemplateList } from '../../../api/alarm-notify-template.api';
import { fromNotifyTemplate } from '../../../composables/useAlarmConvert';
import { useAlarmNotifyChannel } from '../../../composables/useAlarmNotifyChannel';
import { useAlarmSchema } from '../../../composables/useAlarmSchema';
import StepOverview from './StepOverview.vue';

const props = defineProps<{
  form: AlarmRule;
  /** 创建前检查发现的全部阻断性问题。 */
  issues?: AlarmRuleIssue[];
}>();

/** 物模型字段：根据告警目标从后端加载，空数据保持为空。 */
const { schema, loadSchema } = useAlarmSchema();

/** 通知渠道：使用统一 composable 对齐后端调度器实际能力。 */
const { channels: realChannels, loadChannels } = useAlarmNotifyChannel();

/** 通知内容模板：从后端通知模板接口加载 */
const templates = ref<NotifyContentTemplate[]>([]);

/** 通知目标候选：从后端用户接口加载 */
const targets = ref<NotifyTargetCandidate[]>([]);

/** 合并后的全部物模型字段，供叶子条件渲染使用 */
const allFields = computed(() => {
  const s = schema.value;
  return [...s.metricFields, ...s.eventFields, ...s.actionFields, ...s.onlineFields];
});

/** 后端通知调度器当前支持的真实渠道。 */
const channels = computed(() => realChannels.value);

onMounted(async () => {
  // 并行加载四类真实数据，互不依赖
  await Promise.allSettled([loadSchema(props.form.target), loadChannels(), loadTemplates(), loadTargets()]);
});

/** 加载真实通知内容模板；失败或为空时保持空列表。 */
async function loadTemplates() {
  try {
    const res = await getNotifyTemplateList({ page: { page: 1, size: 100 } });
    const list = (res.list || []).map(fromNotifyTemplate);
    templates.value = list;
  } catch (error: any) {
    console.error('加载通知内容模板失败：', error?.message ?? error);
    templates.value = [];
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

/** 加载真实通知目标用户；失败或为空时保持空列表。 */
async function loadTargets() {
  try {
    const resp = await CoreApi.postApiV1SystemTenantUserGetList({
      page: { page: 1, size: 500 },
      status: 1,
    });
    targets.value = (resp?.list ?? []).map(mapUserToCandidate).filter((item): item is NotifyTargetCandidate => Boolean(item));
  } catch (error: any) {
    console.error('加载通知目标用户失败：', error?.message ?? error);
    targets.value = [];
  }
}

function selectTypeLabel(type: string) {
  return selectTypeText(type);
}

function targetSummary(ladder: NotifyLadder): string {
  const names: string[] = [];
  ladder.targets.userIDs?.forEach((id) => {
    const t = targets.value.find((x) => x.id === `user:${id}`);
    if (t) names.push(t.name);
  });
  ladder.targets.groupIDs?.forEach((id) => {
    const t = targets.value.find((x) => x.id === `group:${id}`);
    if (t) names.push(t.name);
  });
  ladder.targets.roleIDs?.forEach((id) => {
    const t = targets.value.find((x) => x.id === `role:${id}`);
    if (t) names.push(t.name);
  });
  return names.length ? names.join('、') : '未选择';
}

function channelSummary(ladder: NotifyLadder): string {
  if (!ladder.channels.length) return '未选择';
  return ladder.channels
    .map((code) => {
      const chName = channels.value.find((c) => c.code === code)?.name ?? code;
      const tmplID = ladder.channelTemplates[code];
      const tmplName = tmplID ? (templates.value.find((t) => t.id === tmplID)?.name ?? '未选择模板') : '未选择模板';
      return `${chName} / ${tmplName}`;
    })
    .join('；');
}

function renderCriterion(criterion: Criterion): string {
  if (criterion.type === 'plain' && criterion.plain) {
    const logic = criterion.plain.logic ?? 'and';
    const parts = criterion.plain.leaves.map((leaf) => renderLeaf(leaf));
    return parts.length ? parts.join(` ${logic.toUpperCase()} `) : '空条件';
  }
  if (criterion.type === 'duration' && criterion.duration) {
    return `持续 ${criterion.duration.windowSeconds / 60} 分钟：${renderCriterion(criterion.duration.child)}`;
  }
  if (criterion.type === 'kOfN' && criterion.kOfN) {
    return `${criterion.kOfN.threshold}/${criterion.kOfN.children.length} 条件满足`;
  }
  if (criterion.type === 'rollingAggregate' && criterion.rollingAggregate) {
    const cmp = CmpTypeList.find((c) => c.value === criterion.rollingAggregate?.cmp)?.label ?? '';
    return `${criterion.rollingAggregate.aggregate}(${criterion.rollingAggregate.windowSeconds / 60}min) ${cmp} ${criterion.rollingAggregate.threshold}`;
  }
  if (criterion.type === 'frequency' && criterion.frequency) {
    return `${criterion.frequency.windowSeconds / 60} 分钟内满足 ${criterion.frequency.times} 次`;
  }
  return '未知判据';
}

function renderLeaf(leaf: LeafCondition): string {
  const field = allFields.value.find((f) => f.dataID === leaf.dataID);
  const cmp = CmpTypeList.find((c) => c.value === leaf.compare.termType)?.label ?? leaf.compare.termType;
  return `${field?.name ?? leaf.dataID ?? '未知'} ${cmp} ${leaf.compare.values.join(',')}${field?.unit ?? ''}`;
}

/** 各配置阶段的检查结果，供用户在提交前快速定位遗漏。 */
const checks = computed(() => [
  { step: 1, label: '监控范围完整', issues: props.issues?.filter((issue) => issue.step === 1) ?? [] },
  { step: 2, label: '触发条件可执行', issues: props.issues?.filter((issue) => issue.step === 2) ?? [] },
  { step: 3, label: '通知方案可执行', issues: props.issues?.filter((issue) => issue.step === 3) ?? [] },
]);

/** 整条规则的自然语言说明，帮助用户确认配置结果而非复核字段编码。 */
const ruleStatement = computed(() => {
  const source = props.form.target.productName || props.form.target.categoryName || '未选择来源';
  const target = props.form.target.selectType === 'all' ? `${source}下的全部设备` : selectTypeLabel(props.form.target.selectType);
  const conditions = props.form.if.triggers.flatMap((trigger) => trigger.criteria.map((criterion) => renderCriterion(criterion)));
  return `系统每 ${props.form.evalPeriod} 分钟检查${target}；当${conditions.join('；') || '未配置条件'}时产生告警。`;
});
</script>

<template>
  <div class="flex flex-col gap-5 text-sm">
    <StepOverview
      title="检查并创建规则"
      description="核对监控范围、触发条件和通知方案，确认无误后创建规则。"
      summary-label="规则运行方式"
      :summary="ruleStatement"
    />

    <div class="rounded-lg border p-4">
      <div class="font-medium">创建前检查</div>
      <div class="mt-3 grid gap-2 md:grid-cols-3">
        <div
          v-for="check in checks"
          :key="check.step"
          class="rounded-lg border px-3 py-2"
          :class="check.issues.length ? 'border-destructive/40 bg-destructive/5' : 'border-primary/30 bg-primary/5'"
        >
          <div :class="check.issues.length ? 'text-destructive' : 'text-primary'">{{ check.issues.length ? '!' : '✓' }} {{ check.label }}</div>
          <div v-if="check.issues.length" class="text-destructive mt-1 text-xs">
            {{ check.issues[0]?.message }}
          </div>
          <div v-else class="text-muted-foreground mt-1 text-xs">已通过检查</div>
        </div>
      </div>
    </div>

    <div>
      <div class="mb-2 font-medium">基本信息</div>
      <div class="text-muted-foreground grid grid-cols-2 gap-2 md:grid-cols-3">
        <div>{{ $t('iotApp.alarmCommon.ruleName') }}：{{ form.name || '-' }}</div>
        <div>{{ $t('iotApp.alarmRule.evalPeriod') }}：{{ form.evalPeriod }} {{ $t('iotApp.alarmRule.minutes') }}</div>
        <div>{{ $t('iotApp.common.status') }}：{{ form.status === 1 ? $t('iotApp.common.enable') : $t('iotApp.common.disable') }}</div>
      </div>
      <div class="text-muted-foreground mt-1">
        {{ $t('iotApp.alarmRule.objectLabel') }}：{{ selectTypeLabel(form.target.selectType) }}
        <span v-if="form.target.selectType === 'fixed'"> （{{ form.target.devices?.length ?? 0 }} 个设备） </span>
        <span v-else-if="form.target.selectType === 'area' || form.target.selectType === 'areaWithChildren'">
          （{{ form.target.areas?.length ?? 0 }} 个区域）
        </span>
        <span v-else-if="form.target.selectType === 'group'"> （{{ form.target.groups?.length ?? 0 }} 个分组） </span>
      </div>
      <div v-if="form.desc" class="text-muted-foreground mt-1">{{ $t('iotApp.alarmCommon.desc') }}：{{ form.desc }}</div>
    </div>

    <div>
      <div class="mb-2 font-medium">触发条件</div>
      <div v-for="trigger in form.if.triggers" :key="trigger.id" class="text-muted-foreground mb-2">
        <div class="text-foreground font-medium">
          {{ levelLabel(trigger.level) }} — {{ trigger.type === 'and' ? '满足所有' : '满足任一' }}
          <span v-if="trigger.templateName" class="bg-primary/10 text-primary ml-2 rounded-md px-2 py-0.5 text-xs">
            从条件预设导入：{{ trigger.templateName }}
          </span>
        </div>
        <ul class="ml-4 list-disc">
          <li v-for="criterion in trigger.criteria" :key="criterion.id">{{ renderCriterion(criterion) }}</li>
        </ul>
      </div>
      <div v-if="!form.if.triggers.length" class="text-muted-foreground">未配置触发条件</div>
    </div>

    <div>
      <div class="mb-2 font-medium">通知配置</div>
      <div v-for="ladder in form.notify.ladders" :key="ladder.id" class="text-muted-foreground mb-2">
        <div class="text-foreground font-medium">
          阶梯 {{ ladder.order }} — {{ ladder.timing === 'trigger' ? '触发时' : ladder.timing === 'recovery' ? '恢复时' : '触发和恢复' }}
        </div>
        <div>级别：{{ ladder.levels.map(levelLabel).join('、') }}</div>
        <div>渠道：{{ channelSummary(ladder) }}</div>
        <div>延迟：{{ ladder.delaySeconds }} 秒</div>
        <div>目标：{{ targetSummary(ladder) }}</div>
        <div v-if="ladder.callbacks?.length">回调：{{ ladder.callbacks.length }} 个</div>
      </div>
      <div v-if="!form.notify.ladders.length" class="text-muted-foreground">未配置通知阶梯</div>
    </div>
  </div>
</template>
