<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <n-timeline class="go-chart-configurations-timeline">
    <!-- 处理 echarts 的数据映射（IoT 模式无需等待 dataset，只要选了属性字段即显示） -->
    <n-timeline-item v-if="(isCharts || isSingleValueMappingTarget) && (dimensionsAndSource || isIoTReady)" type="info" :title="TimelineTitleLabels.MAPPING">
      <!-- hideCompositeMapper：由外部 SmartMapping 替代，此处跳过渲染 -->
      <template v-if="hideCompositeMapper">
        <n-text depth="3" style="font-size: 12px">{{ editorT('bigscreenEditor.ui.fieldMappingsAreConfiguredDataMappingSectionAbove') }}</n-text>
      </template>
      <!-- 复合组件：图表感知型字段映射器（用户只需选择语义字段角色） -->
      <CompositeFieldMapper
        v-else-if="showCompositeMapper"
        :chart-key="targetData.option.chartKey ?? targetData.chartConfig.chartKey"
        :chart-option="
          targetData.chartConfig.chartKey === 'VBorderDualChart' ? targetData.option : isComposite ? targetData.option.chartOption : targetData.option
        "
        :request-data-type="targetData.request.requestDataType"
        :iot-device-config="targetData.request.requestIoTDeviceConfig"
      />
      <SingleValueFieldMapper
        v-else-if="isSingleValueMappingTarget"
        :chart-option="targetData.option"
        :request-data-type="targetData.request.requestDataType"
        :iot-device-config="targetData.request.requestIoTDeviceConfig"
      />
      <!-- 普通 ECharts：原有字段映射表 -->
      <n-table v-else striped>
        <thead>
          <tr>
            <th v-for="item in tableTitle" :key="item">{{ item }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in dimensionsAndSource" :key="index">
            <td>{{ item.field }}</td>
            <td>{{ item.mapping }}</td>
            <td>
              <n-space v-if="item.result === 0">
                <n-badge dot type="success"></n-badge>
                <n-text>{{ editorT('iotApp.card.overageNone') }}</n-text>
              </n-space>
              <n-space v-else>
                <n-badge dot :type="item.result === 1 ? 'success' : 'error'"></n-badge>
                <n-text>{{ editorT('bigscreenEditor.ui.match') }}{{ item.result === 1 ? editorT('orgManage.memory.statusSuccess') : editorT('orgManage.memory.statusFailed') }}</n-text>
              </n-space>
            </td>
          </tr>
        </tbody>
      </n-table>
    </n-timeline-item>
    <!-- 处理 vcharts 的数据映射 -->
    <n-timeline-item v-if="isVChart" type="info" :title="TimelineTitleLabels.MAPPING">
      <n-table striped>
        <thead>
          <tr>
            <th v-for="item in vchartTableTitle" :key="item">{{ item }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in fieldList" :key="item.field">
            <td>
              <n-ellipsis style="width: 70px; max-width: 240px">
                {{ item.field }}
              </n-ellipsis>
            </td>
            <td v-if="isArray(item.mapping)">
              <n-space :size="4" vertical>
                <n-input
                  v-for="(mappingItem, index) in item.mapping"
                  :key="index"
                  v-model:value="item.mapping[index]"
                  type="tiny"
                  size="small"
                  :placeholder="editorT('bigscreenEditor.ui.inputField')"
                  @change="() => (item.result = matchingHandle(item.mapping[index] ?? ''))"
                />
              </n-space>
            </td>
            <td v-else>
              <n-input v-model:value="item.mapping" type="text" size="small" :placeholder="editorT('bigscreenEditor.ui.small')" />
            </td>
            <!-- <td>
              <n-space style="width: 70px" :size="4">
                <n-badge dot :type="item.result === 1 ? 'success' : 'error'"></n-badge>
                <n-text>匹配{{ item.result === 1 ? '成功' : '失败' }}</n-text>
              </n-space>
            </td> -->
          </tr>
        </tbody>
      </n-table>
    </n-timeline-item>
    <n-timeline-item v-show="filterShow" color="#97846c" :title="TimelineTitleLabels.FILTER">
      <n-space :size="18" vertical>
        <n-text depth="3">{{ editorT('bigscreenEditor.ui.byDefaultFilterProcessesDataFieldAPIResponse') }}</n-text>
        <chart-data-monaco-editor></chart-data-monaco-editor>
      </n-space>
    </n-timeline-item>
    <n-timeline-item type="success" :title="TimelineTitleLabels.CONTENT">
      <n-space vertical>
        <n-space class="source-btn-box">
          <n-button class="sourceBtn-item" :disabled="noData" @click="openOnlineEditHandle">
            <template #icon>
              <n-icon>
                <EditIcon />
              </n-icon>
            </template>
            {{ editorT('orgManage.common.edit') }}
          </n-button>
          <n-upload v-model:file-list="uploadFileListRef" :show-file-list="false" :customRequest="customRequest" @before-upload="beforeUpload">
            <n-space>
              <n-button v-if="!ajax" class="sourceBtn-item" :disabled="noData">
                <template #icon>
                  <n-icon>
                    <document-add-icon />
                  </n-icon>
                </template>
                {{ editorT('bigscreenEditor.ui.importJSONTXT') }}
              </n-button>
            </n-space>
          </n-upload>
          <div>
            <n-button class="sourceBtn-item" :disabled="noData" @click="download">
              <template #icon>
                <n-icon>
                  <document-download-icon />
                </n-icon>
              </template>
              {{ editorT('aiChat.ui.download') }}
            </n-button>
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-icon class="go-ml-1" size="21" :depth="3">
                  <help-outline-icon></help-outline-icon>
                </n-icon>
              </template>
              <span>{{ editorT('bigscreenEditor.ui.clickDownloadViewCompleteData') }}</span>
            </n-tooltip>
          </div>
        </n-space>
        <n-card size="small">
          <n-code :code="toString(source)" language="json"></n-code>
        </n-card>
      </n-space>
    </n-timeline-item>
  </n-timeline>
  <!-- 编辑数据 -->
  <n-modal
    class="go-online-edit go-background-filter"
    :title="editorT('bigscreenEditor.ui.editComponentDataOnline') + targetData.chartConfig.title"
    preset="card"
    size="small"
    style="width: 800px"
    v-model:show="showRef"
    transform-origin="center"
    :mask-closable="false"
    :bordered="true"
    @afterLeave="closeOlineEditHandle"
    content-style="padding: 0;"
  >
    <n-divider style="margin: 4px 0 10px" />
    <monaco-editor v-model:modelValue="editorCode" height="70vh" :language="targetData.chartConfig.chartKey === 'VHtmlCommon' ? 'html' : 'json'" />
    <template #action>
      <n-space justify="space-between">
        <div class="go-flex-items-center">
          <n-tag :bordered="false" type="primary" style="border-radius: 5px">
            <template #icon>
              <n-icon :component="DocumentTextIcon" />
            </template>
            {{ editorT('iotApp.ota.moduleDesc') }}
          </n-tag>
          <n-space :wrap-item="false" vertical>
            <n-text class="go-ml-2" depth="3" style="font-size: 1">
              {{ editorT('bigscreenEditor.ui.1FormatCode') }}
              <n-tag :bordered="false" type="warning" style="font-size: 12px">( shift + alt + f ) </n-tag>
              <n-divider vertical />
              <n-tag :bordered="false" type="warning" style="font-size: 12px">{{ editorT('bigscreenEditor.ui.rightClickFormatDocument') }}</n-tag>
            </n-text>
            <n-text class="go-ml-2" depth="3" style="font-size: 1; text-align: left"> {{ editorT('bigscreenEditor.ui.2EncloseStringsDoubleQuotesAvoidErrors') }} </n-text>
          </n-space>
        </div>
        <n-space>
          <n-button class="go-px-4" :focusable="false" @click="closeOlineEditHandle">{{ editorT('orgManage.common.cancel') }}</n-button>
          <n-button class="go-px-4" type="primary" @click="saveOlineEditHandle"> {{ editorT('orgManage.common.save') }} </n-button>
        </n-space>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { ref, computed, watch } from 'vue';
import { ChartFrameEnum } from '@/packages/index.type';
import { RequestDataTypeEnum } from '@/enums/httpEnum';
import { icon } from '@/plugins';
import { DataResultEnum, TimelineTitleLabels } from '../../index.type';
import SingleValueFieldMapper from './SingleValueFieldMapper.vue';
import { ChartDataMonacoEditor } from '../ChartDataMonacoEditor';
import CompositeFieldMapper from './CompositeFieldMapper.vue';
import { useFile } from '../../hooks/useFile.hooks';
import { useTargetData } from '../../../hooks/useTargetData.hook';
import { toString, isArray, goDialog } from '@/utils';
import { isCustomComponent } from '../../../../utils/isCustomComponent';
// @ts-ignore
import MonacoEditor from '@/components/Pages/MonacoEditor/index.vue';

const { targetData } = useTargetData();
defineProps({
  show: {
    type: Boolean,
    required: false,
  },
  ajax: {
    type: Boolean,
    required: true,
  },
  hideCompositeMapper: {
    type: Boolean,
    required: false,
    default: false,
  },
});

// 表格标题
const tableTitle = [editorT('orgManage.flow.fieldCol'), editorT('iotApp.schemaForm.mapping'), editorT('orgManage.common.status')];
const vchartTableTitle = [editorT('orgManage.flow.fieldCol'), editorT('bigscreenEditor.ui.apiMappingFields')];

const { HelpOutlineIcon, DocumentTextIcon } = icon.ionicons5;
const { DocumentAddIcon, DocumentDownloadIcon, EditIcon } = icon.carbon;

const source = ref();
const dimensions = ref();
const dimensionsAndSource = ref();
const noData = ref(false);
const showRef = ref(false);
// 编辑的代码
const editorCode = ref('');

// 映射列表, 注意内部的mapping是响应式的，上方需要修改
const fieldList = ref<
  Array<{
    field: string;
    mapping: string[];
    result: DataResultEnum;
  }>
>([]);

const { uploadFileListRef, customRequest, beforeUpload, download } = useFile(targetData);

// 是否展示过滤器
const filterShow = computed(() => {
  return targetData.value.request.requestDataType !== RequestDataTypeEnum.STATIC;
});

// 是支持 dataset 的图表类型（COMPOSITE 内部也是 ECharts，同样支持）
const isCharts = computed(() => {
  const frame = targetData.value.chartConfig.chartFrame;
  return frame === ChartFrameEnum.ECHARTS || frame === ChartFrameEnum.COMPOSITE;
});
// 是复合组件（使用专属字段映射器）
const isComposite = computed(() => targetData.value?.chartConfig?.chartFrame === ChartFrameEnum.COMPOSITE);
// IoT 复合组件：无需等待 dataset，只要选了 dataIDs 就显示字段映射器
const isIoTReady = computed(() => {
  if (targetData.value.request.requestDataType !== RequestDataTypeEnum.IoTDevice) return false;

  const iotCfg = targetData.value.request.requestIoTDeviceConfig;
  const queryType = iotCfg?.queryType ?? 'property';

  if (queryType === 'property') {
    return (iotCfg?.dataIDs?.length ?? 0) > 0;
  }

  if (queryType === 'deviceInfo') {
    return Boolean(iotCfg?.productID && (iotCfg?.deviceNames?.length ?? 0) > 0);
  }

  return Boolean(iotCfg?.productID);
});
// ??????/??????? SimplifiedDataPanel?
const isCustom = computed(() => isCustomComponent(targetData.value));
// ???????????IoT / AJAX / Pond?
const isDynamicData = computed(() => {
  const dt = targetData.value.request.requestDataType;
  return dt === RequestDataTypeEnum.IoTDevice || dt === RequestDataTypeEnum.AJAX || dt === RequestDataTypeEnum.Pond;
});
const isSingleValueMappingTarget = computed(() => {
  const key = targetData.value?.chartConfig?.chartKey ?? '';
  return ['VTextCommon', 'VFlipperNumber', 'VNumber', 'VPieCircle', 'VProcess', 'VWaterPolo', 'VDial', 'VCountDown'].includes(key);
});
// ?? CompositeFieldMapper ????
// 1. COMPOSITE ????
// 2. SimplifiedDataPanel ????? ECharts + ????
// 3. IoT ???????????????????? CompositeFieldMapper?
const showCompositeMapper = computed(
  () =>
    !isSingleValueMappingTarget.value &&
    (isComposite.value ||
      (isCharts.value && isCustom.value && isDynamicData.value) ||
      (isCharts.value && targetData.value.request.requestDataType === RequestDataTypeEnum.IoTDevice)),
);
// ???? vchart ?????
const isVChart = computed(() => {
  return targetData.value.chartConfig.chartFrame === ChartFrameEnum.VCHART;
});

const matchingHandle = (mapping: string) => {
  let res = DataResultEnum.SUCCESS;
  for (let i = 0; i < source.value.length; i++) {
    if (source.value[i][mapping] === undefined) {
      res = DataResultEnum.FAILURE;
      return res;
    }
  }
  return DataResultEnum.SUCCESS;
};

// 处理映射列表
const dimensionsAndSourceHandle = () => {
  try {
    // 去除首项数据轴标识
    return dimensions.value.map((dimensionsItem: string, index: number) => {
      return index === 0
        ? {
            // 字段
            /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get field() { return editorT('bigscreenEditor.ui.standardIdentifier'); },
            // 映射
            mapping: dimensionsItem,
            // 结果
            result: DataResultEnum.NULL,
          }
        : {
            field: editorT('bigscreenEditor.dynamic.message17', { index: String(index) }),
            mapping: dimensionsItem,
            result: matchingHandle(dimensionsItem),
          };
    });
  } catch (error) {
    return [];
  }
};

// 处理 vchart 映射列表
const initFieldListHandle = () => {
  if (targetData.value?.option) {
    fieldList.value = [];
    // 所有名称，找到其中中 Field 结尾 的 key 和值
    for (const key in targetData.value.option) {
      if (key.endsWith('Field')) {
        const value = targetData.value.option[key];
        targetData.value.option[key] = value;
        const item = {
          field: key,
          mapping: value,
          result: DataResultEnum.SUCCESS,
        };
        if (item.mapping === undefined) {
          item.result = DataResultEnum.FAILURE;
        }
        fieldList.value.push(item);
      }
    }
  }
};

// 打开在线编辑
const openOnlineEditHandle = () => {
  showRef.value = true;
  if (targetData.value.chartConfig.chartKey !== 'VHtmlCommon') {
    editorCode.value = JSON.stringify(source.value, null, 2);
  } else {
    editorCode.value = source.value;
  }
};

// 取消在线编辑
const closeOlineEditHandle = () => {
  showRef.value = false;
};

// 取消在线编辑
const saveOlineEditHandle = () => {
  // 设置（COMPOSITE 的 dataset 存于 option.chartOption.dataset）
  const setDataHandle = (newData: any) => {
    if (targetData.value?.chartConfig?.chartFrame === ChartFrameEnum.COMPOSITE) {
      targetData.value.option.chartOption.dataset = newData;
    } else {
      targetData.value.option.dataset = newData;
    }
  };
  goDialog({
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get message() { return editorT('bigscreenEditor.ui.saveEditedData'); },
    onPositiveCallback: () => {
      try {
        let jsonData = editorCode.value;
        if (targetData.value.chartConfig.chartKey !== 'VHtmlCommon') {
          jsonData = JSON.parse(jsonData);
        }
        if (typeof jsonData !== typeof source.value) {
          goDialog({
            /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get message() { return editorT('bigscreenEditor.ui.newDataTypeDiffersFromOriginalApplyData'); },
            onPositiveCallback: () => {
              try {
                setDataHandle(jsonData);
                editorCode.value = '';
                window['$message'].success(editorT('orgManage.orgSettings.saveSuccess'));
                closeOlineEditHandle();
              } catch (error) {
                window['$message'].error(editorT('bigscreenEditor.ui.couldNotApplyContentCheckItsFormat'));
              }
            },
          });
        } else {
          try {
            setDataHandle(jsonData);
            editorCode.value = '';
            window['$message'].success(editorT('orgManage.orgSettings.saveSuccess'));
            closeOlineEditHandle();
          } catch (error) {
            window['$message'].error(editorT('bigscreenEditor.ui.couldNotApplyContentCheckItsFormat'));
          }
        }
      } catch (error) {
        console.log(error);
        window['$message'].error(editorT('bigscreenEditor.ui.couldNotApplyContentCheckItsFormat'));
      }
    },
  });
};

watch(
  () => {
    const frame = targetData.value?.chartConfig?.chartFrame;
    if (frame === ChartFrameEnum.COMPOSITE) {
      // BorderDualChart 用 option.dataset 存储，其他复合组件用 option.chartOption.dataset
      if (targetData.value?.chartConfig?.chartKey === 'VBorderDualChart') {
        return targetData.value?.option?.dataset;
      }
      return targetData.value?.option?.chartOption?.dataset;
    }
    return targetData.value?.option?.dataset;
  },
  (
    newData?: {
      source: any;
      dimensions: any;
    } | null,
  ) => {
    noData.value = false;
    if (newData && targetData?.value?.chartConfig?.chartFrame === ChartFrameEnum.COMPOSITE) {
      // 复合组件内部是 ECharts，按 ECharts dataset 处理
      source.value = newData;
      if (isCharts.value) {
        dimensions.value = newData.dimensions;
        dimensionsAndSource.value = dimensionsAndSourceHandle();
      }
    } else if (newData && targetData?.value?.chartConfig?.chartFrame === ChartFrameEnum.ECHARTS) {
      // 只有 DataSet 数据才有对应的格式
      source.value = newData;
      if (isCharts.value) {
        dimensions.value = newData.dimensions;
        dimensionsAndSource.value = dimensionsAndSourceHandle();
      }
    } else if (newData && targetData?.value?.chartConfig?.chartFrame === ChartFrameEnum.VCHART) {
      source.value = newData;
      initFieldListHandle();
    } else if (newData !== undefined && newData !== null) {
      dimensionsAndSource.value = null;
      source.value = newData;
      fieldList.value = [];
    } else {
      noData.value = true;
      source.value = editorT('bigscreenEditor.ui.thisComponentHasNoDataSource');
    }
    if (isArray(newData)) {
      dimensionsAndSource.value = null;
    }
  },
  {
    immediate: true,
  },
);
</script>

<style lang="scss" scoped>
@include go('chart-configurations-timeline') {
  @include deep() {
    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  }
  .source-btn-box {
    margin-top: 10px !important;
  }
}
</style>
