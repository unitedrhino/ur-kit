<!-- 文件说明：共享大屏管理界面及交互，文案随当前语言更新。 -->
<script lang="ts" setup>
import { $t as t } from '@vben/saas/locales';

import type { ScreenInfo } from '../index.api';
import type { TemplateInfo } from '../../template/index.api';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { message } from '@vben/saas';
import { useProjectStore } from '@vben/stores';

import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import { NButton, NEmpty, NInput, NInputNumber, NScrollbar, NSelect, NSpin, NTag } from 'naive-ui';

import { BIGSCREEN_STANDALONE_IOT_APP_BASE, buildStandaloneBigscreenUrl } from '../../shared/route-path';
import { sanitizeTemplateRuntimeForScreen } from '../../shared/template-runtime-sanitize';
import { openNoOpenerWindow } from '../../../../shared/window-security';
import { ProjectDetailApi } from '../../shared/detail.api';
import { setScreenProjectBinding } from '../project-binding';
import { ScreenApi } from '../index.api';
import { screenResolutionOptions, screenStatusOptions } from '../data';
import { TemplateApi } from '../../template/index.api';
import { defaultTheme, globalThemeJson } from '../../../../goview/settings/chartThemes';
import { previewScaleType, requestInterval, requestIntervalUnit } from '../../../../goview/settings/designSetting';

const emit = defineEmits<{
  success: [];
}>();

type CreateMode = 'blank' | 'template';

type ScreenDraft = {
  customHeight?: number;
  customWidth?: number;
  desc: string;
  name: string;
  resolution: string;
  status: number;
};

type ChartEditStorageLike = {
  componentList: any[];
  editCanvasConfig: Record<string, any>;
  requestGlobalConfig: Record<string, any>;
};

const MAX_TEMPLATE_FETCH_SIZE = 1000;

const projectStore = useProjectStore();
const formData = ref<ScreenInfo>();
const templateSourceName = ref('');
const createMode = ref<CreateMode>('blank');
const templateLoading = ref(false);
const templates = ref<TemplateInfo[]>([]);
const selectedTemplateId = ref('');
const loading = ref(false);

const breakpoints = useBreakpoints(breakpointsTailwind);
const isHorizontal = computed(() => breakpoints.greaterOrEqual('md').value);
const isEditMode = computed(() => !!formData.value?.id);
const selectedTemplate = computed(() => templates.value.find((item) => item.id === selectedTemplateId.value));

const draft = ref<ScreenDraft>({
  customHeight: 1080,
  customWidth: 1920,
  desc: '',
  name: '',
  resolution: '1920x1080',
  status: 2,
});

const [Drawer, drawerApi] = useVbenDrawer({
  onConfirm: onSubmit,
  onOpenChange(isOpen) {
    if (isOpen) {
      void loadDrawerData();
    }
  },
});

const resolutionOptions = computed(() => {
  if (isEditMode.value) return screenResolutionOptions;
  if (createMode.value === 'template') {
    return [{ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.followTemplate'); }, value: 'template' }, ...screenResolutionOptions];
  }
  return screenResolutionOptions;
});

const currentTemplateSourceName = computed(() => {
  if (isEditMode.value) {
    return templateSourceName.value || t('bigscreenManagement.ui.createBlank');
  }
  if (createMode.value === 'template') {
    return selectedTemplate.value?.name || '';
  }
  return t('bigscreenManagement.ui.createBlank');
});

function resolveAssetUrl(path?: string) {
  if (!path) return '';
  const normalized = path.trim();
  if (!normalized) return '';
  if (/^https?:\/\//.test(normalized)) return normalized;
  // base64 data URL 直接可用（模板封面等场景），不能拼接到下载接口
  if (normalized.startsWith('data:')) return normalized;
  if (normalized.startsWith('/api/v1/system/common/download-file')) return normalized;
  if (normalized.startsWith('/oss/')) return normalized;

  let cleaned = normalized;
  if (cleaned.startsWith('/oss/public/')) {
    cleaned = cleaned.slice('/oss/public/'.length);
  } else if (cleaned.startsWith('/oss/ithings-public/')) {
    cleaned = cleaned.slice('/oss/ithings-public/'.length);
  } else if (cleaned.startsWith('/ithings-public/')) {
    cleaned = cleaned.slice('/ithings-public/'.length);
  } else {
    cleaned = cleaned.replace(/^\/+/, '');
  }
  const filePath = cleaned.startsWith('public/') ? cleaned : `public/${cleaned}`;
  return `/api/v1/system/common/download-file?filePath=${encodeURIComponent(filePath)}`;
}

function getTemplateCover(item: TemplateInfo) {
  if (!item.indexImage) return '';
  const base = resolveAssetUrl(item.indexImage);
  const version = item.updatedTime ? String(item.updatedTime) : '';
  if (!version || base.startsWith('data:') || base.includes('X-Amz-Signature')) return base;
  return `${base}${base.includes('?') ? '&' : '?'}t=${version}`;
}

function buildBlankStorage(screenName: string, width: number, height: number): ChartEditStorageLike {
  return {
    editCanvasConfig: {
      background: undefined,
      backgroundImage: undefined,
      blendMode: 'normal',
      brightness: 1,
      chartCustomThemeColorInfo: undefined,
      chartThemeColor: defaultTheme || 'dark',
      chartThemeSetting: globalThemeJson,
      contrast: 1,
      filterShow: false,
      height,
      hueRotate: 0,
      opacity: 1,
      previewScaleType,
      projectName: screenName,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      saturate: 1,
      selectColor: true,
      skewX: 0,
      skewY: 0,
      vChartThemeName: 'vScreenVolcanoBlue',
      width,
      templateSource: {
        id: '',
        /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get name() { return t('bigscreenManagement.ui.createBlank'); },
      },
    },
    requestGlobalConfig: {
      requestDataPond: [],
      requestInterval,
      requestIntervalUnit,
      requestOriginUrl: '',
      requestParams: {
        Body: {
          'form-data': {},
          'x-www-form-urlencoded': {},
          json: '',
          xml: '',
        },
        Header: {},
        Params: {},
      },
    },
    componentList: [],
  };
}

function normalizeStorage(
  raw: any,
  screenName: string,
  width: number,
  height: number,
  template?: TemplateInfo,
): ChartEditStorageLike {
  const blank = buildBlankStorage(screenName, width, height);
  const parsed = raw && typeof raw === 'object' ? raw : {};
  return {
    ...blank,
    ...parsed,
    editCanvasConfig: {
      ...blank.editCanvasConfig,
      ...parsed.editCanvasConfig,
      height,
      projectName: screenName,
      width,
      ...(template
        ? {
            templateSource: {
              id: String(template.id || ''),
              name: template.name || '',
            },
          }
        : {}),
    },
    requestGlobalConfig: {
      ...blank.requestGlobalConfig,
      ...parsed.requestGlobalConfig,
    },
    componentList: Array.isArray(parsed.componentList)
      ? template
        ? sanitizeTemplateRuntimeForScreen(parsed.componentList)
        : parsed.componentList
      : [],
  };
}

function parseResolutionWithFallback(
  resolution: string,
  customWidth: number | undefined,
  customHeight: number | undefined,
  fallbackWidth = 1920,
  fallbackHeight = 1080,
) {
  if (resolution === 'custom') {
    return {
      width: Number(customWidth || fallbackWidth),
      height: Number(customHeight || fallbackHeight),
    };
  }

  const [rawWidth, rawHeight] = resolution.split('x');
  const width = Number(rawWidth);
  const height = Number(rawHeight);
  if (!Number.isNaN(width) && !Number.isNaN(height) && width > 0 && height > 0) {
    return { width, height };
  }
  return { width: fallbackWidth, height: fallbackHeight };
}

async function loadTemplates() {
  templateLoading.value = true;
  try {
    const res = await TemplateApi.list(1, MAX_TEMPLATE_FETCH_SIZE, { status: 1 });
    templates.value = [...(res.list ?? [])].sort((left, right) => {
      const createdTimeDiff = Number(right.createdTime || 0) - Number(left.createdTime || 0);
      if (createdTimeDiff !== 0) {
        return createdTimeDiff;
      }
      return Number(right.id || 0) - Number(left.id || 0);
    });
  } catch (error) {
    templates.value = [];
    message.warning(t('bigscreenManagement.dynamic.failedToLoadTemplates', { error: String(((error as any).msg || (error as any).message || t('orgManage.systemConfig.unknownError')) as string) }));
  } finally {
    templateLoading.value = false;
  }
}

function resetCreateState() {
  createMode.value = 'blank';
  selectedTemplateId.value = '';
  templateSourceName.value = '';
  draft.value = {
    customHeight: 1080,
    customWidth: 1920,
    desc: '',
    name: '',
    resolution: '1920x1080',
    status: 2,
  };
}

async function loadDrawerData() {
  const screenInfo = drawerApi.getData<ScreenInfo>();
  drawerApi.setState({
    confirmText: screenInfo?.id ? t('orgManage.common.confirm') : t('bigscreenManagement.ui.createAndEdit'),
  });

  if (screenInfo && screenInfo.id) {
    formData.value = screenInfo;
    let parsedContent: any = {};
    try {
      const detail = await ProjectDetailApi.getContent(screenInfo.id);
      parsedContent = detail?.content ? JSON.parse(detail.content) : {};
      templateSourceName.value = parsedContent?.editCanvasConfig?.templateSource?.name || t('bigscreenManagement.ui.createBlank');
    } catch {
      parsedContent = {};
      templateSourceName.value = t('bigscreenManagement.ui.createBlank');
    }

    const width = Number(parsedContent?.editCanvasConfig?.width || 1920);
    const height = Number(parsedContent?.editCanvasConfig?.height || 1080);
    const resolutionOption = screenResolutionOptions.find((item) => item.value === `${width}x${height}`);

    draft.value = {
      customHeight: height,
      customWidth: width,
      desc: screenInfo.desc || '',
      name: screenInfo.name || '',
      resolution: resolutionOption ? resolutionOption.value : 'custom',
      status: screenInfo.status ?? 2,
    };
    return;
  }

  formData.value = undefined;
  resetCreateState();
  await loadTemplates();
}

function validateDraft() {
  if (!draft.value.name.trim()) {
    message.warning(t('bigscreenManagement.ui.enterDashboardName'));
    return false;
  }
  if (draft.value.resolution === 'custom') {
    if (!draft.value.customWidth || !draft.value.customHeight) {
      message.warning(t('bigscreenManagement.ui.enterCustomResolution'));
      return false;
    }
  }
  if (!isEditMode.value && createMode.value === 'template' && !selectedTemplate.value?.id) {
    message.warning(t('bigscreenManagement.ui.selectTemplate'));
    return false;
  }
  return true;
}

async function createScreenAndOpenEditor(): Promise<boolean> {
  if (!projectStore.currentProjectID) {
    message.warning(t('bigscreenManagement.ui.selectProjectBeforeCreatingDashboard'));
    return false;
  }

  // 重名校验
  const screenName = draft.value.name.trim();
  if (screenName && !isEditMode.value) {
    const { list } = await ScreenApi.list(1, 10, { name: screenName, type: 'screen' });
    if ((list || []).some((s) => s.name === screenName)) {
      message.warning(t('bigscreenManagement.dynamic.dashboardNameExists', { name: screenName }));
      return false;
    }
  }

  const payload: ScreenInfo = {
    desc: draft.value.desc,
    indexImage: selectedTemplate.value?.indexImage || undefined,
    name: draft.value.name.trim(),
    projectID: projectStore.currentProjectID,
    status: draft.value.status ?? 2,
  };

  const created = await ScreenApi.create(payload);
  const newId = (created as any)?.id;
  if (!newId) {
    throw new Error(t('bigscreenManagement.ui.failedCreateDashboard'));
  }

  setScreenProjectBinding(String(newId), projectStore.currentProjectID);

  if (createMode.value === 'blank') {
    const { width, height } = parseResolutionWithFallback(draft.value.resolution, draft.value.customWidth, draft.value.customHeight);
    const blankStorage = buildBlankStorage(payload.name || t('orgIotClient.energyDashboard.unnamedScreen'), width, height);
    await ProjectDetailApi.updateContent(String(newId), JSON.stringify(blankStorage));
  } else if (selectedTemplate.value?.id) {
    const detail = await ProjectDetailApi.getContent(String(selectedTemplate.value.id));
    const parsed = detail?.content ? JSON.parse(detail.content) : {};
    const fallbackWidth = Number(parsed?.editCanvasConfig?.width || 1920);
    const fallbackHeight = Number(parsed?.editCanvasConfig?.height || 1080);
    const { width, height } =
      draft.value.resolution === 'template'
        ? { width: fallbackWidth, height: fallbackHeight }
        : parseResolutionWithFallback(draft.value.resolution, draft.value.customWidth, draft.value.customHeight, fallbackWidth, fallbackHeight);

    const storage = normalizeStorage(parsed, payload.name || t('orgIotClient.energyDashboard.unnamedScreen'), width, height, selectedTemplate.value);
    await ProjectDetailApi.updateContent(String(newId), JSON.stringify(storage));
  }

  drawerApi.close();
  emit('success');
  openNoOpenerWindow(
    buildStandaloneBigscreenUrl(
      `/editor/${newId}`,
      {
        editorName: payload.name || undefined,
      },
      { appBase: BIGSCREEN_STANDALONE_IOT_APP_BASE },
    ),
  );
  return true;
}

async function onSubmit() {
  if (!validateDraft()) return;

  drawerApi.lock();
  loading.value = true;
  try {
    if (isEditMode.value) {
      await ScreenApi.update({
        id: formData.value?.id,
        name: draft.value.name.trim(),
        desc: draft.value.desc,
        projectID: projectStore.currentProjectID || undefined,
        status: draft.value.status ?? 2,
      });
      if (formData.value?.id) {
        let parsedContent: any = {};
        try {
          const detail = await ProjectDetailApi.getContent(String(formData.value.id));
          parsedContent = detail?.content ? JSON.parse(detail.content) : {};
        } catch {
          parsedContent = {};
        }

        const fallbackWidth = Number(parsedContent?.editCanvasConfig?.width || 1920);
        const fallbackHeight = Number(parsedContent?.editCanvasConfig?.height || 1080);
        const { width, height } = parseResolutionWithFallback(
          draft.value.resolution,
          draft.value.customWidth,
          draft.value.customHeight,
          fallbackWidth,
          fallbackHeight,
        );
        const nextStorage = normalizeStorage(parsedContent, draft.value.name.trim() || t('orgIotClient.energyDashboard.unnamedScreen'), width, height);
        await ProjectDetailApi.updateContent(String(formData.value.id), JSON.stringify(nextStorage));
      }
      if (formData.value?.id && projectStore.currentProjectID) {
        setScreenProjectBinding(formData.value.id, projectStore.currentProjectID);
      }
      message.success(t('orgManage.common.updateSuccess'));
      drawerApi.close();
      emit('success');
      return;
    }

    const created = await createScreenAndOpenEditor();
    if (created) {
      message.success(t('bigscreenManagement.ui.createdOpeningEditor'));
    }
  } catch (error) {
    message.error(t('bigscreenManagement.dynamic.failedToSubmit', { error: String(((error as any).msg || (error as any).message || t('orgManage.systemConfig.unknownError')) as string) }));
  } finally {
    loading.value = false;
    drawerApi.unlock();
  }
}

function chooseMode(mode: CreateMode) {
  createMode.value = mode;
  selectedTemplateId.value = '';
  if (mode === 'template') {
    draft.value.resolution = 'template';
  } else if (draft.value.resolution === 'template') {
    draft.value.resolution = '1920x1080';
  }
}

function selectTemplate(template: TemplateInfo) {
  selectedTemplateId.value = String(template.id || '');
}

const drawerTitle = computed(() => (isEditMode.value ? t('orgPark.ui.editDashboard') : t('bigscreenManagement.ui.createDashboard')));
</script>

<template>
  <Drawer class="w-full max-w-[980px]" :title="drawerTitle">
    <NScrollbar class="screen-create-drawer-scroll">
      <div class="screen-create-drawer bigscreen-manage-page" :class="{ 'is-edit': isEditMode }">
        <div v-if="!isEditMode" class="create-mode-panel">
          <div class="section-title">{{ t('bigscreenManagement.ui.creationMethod') }}</div>
          <div class="mode-grid">
            <button class="mode-card" :class="{ active: createMode === 'blank' }" type="button" @click="chooseMode('blank')">
              <div class="mode-name">{{ t('bigscreenManagement.ui.createBlank') }}</div>
              <div class="mode-desc">{{ t('bigscreenManagement.ui.startBlankCanvasAndBuildCustomDashboard') }}</div>
            </button>
            <button class="mode-card" :class="{ active: createMode === 'template' }" type="button" @click="chooseMode('template')">
              <div class="mode-name">{{ t('bigscreenManagement.ui.createFromTemplate') }}</div>
              <div class="mode-desc">{{ t('bigscreenManagement.ui.choosePlatformTemplateAsStartingPointThenCreate') }}</div>
            </button>
          </div>
        </div>

        <div class="form-panel">
          <div class="section-title">{{ t('orgManage.orgSettings.basicInfo') }}</div>
        <div class="form-grid" :class="{ horizontal: isHorizontal }">
          <div class="field">
            <label>{{ t('bigscreenManagement.ui.dashboardName') }} <span class="required">*</span></label>
            <NInput v-model:value="draft.name" :placeholder="t('bigscreenManagement.ui.enterDashboardName')" />
          </div>

          <div class="field">
            <label>{{ t('bigscreenManagement.ui.templateSource') }}</label>
            <NInput :value="currentTemplateSourceName" disabled :placeholder="createMode === 'template' ? t('bigscreenManagement.ui.selectTemplate2') : t('bigscreenManagement.ui.createBlank')" />
          </div>

          <div class="field">
            <label>{{ t('iotApp.av.colResolution') }}</label>
            <NSelect v-model:value="draft.resolution" :options="resolutionOptions" />
          </div>

          <div class="field">
            <label>{{ t('orgManage.common.status') }}</label>
            <NSelect
              v-model:value="draft.status"
              :options="screenStatusOptions.map(({ label, value }) => ({ label, value }))"
            />
          </div>

          <template v-if="draft.resolution === 'custom'">
            <div class="field">
              <label>{{ t('bigscreenManagement.ui.customWidth') }}</label>
              <NInputNumber v-model:value="draft.customWidth" :min="320" :max="10000" />
            </div>

            <div class="field">
              <label>{{ t('bigscreenManagement.ui.customHeight') }}</label>
              <NInputNumber v-model:value="draft.customHeight" :min="320" :max="10000" />
            </div>
          </template>

          <div class="field field-span-2">
            <label>{{ t('orgManage.common.remark') }}</label>
              <NInput v-model:value="draft.desc" type="textarea" :rows="4" :placeholder="t('iotApp.projectForm.enterRemarks')" />
            </div>
          </div>
        </div>

        <div v-if="!isEditMode && createMode === 'template'" class="template-panel">
          <div class="section-head">
            <div class="section-title">{{ t('bigscreenManagement.ui.templateSelection') }}</div>
            <div class="section-tip">{{ t('bigscreenManagement.ui.chooseTemplateAsInitialContentThisDashboard') }}</div>
          </div>
          <NSpin :show="templateLoading" size="small">
            <div v-if="templates.length > 0" class="template-grid">
              <button
                v-for="template in templates"
                :key="template.id"
                class="template-card"
                :class="{ active: selectedTemplateId === String(template.id || '') }"
                type="button"
                @click="selectTemplate(template)"
              >
                <div class="template-cover">
                  <img v-if="getTemplateCover(template)" :src="getTemplateCover(template)" alt="template cover" />
                  <div v-else class="template-placeholder">
                    <span class="icon-[mdi--monitor-dashboard] size-10 opacity-30"></span>
                  </div>
                </div>
                <div class="template-footer">
                  <div class="template-name">{{ template.name || t('bigscreenManagement.ui.untitledTemplate') }}</div>
                  <div class="template-desc" :title="template.desc || t('bigscreenManagement.ui.noDescription')">{{ template.desc || t('bigscreenManagement.ui.noDescription') }}</div>
                  <div class="template-meta">
                    <div class="template-tags">
                      <NTag v-if="template.status === 1" size="small" round type="success">{{ t('bigscreenManagement.ui.listed') }}</NTag>
                      <NTag size="small" round :type="template.source === 'system' ? 'info' : 'default'">
                        {{ template.source === 'system' ? t('platformManage.ai.scopeCommon') : t('iotApp.productPage.custom') }}
                      </NTag>
                      <NTag v-if="template.resolution" size="small" round type="default">
                        {{ template.resolution }}
                      </NTag>
                    </div>
                  </div>
                </div>
              </button>
            </div>
            <NEmpty v-else :description="t('bigscreenManagement.ui.noAvailableTemplates')" />
          </NSpin>
        </div>
      </div>
    </NScrollbar>
  </Drawer>
</template>

<style scoped>
.screen-create-drawer-scroll {
  max-height: calc(100vh - 180px);
}

.screen-create-drawer {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 8px 16px 12px;
}

.screen-create-drawer.is-edit {
  gap: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--n-text-color);
}

.section-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-tip {
  color: var(--n-text-color);
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
}

.create-mode-panel,
.template-panel,
.form-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.mode-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  text-align: left;
  background: var(--bigscreen-panel-bg);
  border: 1px solid var(--bigscreen-card-border);
  border-radius: var(--bigscreen-radius);
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    transform 0.2s;
}

.mode-card:hover {
  transform: translateY(-1px);
}

.mode-card.active {
  border-color: rgb(59 130 246 / 80%);
  box-shadow: 0 0 0 1px rgb(59 130 246 / 28%);
}

.mode-name {
  font-size: 15px;
  font-weight: 600;
}

.mode-desc {
  color: var(--n-text-color-3);
  font-size: 12px;
  line-height: 1.6;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
}

.template-card {
  appearance: none;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 100%;
  padding: 0;
  text-align: left;
  cursor: pointer;
  background: var(--bigscreen-panel-bg);
  border: 1px solid var(--bigscreen-card-border);
  border-radius: var(--bigscreen-radius);
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    transform 0.2s;
}

.template-card:hover {
  box-shadow: var(--bigscreen-card-hover-shadow, 0 14px 32px rgb(15 23 42 / 10%));
  transform: translateY(-1px);
}

.template-card.active {
  border-color: rgb(59 130 246 / 80%);
  box-shadow:
    0 0 0 1px rgb(59 130 246 / 28%),
    var(--bigscreen-card-hover-shadow, 0 14px 32px rgb(15 23 42 / 10%));
}

.template-cover {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: var(--bigscreen-cover-bg, rgb(15 23 42 / 55%));
}

.template-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.template-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--bigscreen-placeholder-text, var(--n-text-color-3));
}

.template-footer {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  background: var(--bigscreen-footer-bg, var(--n-color));
}

.template-name {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.template-desc {
  min-height: 20px;
  overflow: hidden;
  color: var(--bigscreen-muted-text, var(--n-text-color-3));
  font-size: 12px;
  line-height: 1.6;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.template-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

.form-grid.horizontal {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field :deep(.n-input-number),
.field :deep(.n-base-selection),
.field :deep(.n-input) {
  width: 100%;
}

.field label {
  color: var(--n-text-color);
  font-size: 13px;
  font-weight: 500;
}

.field-span-2 {
  grid-column: 1 / -1;
}

.required {
  color: var(--n-color-error);
}

@media (max-width: 1024px) {
  .mode-grid {
    grid-template-columns: 1fr;
  }
}
</style>
