<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script script lang="ts" setup>
import { $t as editorT } from '@vben/saas/locales';

import type { ListType } from './index.type';

import { reactive, ref, watch } from 'vue';

import { icon } from '@/plugins';
import { useSettingStore } from '@/store/modules/settingStore/settingStore';
import { SettingStoreEnums, ToolsStatusEnum } from '@/store/modules/settingStore/settingStore.type';

const props = defineProps({
  modelShow: Boolean,
});

const emit = defineEmits(['update:modelShow']);
const { HelpOutlineIcon, CloseIcon } = icon.ionicons5;
const settingStore = useSettingStore();
const modelShowRef = ref(false);

const list = reactive<ListType[]>([
  {
    key: SettingStoreEnums.ASIDE_ALL_COLLAPSED,
    value: settingStore.getAsideAllCollapsed,
    type: 'switch',
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get name() { return editorT('bigscreenEditor.ui.collapseMenu'); },
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get desc() { return editorT('bigscreenEditor.ui.hideHomeMenuOutsideViewWhenCollapsed'); },
  },
  {
    key: SettingStoreEnums.HIDE_PACKAGE_ONE_CATEGORY,
    value: settingStore.getHidePackageOneCategory,
    type: 'switch',
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get name() { return editorT('bigscreenEditor.ui.hideCategories'); },
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get desc() { return editorT('bigscreenEditor.ui.hideFormCategoriesOnlyOneItem'); },
  },
  {
    key: SettingStoreEnums.CHANGE_LANG_RELOAD,
    value: settingStore.getChangeLangReload,
    type: 'switch',
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get name() { return editorT('bigscreenEditor.ui.switchLanguage'); },
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get desc() { return editorT('bigscreenEditor.ui.reloadPageWhenSwitchingLanguage'); },
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get tip() { return editorT('bigscreenEditor.ui.ifSomeAreasDoNotSwitchLanguageCorrectly'); },
  },
  {
    key: 'divider1',
    type: 'divider',
    name: '',
    desc: '',
    value: '',
  },
  {
    key: SettingStoreEnums.CHART_TOOLS_STATUS_HIDE,
    value: settingStore.getChartToolsStatusHide,
    type: 'switch',
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get name() { return editorT('bigscreenEditor.ui.hideToolbar'); },
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get desc() { return editorT('bigscreenEditor.ui.hoverSwitchExpandedMode'); },
  },
  {
    key: SettingStoreEnums.CHART_TOOLS_STATUS,
    value: settingStore.getChartToolsStatus,
    type: 'select',
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get name() { return editorT('bigscreenEditor.ui.toolbarDisplay'); },
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get desc() { return editorT('bigscreenEditor.ui.workspaceToolbarDisplayMode'); },
    options: [
      {
        /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.sidebar'); },
        value: ToolsStatusEnum.ASIDE,
      },
      {
        /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.bottomDock'); },
        value: ToolsStatusEnum.DOCK,
      },
    ],
  },
  {
    key: 'divider0',
    type: 'divider',
    name: '',
    desc: '',
    value: '',
  },
  {
    key: SettingStoreEnums.CHART_MOVE_DISTANCE,
    value: settingStore.getChartMoveDistance,
    type: 'number',
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get name() { return editorT('bigscreenEditor.ui.movementDistance'); },
    min: 1,
    step: 1,
    suffix: 'px',
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get desc() { return editorT('bigscreenEditor.ui.movementDistanceWorkspaceArrowKeys'); },
  },
  {
    key: SettingStoreEnums.CHART_ALIGN_RANGE,
    value: settingStore.getChartAlignRange,
    type: 'number',
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get name() { return editorT('bigscreenEditor.ui.snapDistance'); },
    min: 10,
    step: 2,
    suffix: 'px',
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get desc() { return editorT('bigscreenEditor.ui.snapDistanceWhenMovingWorkspaceCharts'); },
  },
]);

watch(
  () => props.modelShow,
  (newValue) => {
    modelShowRef.value = newValue;
  },
);

const closeHandle = () => {
  emit('update:modelShow', false);
};

const handleChange = (e: MouseEvent, item: ListType) => {
  settingStore.setItem(item.key, item.value);
};
</script>

<template>
  <n-modal v-model:show="modelShowRef" @after-leave="closeHandle">
    <n-list bordered class="go-system-setting">
      <template #header>
        <n-space justify="space-between">
          <n-h3 class="go-mb-0">{{ editorT('orgMall.routes.settings') }}</n-h3>
          <n-icon size="20" class="go-cursor-pointer" @click="closeHandle">
            <CloseIcon />
          </n-icon>
        </n-space>
      </template>

      <n-list-item v-for="item in list" :key="item.key">
        <!-- 分割线 -->
        <n-divider v-if="item.type === 'divider'" style="margin: 0" />
        <n-space v-else :size="40">
          <n-space>
            <!-- 左侧标题 -->
            <n-text class="item-left">{{ item.name }}</n-text>

            <!-- 数据操作 -->
            <template v-if="item.type === 'switch'">
              <n-switch v-model:value="item.value" size="small" @update:value="handleChange($event, item)" />
            </template>

            <template v-else-if="item.type === 'number'">
              <n-input-number
                v-model:value="item.value"
                class="input-num-width"
                size="small"
                :step="item.step || null"
                :suffix="item.suffix || null"
                :min="item.min || 0"
                @update:value="handleChange($event, item)"
              />
            </template>

            <template v-else-if="item.type === 'select'">
              <n-select class="select-min-width" v-model:value="item.value" size="small" :options="item.options" @update:value="handleChange($event, item)" />
            </template>
          </n-space>

          <!-- 右侧描述 -->
          <n-space>
            <n-text class="item-right">{{ item.desc }}</n-text>
            <n-tooltip v-if="item.tip" trigger="hover">
              <template #trigger>
                <n-icon size="21">
                  <HelpOutlineIcon />
                </n-icon>
              </template>
              <span>{{ item.tip }}</span>
            </n-tooltip>
          </n-space>
        </n-space>
      </n-list-item>
    </n-list>
  </n-modal>
</template>

<style lang="scss" scoped>
@include go('system-setting') {
  @extend .go-background-filter;

  min-width: 100px;
  max-width: 60vw;
  padding-bottom: 20px;

  @include deep() {
    .n-list-item {
      border-bottom: 0 !important;
    }

    .n-list-item__divider {
      display: none !important;
    }
  }

  .item-left {
    width: 200px;
  }

  .input-num-width {
    width: 100px;
  }

  .select-min-width {
    width: 115px;
  }
}
</style>
