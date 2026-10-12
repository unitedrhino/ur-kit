<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { computed, nextTick, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { activateConnectLineTool, createConnectLineToolConfig } from '@/packages/components/Decorates/FlowChart/ConnectLine';
import { icon } from '@/plugins';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import { EditCanvasConfigEnum } from '@/store/modules/chartEditStore/chartEditStore.type';
import { setTitle } from '@/utils';

import { ScreenApi } from '../../../../../views/bigscreen/screen/index.api';
import { TemplateApi } from '../../../../../views/bigscreen/template/index.api';

type LinePathType = 'elbow' | 'roundedElbow' | 'straight';

type ConnectLineToolbarConfig = {
  defaultPathType?: LinePathType;
  key?: string;
};

const { ChevronDownIcon, FishIcon } = icon.ionicons5;
const chartEditStore = useChartEditStore();
const canvasConfig = chartEditStore.getEditCanvasConfig;
const route = useRoute();

function getOuterEditorSearch() {
  const directSearch = window.location.search.replace(/^\?/, '');
  if (directSearch) {
    return new URLSearchParams(directSearch);
  }

  const hash = window.location.hash || '';
  const queryIndex = hash.indexOf('?');
  if (queryIndex !== -1 && queryIndex < hash.length - 1) {
    return new URLSearchParams(hash.slice(queryIndex + 1));
  }

  return new URLSearchParams();
}

const outerEditorSearch = getOuterEditorSearch();

const focus = ref(false);
const inputInstRef = ref<null | { focus: () => void }>(null);
const selectedLineType = ref<LinePathType>('elbow');
const title = ref(outerEditorSearch.get('editorName') || '');

const lineTypeLabels: Record<LinePathType, string> = {
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get elbow() { return editorT('bigscreenEditor.ui.line'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get roundedElbow() { return editorT('bigscreenEditor.ui.roundedLine'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get straight() { return editorT('bigscreenEditor.ui.straightLine'); },
};

const isComponentMode = computed(() => chartEditStore.getIsComponentMode);
const isTemplateEditor = computed(() => outerEditorSearch.get('editorKind') === 'template');
const isConnectLineEditMode = computed(
  () => chartEditStore.getEditCanvas.isCreate && chartEditStore.getEditCanvas.createComponentConfig?.key === 'ConnectLine',
);

const activeLineType = computed<LinePathType>(() => {
  const createConfig = chartEditStore.getEditCanvas.createComponentConfig as ConnectLineToolbarConfig | null;
  if (isConnectLineEditMode.value && createConfig?.key === 'ConnectLine') {
    return createConfig.defaultPathType ?? selectedLineType.value;
  }
  return selectedLineType.value;
});

const activeLineTypeLabel = computed(() => lineTypeLabels[activeLineType.value]);
const lineTypeMenuOptions = computed(() =>
  (Object.entries(lineTypeLabels) as Array<[LinePathType, string]>).map(([key, label]) => ({
    key,
    label: activeLineType.value === key ? `✓ ${label}` : label,
  })),
);

const componentTitle = computed(() => {
  const meta = chartEditStore.editCanvas.componentMeta;
  const name = meta?.name || editorT('bigscreenEditor.ui.unnamedComponent');
  const version = meta?.version || '';
  return editorT('bigscreenEditor.dynamic.message80', { name: String(name), version: String(version ? ` v${version}` : '') });
});

const titlePrefix = computed(() => (isTemplateEditor.value ? editorT('bigscreenEditor.ui.editTemplate') : editorT('bigscreenEditor.ui.workspace')));
const titlePlaceholder = computed(() => (isTemplateEditor.value ? editorT('platformManage.notify.templateNamePlaceholder') : editorT('iotApp.project.projectNamePh')));
const defaultTitle = computed(() => (isTemplateEditor.value ? editorT('bigscreenEditor.ui.newTemplate') : editorT('bigscreenEditor.ui.newProject')));

watch(
  () => canvasConfig.projectName,
  (projectName) => {
    if (projectName && !focus.value) {
      title.value = String(projectName).replaceAll(/\s/g, '');
    }
  },
  { immediate: true },
);

const currentTitle = computed(() => {
  const nextTitle = (title.value || canvasConfig.projectName || defaultTitle.value).replaceAll(/\s/g, '') || defaultTitle.value;
  setTitle(`${titlePrefix.value}-${nextTitle}`);
  chartEditStore.setEditCanvasConfig(EditCanvasConfigEnum.PROJECT_NAME, nextTitle);
  return nextTitle;
});

const handleFocus = () => {
  title.value = currentTitle.value;
  focus.value = true;
  nextTick(() => inputInstRef.value?.focus());
};

const persistTitle = async (nextTitle: string) => {
  const routeID = route.params?.id;
  let routeParamID = '';
  if (typeof routeID === 'string') {
    routeParamID = routeID;
  } else if (Array.isArray(routeID)) {
    routeParamID = routeID[0] || '';
  }
  const id = outerEditorSearch.get('componentId') || routeParamID;
  if (!id) return;

  if (isTemplateEditor.value) {
    await TemplateApi.update({ id, name: nextTitle });
    return;
  }

  await ScreenApi.update({ id, name: nextTitle });
};

const handleBlur = () => {
  focus.value = false;
  const nextTitle = title.value.replaceAll(/\s/g, '') || defaultTitle.value;
  title.value = nextTitle;
  chartEditStore.setEditCanvasConfig(EditCanvasConfigEnum.PROJECT_NAME, nextTitle);
  setTitle(`${titlePrefix.value}-${nextTitle}`);
  void persistTitle(nextTitle);
};

const activateLineType = (pathType: LinePathType) => {
  selectedLineType.value = pathType;
  activateConnectLineTool(createConnectLineToolConfig(pathType));
};

const lineToolHandle = () => {
  activateLineType(activeLineType.value);
};

const handleLineTypeSelect = (key: LinePathType) => {
  activateLineType(key);
};
</script>

<template>
  <n-space align="center" :size="8">
    <n-icon size="20" :depth="3">
      <FishIcon />
    </n-icon>

    <n-text @click="handleFocus">
      <template v-if="isComponentMode">
        {{ componentTitle }}
      </template>
      <template v-else>
        {{ titlePrefix }} -
        <n-button v-show="!focus" secondary size="tiny">
          <span class="title">
            {{ currentTitle }}
          </span>
        </n-button>
      </template>
    </n-text>

    <div v-if="!isComponentMode && !focus" class="line-tool-entry">
      <n-button class="line-tool-btn line-tool-main-btn" ghost size="tiny" @click="lineToolHandle">
        <span class="line-tool-label">{{ activeLineTypeLabel }}</span>
      </n-button>
      <n-dropdown trigger="click" placement="bottom-end" :options="lineTypeMenuOptions" :show-arrow="true" @select="handleLineTypeSelect">
        <n-button class="line-tool-btn line-tool-menu-btn" ghost size="tiny">
          <n-icon size="12">
            <ChevronDownIcon />
          </n-icon>
        </n-button>
      </n-dropdown>
    </div>

    <n-input
      v-show="focus && !isComponentMode"
      ref="inputInstRef"
      v-model:value.trim="title"
      size="small"
      type="text"
      maxlength="16"
      show-count
      :placeholder="titlePlaceholder"
      @keyup.enter="handleBlur"
      @blur="handleBlur"
    />
  </n-space>
</template>

<style lang="scss" scoped>
.title {
  padding: 0 5px;
  font-size: 15px;
}

.line-tool-btn {
  min-width: 0;
  height: 28px;
  color: rgb(214 214 214);
}

.line-tool-label {
  font-size: 12px;
}

.line-tool-entry {
  display: inline-flex;
  align-items: center;
  margin-left: 6px;
  overflow: hidden;
  border-radius: 6px;
}

.line-tool-main-btn {
  padding: 0 10px;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.line-tool-menu-btn {
  padding: 0 6px;
  margin-left: -1px;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.line-tool-btn:deep(.n-button__content) {
  color: inherit;
}

.line-tool-btn:deep(.n-button__border),
.line-tool-btn:deep(.n-button__state-border),
.line-tool-btn:deep(.n-button__state-overlay) {
  display: none;
}
</style>
