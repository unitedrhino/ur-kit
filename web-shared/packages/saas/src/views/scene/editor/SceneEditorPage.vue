<script setup lang="ts">
import { notifyRequestError } from '@vben/saas/request-error';

import { $t } from '@vben/locales';
import { preferences } from '@vben/preferences';
/**
 * 场景编辑器 V2 —— 三栏卡片式重构版
 *
 * 布局：
 *   顶栏：未命名场景 + 自动生成名称预览 + 保存草稿 / 保存并启用
 *   左栏：步骤导航（触发器 / 附加条件 / 生效时段 / 执行动作）
 *   中栏：自上而下堆叠的卡片 Section（01 ~ 04）
 *   右栏：固定摘要面板（人话规则 + 校验问题）
 *
 * 设计要点：
 *   - 不强制先填名称。保存时若名称为空则落地为 autoName。
 *   - 每个 Section 内部已是独立卡片堆叠（支持复制 / 删除 / 上下移）。
 *   - 实时校验：顶部错误数、左栏红点、右栏详细清单。
 */
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';
import { useMessage } from 'naive-ui';
import {
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Textarea,
} from '@vben-core/shadcn-ui';

import type { SceneType } from '../scene-types';
import { Api } from '../index.api';
import { sceneText } from '../locales';

import { useSceneDraft } from './composables/useSceneDraft';
import {
  deserializeScene,
  serializeDraft,
} from './composables/useSceneSerialization';
import { hasErrors, validateDraft } from './composables/useSceneValidation';
import {
  actionSummary,
  triggerSummary,
} from './composables/useSceneSummary';

import TriggerSection from './trigger/TriggerSection.vue';
import ConditionSection from './condition/ConditionSection.vue';
import ActionSection from './action/ActionSection.vue';
import RangeSection from './condition/RangeSection.vue';
import SceneSummaryPanel from './SceneSummaryPanel.vue';
import {
  sceneAiOpen,
  openSceneAi,
  closeSceneAi,
  resetSceneAi,
} from './ai/sceneAiHost';

const props = withDefaults(
  defineProps<{
    sceneType?: SceneType;
    listRoute?: string;
    createTitle?: string;
    editTitle?: string;
    projectId?: string;
  }>(),
  {
    sceneType: 'auto',
    listRoute: '/iot/scene',
    createTitle: 'orgIotClient.energyDashboard.addScene',
    editTitle: 'orgIotClient.energyDashboard.editScene',
    projectId: '',
  },
);

const router = useRouter();
const { closeCurrentTab, setTabTitle } = useTabs();
const message = useMessage();

const ctx = useSceneDraft(undefined, props.sceneType);
const submitting = ref(false);
const savingDraft = ref(false);
const loading = ref(false);
const isEditing = ref(false);
watch(() => preferences.app.locale, () => {
  if (isEditing.value) setTabTitle(sceneText(props.editTitle));
});
const projectID = computed(() => String(props.projectId ?? '').trim());

const issues = computed(() => validateDraft(ctx.draft));
const hasAnyError = computed(() => hasErrors(issues.value));
const errorCount = computed(
  () => issues.value.filter((i) => i.level === 'error').length,
);
const warnCount = computed(
  () => issues.value.filter((i) => i.level === 'warn').length,
);

const isAuto = computed(() => ctx.draft.type === 'auto');

/** 描述折叠开关 */
const descOpen = ref(false);

/** 保存下拉菜单开关 */
const saveMenuOpen = ref(false);

/** AI 助手抽屉开关（读自全局单例，挂载点在 `layouts/basic.vue`） */
const aiOpen = sceneAiOpen;

function toggleAi() {
  if (aiOpen.value) {
    closeSceneAi();
  } else {
    openSceneAi(ctx, props.sceneType, onAiApplied);
  }
}

/**
 * 名称是否被用户手动修改过。
 * - false：名称随表单内容实时自动跟随 autoName
 * - true ：用户自己写过 / 加载了已有名称，不再自动覆盖
 */
const nameTouched = ref(false);

/** 基于 draft 生成一句"人话"作为自动名称（只有已填好的部分才会拼出来） */
const autoName = computed(() => {
  void preferences.app.locale;
  const d = ctx.draft;
  const strip = (s: string) => s.replace(/^[^·]*·\s*/, '');
  // 占位文案表示该项尚未填好，不应进入自动名称。
  const placeholders = [
    'scene.ui.noDeviceSelected',
    'scene.ui.unselectedScene',
    'scene.ui.triggerNotConfigured',
    'scene.ui.noActionConfigured',
    'scene.ui.noConditionsConfigured',
    'scene.ui.noScopeConfigured',
  ].map((key) => $t(key));
  const clean = (s?: string) => {
    if (!s) return '';
    const t = strip(s).trim();
    return t && !/[?]|--:--/.test(t) && !placeholders.some((placeholder) => t.includes(placeholder)) ? t : '';
  };

  if (d.type === 'manual') {
    const actTxt = d.actions.length > 0 ? clean(actionSummary(d.actions[0]!)) : '';
    return actTxt ? $t('scene.ui.manualAction', { action: actTxt }) : '';
  }

  const trigTxt = d.triggers.length > 0 ? clean(triggerSummary(d.triggers[0]!)) : '';
  const actTxt = d.actions.length > 0 ? clean(actionSummary(d.actions[0]!)) : '';
  if (trigTxt && actTxt) return $t('scene.ui.whenTriggerAction', { trigger: trigTxt, action: actTxt });
  if (trigTxt) return $t('scene.ui.whenTrigger', { trigger: trigTxt });
  if (actTxt) return actTxt;
  return '';
});

/** 按 section 统计错误数（给左侧导航红点用） */
interface SectionErrors {
  trigger: number;
  condition: number;
  range: number;
  action: number;
}
const sectionErrors = computed<SectionErrors>(() => {
  const map: SectionErrors = {
    trigger: 0,
    condition: 0,
    range: 0,
    action: 0,
  };
  issues.value.forEach((i) => {
    if (i.level !== 'error') return;
    const key = i.section as keyof SectionErrors;
    if (key in map) map[key] += 1;
  });
  return map;
});

/** 左侧导航 */
const navSteps = computed(() => {
  void preferences.app.locale;
  return [
  {
    key: 'trigger' as const,
    anchor: 'sec-trigger',
    index: '01',
    title: $t('scene.ui.trigger'),
    subtitle: $t('scene.ui.whenDoesItStart'),
    hint: $t('scene.ui.fixAny'),
    icon: 'mdi--lightning-bolt',
    count: ctx.draft.triggers.length,
    errors: sectionErrors.value.trigger,
    show: isAuto.value,
  },
  {
    key: 'condition' as const,
    anchor: 'sec-condition',
    index: '02',
    title: $t('scene.ui.additionalConditions'),
    subtitle: $t('scene.ui.stillNeedToSatisfy'),
    hint: ctx.draft.conditionLogic === 'or' ? $t('scene.ui.satisfyAny') : $t('scene.ui.satisfyAll'),
    icon: 'mdi--filter-outline',
    count: ctx.draft.conditions.length,
    errors: sectionErrors.value.condition,
    show: isAuto.value,
  },
  {
    key: 'range' as const,
    anchor: 'sec-range',
    index: '03',
    title: $t('scene.ui.effectivePeriod'),
    subtitle: $t('scene.ui.onlyValidDuringTheseTimes'),
    hint: $t('scene.ui.validInvalid'),
    icon: 'mdi--calendar-clock',
    count: ctx.draft.validRanges.length + ctx.draft.invalidRanges.length,
    errors: sectionErrors.value.range,
    show: isAuto.value,
  },
  {
    key: 'action' as const,
    anchor: 'sec-action',
    index: isAuto.value ? '04' : '01',
    title: $t('scene.ui.executeAction'),
    subtitle: $t('scene.ui.whatToExecute'),
    hint: $t('scene.ui.executeInSequence'),
    icon: 'mdi--play-circle-outline',
    count: ctx.draft.actions.length,
    errors: sectionErrors.value.action,
    show: true,
  },
  ];
});

const activeAnchor = ref('sec-trigger');

function scrollTo(anchor: string) {
  activeAnchor.value = anchor;
  nextTick(() => {
    const el = document.getElementById(anchor);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

function onNameInput(v: any) {
  const next = String(v ?? '');
  ctx.draft.name = next;
  // 用户清空后自动恢复 autoName 跟随；否则标记为已手改
  nameTouched.value = next.trim().length > 0;
  ctx.markDirty();
}

function onDescInput(v: any) {
  ctx.draft.desc = String(v ?? '');
  ctx.markDirty();
}

function applyAutoName() {
  ctx.draft.name = autoName.value;
  // 重置为未触碰状态，后续修改表单会继续实时跟随
  nameTouched.value = false;
  ctx.markDirty();
}

// AI 应用 patch 后若已有名称，视为已确认（不再被 autoName 实时覆盖，也不再显示"使用推荐"）
function onAiApplied() {
  closeSceneAi();
  if ((ctx.draft.name || '').trim()) {
    nameTouched.value = true;
  }
}

onBeforeUnmount(() => {
  resetSceneAi();
});

// 表单内容变化时，若用户未手改过名称，实时跟随 autoName
watch(autoName, (v) => {
  if (!nameTouched.value) {
    ctx.draft.name = v;
  }
});

async function handleSave(activate: boolean) {
  if (hasAnyError.value) {
    message.error($t('scene.ui.thereAreCountRequiredQuestionsThatAreNotCompleted', { count: errorCount.value }));
    const firstBad = navSteps.value.find((s) => s.show && s.errors > 0);
    if (firstBad) scrollTo(firstBad.anchor);
    return;
  }
  // 若用户没填名称，落地为 autoName
  if (!(ctx.draft.name || '').trim()) {
    if (!autoName.value) {
      message.error($t('scene.ui.pleaseFillInTheSceneName'));
      return;
    }
    ctx.draft.name = autoName.value;
  }
  // 状态：1 启用 / 2 禁用
  ctx.draft.status = activate ? 1 : 2;

  if (activate) submitting.value = true;
  else savingDraft.value = true;
  try {
    const payload = serializeDraft(ctx.draft);
    const api = ctx.draft.id ? Api.update : Api.create;
    const res: any = await api(payload as any, projectID.value);
    if (res?.code === 200 || res?.code === 0 || res?.id) {
      const isEdit = !!ctx.draft.id;
      message.success(
        activate
          ? isEdit
            ? $t('scene.ui.updatedAndEnabledSuccessfully')
            : $t('scene.ui.addedAndActivatedSuccessfully')
          : $t('scene.ui.savedAsDraft'),
      );
      router.push(props.listRoute);
      closeCurrentTab();
    } else {
      message.error(res?.msg || $t('iotApp.common.saveFailed'));
    }
  } catch (e: any) {
    notifyRequestError(e, () => e?.message || $t('iotApp.common.saveFailed'), (text) => message.error(text));
  } finally {
    submitting.value = false;
    savingDraft.value = false;
  }
}

function handleCancel() {
  router.push(props.listRoute);
  closeCurrentTab();
}

onMounted(async () => {
  const id = router.currentRoute.value.query.id;
  if (!id) return;
  isEditing.value = true;
  setTabTitle(sceneText(props.editTitle));
  loading.value = true;
  try {
    const sceneInfo: any = await Api.read(String(id), projectID.value);
    if (sceneInfo) {
      const draft = deserializeScene(sceneInfo);
      if (!draft.id) draft.id = Number(id);
      ctx.reset(draft);
      if (draft.desc) descOpen.value = true;
      // 加载已有场景：若名称非空，视为用户自定义，不再自动覆盖
      nameTouched.value = (draft.name || '').trim().length > 0;
    }
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <Page  content-class="!p-0">
    <div
      class="scene-editor-v2 bg-muted/20 flex min-h-[calc(100vh-56px)] flex-col"
      :class="{ 'pointer-events-none opacity-60': loading }"
    >
      <!-- ===== 顶栏：名称 + 自动生成提示 + 保存按钮 ===== -->
      <header
        class="border-border bg-background sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b px-6 py-3"
      >
        <div class="flex min-w-0 flex-1 items-center gap-3">
          <span
            class="bg-primary/10 text-primary inline-flex size-8 shrink-0 items-center justify-center rounded-md"
          >
            <span class="icon-[mdi--lightbulb-auto-outline] size-4.5"></span>
          </span>
          <div class="min-w-0 flex-1">
            <Input
              :model-value="ctx.draft.name"
              :placeholder="$t('scene.ui.unnamedAutomationScenarioLeaveBlankToAutomaticallyGe')"
              class="h-8 !border-transparent bg-transparent px-0 !text-base font-semibold shadow-none focus-visible:!ring-0"
              @update:model-value="onNameInput"
            />
            <div class="text-muted-foreground mt-0.5 truncate text-[11px]">
              <template v-if="nameTouched">
                <span class="text-muted-foreground/80">{{ $t('scene.ui.customized') }}</span>
                <template v-if="autoName">
                  <span class="text-muted-foreground/80"> {{ $t('scene.ui.recommended') }}</span>
                  <span class="text-foreground/70">{{ autoName }}</span>
                </template>
              </template>
              <template v-else-if="autoName">
                <span class="text-muted-foreground/80">{{ $t('scene.ui.automaticallyGeneratedFormChangesAreUpdatedInRealTim') }}</span>
                <span class="text-foreground/70">{{ autoName }}</span>
              </template>
              <template v-else>
                <span class="text-muted-foreground/60">{{ $t('scene.ui.afterFillingInTheTriggerAndActionTheNameWillBeAutoma') }}</span>
              </template>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            v-if="autoName"
            type="button"
            class="text-primary border-primary/30 hover:bg-primary/10 inline-flex h-8 shrink-0 items-center gap-1 rounded-md border px-2.5 text-xs"
            :title="$t('scene.ui.useRecommendedNameName', { name: autoName })"
            @click="applyAutoName"
          >
            <span class="icon-[mdi--auto-fix] size-3.5"></span>
            {{ nameTouched ? $t('scene.ui.resetToRecommended') : $t('scene.ui.useRecommendations') }}
          </button>
          <button
            type="button"
            class="inline-flex h-8 shrink-0 items-center gap-1 rounded-md border px-2.5 text-xs transition"
            :class="
              aiOpen
                ? 'bg-primary text-primary-foreground border-primary'
                : 'text-primary border-primary/30 hover:bg-primary/10'
            "
            :title="$t('scene.ui.aiAssistantGenerateScenesUsingNaturalLanguage')"
            @click="toggleAi"
          >
            <span class="icon-[mdi--robot-outline] size-3.5"></span>
            {{ $t('scene.ui.aiAssistant') }}
          </button>
          <button
            v-if="!descOpen"
            type="button"
            class="border-border hover:bg-accent inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs"
            @click="descOpen = true"
          >
            <span class="icon-[mdi--text-box-plus-outline] size-3.5"></span>
            {{ $t('scene.ui.addDescription') }}
          </button>

          <span v-if="errorCount > 0" class="text-destructive text-xs">
            <span class="icon-[mdi--alert-circle] size-3.5 align-text-bottom"></span>
            {{ $t('scene.ui.countItemsToBeCorrected', { count: errorCount }) }}
          </span>
          <span
            v-else-if="warnCount > 0"
            class="text-xs text-amber-600"
          >
            <span class="icon-[mdi--alert-outline] size-3.5 align-text-bottom"></span>
            {{ $t('scene.ui.countTips', { count: warnCount }) }}
          </span>

          <button
            type="button"
            class="border-border hover:bg-accent h-8 rounded-md border px-3 text-xs"
            @click="handleCancel"
          >
            {{ $t('iotApp.ota.cancel') }}
          </button>

          <!-- 保存按钮（split button：主按钮 = 保存并启用；下拉 = 仅保存） -->
          <div
            class="inline-flex h-8 items-stretch overflow-hidden rounded-md shadow-sm"
          >
            <button
              type="button"
              class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1 px-4 text-xs disabled:opacity-50"
              :disabled="submitting || savingDraft"
              @click="handleSave(true)"
            >
              <span class="icon-[mdi--check] size-3.5"></span>
              {{ submitting ? $t('iotApp.av.saving') : $t('scene.ui.saveAndEnable') }}
            </button>
            <Popover v-model:open="saveMenuOpen">
              <PopoverTrigger as-child>
                <button
                  type="button"
                  class="bg-primary text-primary-foreground hover:bg-primary/90 border-primary-foreground/20 flex items-center border-l px-1.5 disabled:opacity-50"
                  :disabled="submitting || savingDraft"
                  :aria-label="$t('scene.ui.moreSavingOptions')"
                >
                  <span class="icon-[mdi--chevron-down] size-3.5"></span>
                </button>
              </PopoverTrigger>
              <PopoverContent class="z-[60] w-44 p-1" align="end">
                <button
                  type="button"
                  class="hover:bg-accent flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs"
                  :disabled="savingDraft || submitting"
                  @click="
                    () => {
                      saveMenuOpen = false;
                      handleSave(false);
                    }
                  "
                >
                  <span class="icon-[mdi--content-save-outline] size-3.5"></span>
                  {{ savingDraft ? $t('iotApp.av.saving') : $t('scene.ui.saveOnlyNotEnabled') }}
                </button>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <!-- 描述折叠区 -->
        <div v-if="descOpen" class="basis-full">
          <div class="flex items-start gap-2 pt-2">
            <Textarea
              :model-value="ctx.draft.desc"
              :placeholder="$t('scene.ui.descriptionOptionalDescribeThePurposeOrPrecautionsOf')"
              rows="2"
              class="text-xs"
              @update:model-value="onDescInput"
            />
            <button
              type="button"
              class="text-muted-foreground hover:text-foreground mt-1 shrink-0 text-xs"
              @click="
                () => {
                  descOpen = false;
                  ctx.draft.desc = '';
                  ctx.markDirty();
                }
              "
            >
              <span class="icon-[mdi--close] size-4"></span>
            </button>
          </div>
        </div>
      </header>

      <!-- ===== 三栏主体 ===== -->
      <div class="flex flex-1 items-stretch">
        <!-- 左栏：步骤导航 -->
        <nav
          class="border-border bg-background hidden w-56 shrink-0 border-r p-3 md:block"
        >
          <div class="text-muted-foreground px-2 pb-2 text-[11px] uppercase tracking-wider">
            {{ $t('iotApp.alarmCommon.editStep') }}
          </div>
          <ul class="space-y-1">
            <li v-for="s in navSteps" v-show="s.show" :key="s.key">
              <button
                type="button"
                class="group relative flex w-full items-start gap-2.5 rounded-md border border-transparent px-2.5 py-2 text-left transition-colors"
                :class="[
                  activeAnchor === s.anchor
                    ? 'border-primary/30 bg-primary/5'
                    : 'hover:bg-accent',
                ]"
                @click="scrollTo(s.anchor)"
              >
                <span
                  class="bg-muted text-muted-foreground inline-flex size-6 shrink-0 items-center justify-center rounded text-[10px] font-semibold"
                  :class="{
                    'bg-primary text-primary-foreground':
                      activeAnchor === s.anchor,
                  }"
                >
                  {{ s.index }}
                </span>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5">
                    <span class="text-sm font-medium">{{ s.title }}</span>
                    <span
                      v-if="s.errors > 0"
                      class="bg-destructive inline-flex size-1.5 rounded-full"
                    ></span>
                  </div>
                  <div class="text-muted-foreground mt-0.5 truncate text-[11px]">
                    {{ s.subtitle }}
                  </div>
                  <div class="mt-1 flex items-center gap-1.5 text-[10px]">
                    <span
                      class="bg-muted text-muted-foreground rounded px-1.5 py-0.5"
                    >
                      {{ s.hint }}
                    </span>
                    <span class="text-muted-foreground"
                      >· {{ $t('scene.ui.countAdded', { count: s.count }) }}</span
                    >
                  </div>
                </div>
              </button>
            </li>
          </ul>

          <div class="border-border mt-4 border-t pt-3">
            <div class="text-muted-foreground px-2 pb-2 text-[11px] uppercase tracking-wider">
              {{ $t('scene.ui.sceneType') }}
            </div>
            <div class="border-border mx-1 flex overflow-hidden rounded-md border text-xs">
              <button
                type="button"
                class="flex-1 py-1.5 transition-colors"
                :class="
                  ctx.draft.type === 'auto'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-accent'
                "
                @click="
                  () => {
                    ctx.draft.type = 'auto';
                    ctx.markDirty();
                  }
                "
              >
                {{ $t('orgIotClient.routes.automation') }}
              </button>
              <button
                type="button"
                class="flex-1 py-1.5 transition-colors"
                :class="
                  ctx.draft.type === 'manual'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-accent'
                "
                @click="
                  () => {
                    ctx.draft.type = 'manual';
                    ctx.markDirty();
                  }
                "
              >
                {{ $t('scene.ui.manualScene') }}
              </button>
            </div>
          </div>
        </nav>

        <!-- 中栏：主体内容（卡片堆叠） -->
        <main class="min-w-0 flex-1 space-y-5 px-4 py-5 md:px-6">
          <!-- 01 触发器 -->
          <div
            v-if="isAuto"
            id="sec-trigger"
            class="border-border bg-background scroll-mt-20 rounded-lg border p-4 shadow-sm"
          >
            <div class="mb-3 flex items-center gap-2">
              <span
                class="bg-primary/10 text-primary inline-flex size-6 items-center justify-center rounded text-xs font-bold"
                >01</span
              >
              <div class="min-w-0">
                <h2 class="text-sm font-semibold">{{ $t('scene.ui.whenDoesItStart') }}</h2>
                <p class="text-muted-foreground text-[11px]">
                  {{ $t('scene.ui.startWhenAnyTriggerIsMetThereIsAnOrRelationshipBetwe') }}
                </p>
              </div>
              <span
                v-if="sectionErrors.trigger > 0"
                class="bg-destructive/10 text-destructive ml-auto rounded px-1.5 py-0.5 text-[10px]"
              >
                {{ $t('scene.ui.countItemsToBeCorrected', { count: sectionErrors.trigger }) }}
              </span>
            </div>
            <TriggerSection :ctx="ctx" :issues="issues" />
          </div>

          <!-- 02 附加条件 -->
          <div
            v-if="isAuto"
            id="sec-condition"
            class="border-border bg-background scroll-mt-20 rounded-lg border p-4 shadow-sm"
          >
            <div class="mb-3 flex items-center gap-2">
              <span
                class="bg-primary/10 text-primary inline-flex size-6 items-center justify-center rounded text-xs font-bold"
                >02</span
              >
              <div class="min-w-0">
                <h2 class="text-sm font-semibold">{{ $t('scene.ui.stillNeedToSatisfy') }}</h2>
                <p class="text-muted-foreground text-[11px]">
                  {{ $t('scene.ui.optionalWhenNotConfiguredMeansAllTriggersWillContinu') }}
                </p>
              </div>
              <span
                v-if="sectionErrors.condition > 0"
                class="bg-destructive/10 text-destructive ml-auto rounded px-1.5 py-0.5 text-[10px]"
              >
                {{ $t('scene.ui.countItemsToBeCorrected', { count: sectionErrors.condition }) }}
              </span>
            </div>
            <ConditionSection :ctx="ctx" :issues="issues" :show-ranges="false" />
          </div>

          <!-- 03 生效/无效时段 -->
          <div
            v-if="isAuto"
            id="sec-range"
            class="border-border bg-background scroll-mt-20 rounded-lg border p-4 shadow-sm"
          >
            <div class="mb-3 flex items-center gap-2">
              <span
                class="bg-primary/10 text-primary inline-flex size-6 items-center justify-center rounded text-xs font-bold"
                >03</span
              >
              <div class="min-w-0">
                <h2 class="text-sm font-semibold">{{ $t('scene.ui.onlyValidDuringTheseTimes') }}</h2>
                <p class="text-muted-foreground text-[11px]">
                  {{ $t('scene.ui.leftEffectivePeriodWhitelistRightInvalidPeriodBlackl') }}
                </p>
              </div>
              <span
                v-if="sectionErrors.range > 0"
                class="bg-destructive/10 text-destructive ml-auto rounded px-1.5 py-0.5 text-[10px]"
              >
                {{ $t('scene.ui.countItemsToBeCorrected', { count: sectionErrors.range }) }}
              </span>
            </div>
            <RangeSection :ctx="ctx" :issues="issues" />
          </div>

          <!-- 04 执行动作 -->
          <div
            id="sec-action"
            class="border-border bg-background scroll-mt-20 rounded-lg border p-4 shadow-sm"
          >
            <div class="mb-3 flex items-center gap-2">
              <span
                class="bg-primary/10 text-primary inline-flex size-6 items-center justify-center rounded text-xs font-bold"
              >
                {{ isAuto ? '04' : '01' }}
              </span>
              <div class="min-w-0">
                <h2 class="text-sm font-semibold">{{ $t('scene.ui.whatToExecute') }}</h2>
                <p class="text-muted-foreground text-[11px]">
                  {{ $t('scene.ui.executeInSequenceSupportDeviceControlDelayAlarmAndEx') }}
                </p>
              </div>
              <span
                v-if="sectionErrors.action > 0"
                class="bg-destructive/10 text-destructive ml-auto rounded px-1.5 py-0.5 text-[10px]"
              >
                {{ $t('scene.ui.countItemsToBeCorrected', { count: sectionErrors.action }) }}
              </span>
            </div>
            <ActionSection :ctx="ctx" :issues="issues" />
          </div>

          <div class="h-10"></div>
        </main>

        <!-- 右栏：固定摘要 -->
        <aside class="hidden w-80 shrink-0 px-4 py-5 xl:block">
          <div class="sticky top-20">
            <SceneSummaryPanel :draft="ctx.draft" :issues="issues" />
          </div>
        </aside>
      </div>
    </div>

    <!-- AI 助手面板挂载于顶层布局（layouts/basic.vue），此处不再直接渲染 -->
  </Page>
</template>

<style scoped>
.scene-editor-v2 :deep(input.h-8) {
  min-height: 2rem;
}
</style>
