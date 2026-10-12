<!-- 文件说明：共享大屏管理界面及交互，文案随当前语言更新。 -->
<script lang="ts" setup>
import { useLocalizedForm as useVbenForm } from '../../shared/manage-i18n';

import { $t as t } from '@vben/saas/locales';

import { computed, ref } from 'vue';

import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';

import { useVbenDrawer } from '@vben/common-ui';
import { message} from '@vben/saas';

import { ProjectDetailApi } from '../../shared/detail.api';
import { defaultTheme, globalThemeJson } from '../../../../goview/settings/chartThemes';
import { previewScaleType, requestInterval, requestIntervalUnit } from '../../../../goview/settings/designSetting';
import { TemplateApi, type TemplateInfo } from '../index.api';
import { templateResolutionOptions, useFormSchema } from '../data';
import { compressImage, urlToBase64 } from '../../shared/image-utils';

const emit = defineEmits<{
  success: [];
}>();

const formData = ref<TemplateInfo>();

const breakpoints = useBreakpoints(breakpointsTailwind);
const isHorizontal = computed(() => breakpoints.greaterOrEqual('md').value);

const [Form, formApi] = useVbenForm(() => ({
  commonConfig: {
    colon: true,
    formItemClass: 'col-span-2 md:col-span-1',
  },
  schema: useFormSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2 gap-x-4',
}));

type ChartEditStorageLike = {
  componentList: any[];
  editCanvasConfig: Record<string, any>;
  requestGlobalConfig: Record<string, any>;
};

const [Drawer, drawerApi] = useVbenDrawer({
  onConfirm: onSubmit,
  onOpenChange(isOpen) {
    if (isOpen) {
      void loadDrawerData();
    }
  },
});

function buildBlankStorage(templateName: string, width: number, height: number): ChartEditStorageLike {
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
      projectName: templateName,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      saturate: 1,
      selectColor: true,
      skewX: 0,
      skewY: 0,
      vChartThemeName: 'vScreenVolcanoBlue',
      width,
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

function normalizeStorage(raw: any, templateName: string, width: number, height: number): ChartEditStorageLike {
  const blank = buildBlankStorage(templateName, width, height);
  const parsed = raw && typeof raw === 'object' ? raw : {};
  return {
    ...blank,
    ...parsed,
    editCanvasConfig: {
      ...blank.editCanvasConfig,
      ...parsed.editCanvasConfig,
      width,
      height,
      projectName: templateName,
    },
    requestGlobalConfig: {
      ...blank.requestGlobalConfig,
      ...parsed.requestGlobalConfig,
    },
    componentList: Array.isArray(parsed.componentList) ? parsed.componentList : [],
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

async function loadDrawerData() {
  const templateInfo = drawerApi.getData<TemplateInfo>();
  if (templateInfo && templateInfo.id) {
    formData.value = templateInfo;
    let parsedContent: any = {};
    try {
      const detail = await ProjectDetailApi.getContent(String(templateInfo.id));
      parsedContent = detail?.content ? JSON.parse(detail.content) : {};
    } catch {
      parsedContent = {};
    }

    const width = Number(parsedContent?.editCanvasConfig?.width || 1920);
    const height = Number(parsedContent?.editCanvasConfig?.height || 1080);
    const resolutionOption = templateResolutionOptions.find((item) => item.value === `${width}x${height}`);

    formApi.setValues({
      name: templateInfo.name,
      desc: templateInfo.desc,
      indexImage: templateInfo.indexImage,
      tags: templateInfo.tags?.join(','),
      resolution: resolutionOption ? resolutionOption.value : 'custom',
      customWidth: width,
      customHeight: height,
    });
  } else {
    formData.value = undefined;
    formApi.resetForm();
    formApi.setValues({
      resolution: '1920x1080',
      customWidth: 1920,
      customHeight: 1080,
    });
  }
}

async function onSubmit() {
  try {
    await formApi.validate();
  } catch {
    return;
  }

  drawerApi.lock();
  const values = await formApi.getValues<Record<string, any>>();
  if (values.resolution === 'custom' && (!values.customWidth || !values.customHeight)) {
    message.warning(t('bigscreenManagement.ui.enterCustomResolution'));
    return;
  }

  // 重名校验
  const templateName = values.name?.trim();
  if (templateName) {
    const isEdit = !!formData.value?.id;
    const nameChanged = !isEdit || formData.value?.name !== templateName;
    if (nameChanged) {
      const { list } = await TemplateApi.list(1, 10, { name: templateName, type: 'template' });
      const duplicate = (list || []).find((t) => t.name === templateName && t.id !== formData.value?.id);
      if (duplicate) {
        drawerApi.unlock();
        message.warning(t('bigscreenManagement.dynamic.templateNameExists', { name: templateName }));
        return;
      }
    }
  }

  // --- 封面图 OSS URL → 压缩 Base64 ---
  // 解决跨环境 OSS 不互通导致模板封面显示异常的问题
  let finalIndexImage = values.indexImage || '';
  if (finalIndexImage && !finalIndexImage.startsWith('data:')) {
    try {
      const rawBase64 = await urlToBase64(finalIndexImage);
      finalIndexImage = await compressImage(rawBase64);
    } catch (e) {
      console.warn('[template] 封面转 Base64 失败，保留原始 URL:', e);
      // 降级：保留原 URL，至少比空白好
    }
  }
  // ------------------------------------

  const payload: TemplateInfo = {
    id: formData.value?.id,
    name: values.name,
    desc: values.desc,
    indexImage: finalIndexImage,
    tags: values.tags ? String(values.tags).split(',').map((tag) => tag.trim()).filter(Boolean) : [],
  };

  try {
    if (formData.value?.id) {
      await TemplateApi.update(payload);
      const detail = await ProjectDetailApi.getContent(String(formData.value.id));
      const parsed = detail?.content ? JSON.parse(detail.content) : {};
      const fallbackWidth = Number(parsed?.editCanvasConfig?.width || 1920);
      const fallbackHeight = Number(parsed?.editCanvasConfig?.height || 1080);
      const { width, height } = parseResolutionWithFallback(
        values.resolution,
        values.customWidth,
        values.customHeight,
        fallbackWidth,
        fallbackHeight,
      );
      const nextStorage = normalizeStorage(parsed, values.name || t('bigscreenManagement.ui.untitledTemplate'), width, height);
      await ProjectDetailApi.updateContent(String(formData.value.id), JSON.stringify(nextStorage));
      message.success(t('orgManage.common.updateSuccess'));
    } else {
      const created = await TemplateApi.create(payload);
      const newId = (created as any)?.id;
      if (!newId) {
        throw new Error(t('bigscreenManagement.ui.failedCreateTemplate'));
      }
      const { width, height } = parseResolutionWithFallback(values.resolution, values.customWidth, values.customHeight);
      const blankStorage = buildBlankStorage(values.name || t('bigscreenManagement.ui.untitledTemplate'), width, height);
      await ProjectDetailApi.updateContent(String(newId), JSON.stringify(blankStorage));
      message.success(t('orgManage.common.createSuccess'));
    }
    drawerApi.close();
    emit('success');
  } catch (error) {
    message.error(t('bigscreenManagement.dynamic.failedToSubmit', { error: String(((error as any).msg || (error as any).message || t('orgManage.systemConfig.unknownError')) as string) }));
  } finally {
    drawerApi.unlock();
  }
}

const getDrawerTitle = computed(() => (formData.value?.id ? t('bigscreenManagement.ui.editTemplate') : t('bigscreenManagement.ui.createTemplate')));
</script>

<template>
  <Drawer class="w-full max-w-[820px]" :title="getDrawerTitle">
    <Form class="mx-4" :layout="isHorizontal ? 'horizontal' : 'vertical'" />
  </Drawer>
</template>
