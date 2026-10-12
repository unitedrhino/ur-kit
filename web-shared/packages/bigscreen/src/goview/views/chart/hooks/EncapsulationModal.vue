<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { computed, ref, watch } from 'vue';

import { getAdapterTypes } from '@/views/chart/ContentConfigurations/components/SimplifiedDataPanel/adapters';
import { NCheckbox, NCheckboxGroup, NInput, NSelect, NSpace } from 'naive-ui';

export interface EncapsulationInitialData {
  adapterType?: string;
  category?: string;
  exposedProps?: string[];
  name?: string;
}

const props = withDefaults(
  defineProps<{
    componentName: string;
    /** 自动截取的封面图（base64） */
    coverImage?: string;
    /** 编辑态预填数据 */
    initialData?: EncapsulationInitialData;
    /** 是否为分组组件 */
    isGroup?: boolean;
    /** 'create' = 另存为新组件, 'update' = 覆盖更新已有模板 */
    mode?: 'create' | 'update';
  }>(),
  {
    mode: 'create',
    initialData: undefined,
    isGroup: false,
    coverImage: '',
  },
);

const emit = defineEmits<{
  update: [data: ReturnType<typeof getFormData>];
}>();

/** 封面图：优先使用自动截图，用户可手动上传覆盖 */
const thumbnail = ref(props.coverImage || '');
const fileInputRef = ref<HTMLInputElement | null>(null);

const onClickCover = () => {
  fileInputRef.value?.click();
};

const onFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    window.$message?.warning(editorT('console.user.avatarSizeError'));
    return;
  }
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    thumbnail.value = reader.result as string;
  });
  reader.readAsDataURL(file);
};

const name = ref(props.initialData?.name || props.componentName || '');
const category = ref('custom');

/** 区块级 exposedProps 选项：分组组件不展示"图表配置" */
const singlePropBlocks = [
  { value: 'name', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.titleName'); } },
  { value: 'size', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.dimensions'); } },
  { value: 'styles', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.styleFilters'); } },
  { value: 'conKey', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.chartConfiguration'); } },
];
const groupPropBlocks = [
  { value: 'name', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.titleName'); } },
  { value: 'size', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.dimensions'); } },
  { value: 'styles', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.styleFilters'); } },
];
const propBlocks = computed(() => (props.isGroup ? groupPropBlocks : singlePropBlocks));

const defaultSingleProps = ['name', 'size', 'styles', 'conKey'];
const defaultGroupProps = ['name', 'size', 'styles'];
const selectedProps = ref<string[]>(props.initialData?.exposedProps ?? (props.isGroup ? defaultGroupProps : defaultSingleProps));

const categoryOptions = [{ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenManagement.ui.definitionCustomComponent'); }, value: 'custom' }];

const adapterType = ref(props.initialData?.adapterType || '');
const adapterOptions = computed(() => {
  if (props.isGroup) {
    return [
      { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.compositeAdapterAutomaticDispatch'); }, value: '' },
      { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.iotDeviceDataSource'); }, value: 'iot-device' },
      { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.httpAPIDataSource'); }, value: 'http-api' },
    ];
  }
  return [{ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.defaultAutomaticMatching'); }, value: '' }, ...getAdapterTypes().map((t) => ({ label: t, value: t }))];
});

/** 供父级读取当前表单值 */
const getFormData = () => ({
  name: name.value.trim(),
  category: category.value,
  exposedProps: selectedProps.value,
  thumbnail: thumbnail.value,
  adapterType: adapterType.value || undefined,
});

defineExpose({ getFormData });

// 表单数据变化时通知父级（解决 h() 中 ref 无法回写的问题）
watch(
  [name, category, selectedProps, thumbnail, adapterType],
  () => {
    category.value = 'custom';
    emit('update', getFormData());
  },
  { immediate: true, deep: true },
);
</script>

<template>
  <NSpace vertical :size="16" style="padding: 8px 0">
    <div v-if="mode === 'update'" style="padding: 6px 10px; font-size: 12px; color: #f0a020; background: rgb(240 160 32 / 8%); border-radius: 4px">
      {{ editorT('bigscreenEditor.ui.overwriteExistingCustomComponentTemplateThisCannotBe') }}
    </div>
    <div>
      <div style="margin-bottom: 6px; font-size: 13px">{{ editorT('bigscreenEditor.ui.componentCover') }}</div>
      <div class="cover-area" @click="onClickCover">
        <img v-if="thumbnail" :src="thumbnail" class="cover-img" @error="thumbnail = ''" />
        <div v-else class="cover-placeholder">
          <span style="font-size: 12px; color: rgb(255 255 255 / 35%)">{{ editorT('bigscreenEditor.ui.clickUploadCover') }}</span>
        </div>
        <div v-if="thumbnail" class="cover-hint">{{ editorT('bigscreenEditor.ui.clickChange') }}</div>
      </div>
      <input ref="fileInputRef" type="file" accept="image/png,image/jpeg" style="display: none" @change="onFileChange" />
    </div>
    <div>
      <div style="margin-bottom: 6px; font-size: 13px">{{ editorT('bigscreenManagement.ui.definitionComponentName') }}</div>
      <NInput v-model:value="name" :placeholder="editorT('bigscreenEditor.ui.enterComponentName')" />
    </div>
    <div>
      <div style="margin-bottom: 6px; font-size: 13px">{{ editorT('orgManage.flow.categoryLabel') }}</div>
      <NSelect v-model:value="category" :options="categoryOptions" />
      <div style="margin-top: 6px; font-size: 12px; color: rgb(255 255 255 / 45%)">
        {{ editorT('bigscreenEditor.ui.creatingComponentFromCanvasSavesItAsCustom') }}
      </div>
    </div>
    <div>
      <div style="margin-bottom: 6px; font-size: 13px">{{ isGroup ? editorT('bigscreenEditor.ui.dataSourceType') : editorT('bigscreenEditor.ui.dataAdapter') }}</div>
      <NSelect v-model:value="adapterType" :options="adapterOptions" />
    </div>
    <div>
      <div style="margin-bottom: 6px; font-size: 13px">{{ editorT('bigscreenEditor.ui.exposedConfigurationVisibleRightPanel') }}</div>
      <NCheckboxGroup v-model:value="selectedProps">
        <NSpace vertical :size="8">
          <NCheckbox v-for="block in propBlocks" :key="block.value" :value="block.value" :label="block.label" />
        </NSpace>
      </NCheckboxGroup>
    </div>
  </NSpace>
</template>

<style scoped>
.cover-area {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 120px;
  overflow: hidden;
  cursor: pointer;
  background: rgb(0 0 0 / 15%);
  border: 1px dashed rgb(255 255 255 / 15%);
  border-radius: 6px;
  transition: border-color 0.2s;
}

.cover-area:hover {
  border-color: rgb(255 255 255 / 35%);
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.cover-hint {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 2px 0;
  font-size: 11px;
  color: rgb(255 255 255 / 50%);
  text-align: center;
  background: rgb(0 0 0 / 45%);
  opacity: 0;
  transition: opacity 0.2s;
}

.cover-area:hover .cover-hint {
  opacity: 1;
}
</style>
