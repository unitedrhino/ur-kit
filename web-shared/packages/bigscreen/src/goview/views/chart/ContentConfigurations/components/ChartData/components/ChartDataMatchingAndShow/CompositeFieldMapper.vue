<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <n-table striped>
    <thead>
      <tr>
        <th>{{ editorT('orgManage.user.role') }}</th>
        <th>{{ editorT('orgManage.flow.fieldCol') }}</th>
      </tr>
    </thead>
    <tbody>
      <template v-if="isBarOrLine">
        <tr>
          <td>{{ isHorizontalBar ? editorT('bigscreenEditor.ui.categoryFieldYAxis') : editorT('bigscreenEditor.ui.categoryFieldXAxis') }}</td>
          <td>
            <n-select
              v-model:value="dims[0]"
              :options="categoryFieldOptions"
              size="small"
              :placeholder="editorT('orgManage.cloneGroup.selectField')"
              @update:value="onDimChange"
            />
          </td>
        </tr>
        <tr v-for="(_, i) in seriesCount" :key="i">
          <td>{{ isHorizontalBar ? editorT('bigscreenEditor.dynamic.message15', { index: String(i + 1) }) : editorT('bigscreenEditor.dynamic.message16', { index: String(i + 1) }) }}</td>
          <td>
            <n-select
              v-model:value="dims[i + 1]"
              :options="valueFieldOptions"
              size="small"
              :placeholder="editorT('orgManage.cloneGroup.selectField')"
              @update:value="onDimChange"
            />
          </td>
        </tr>
      </template>

      <template v-else-if="isDualChart">
        <tr>
          <td>{{ editorT('bigscreenEditor.ui.topCharts') }}</td>
          <td>
            <n-select
              v-model:value="dualFieldMapping.topField"
              :options="dualNameOptions"
              size="small"
              :placeholder="editorT('bigscreenEditor.ui.selectMetric')"
              @update:value="onDualFieldChange"
            />
          </td>
        </tr>
        <tr>
          <td>{{ editorT('bigscreenEditor.ui.bottomCharts') }}</td>
          <td>
            <n-select
              v-model:value="dualFieldMapping.bottomField"
              :options="dualNameOptions"
              size="small"
              :placeholder="editorT('bigscreenEditor.ui.selectMetric')"
              @update:value="onDualFieldChange"
            />
          </td>
        </tr>
      </template>

      <template v-else-if="isPie">
        <tr>
          <td>{{ editorT('bigscreenEditor.ui.nameField') }}</td>
          <td>
            <n-select
              v-model:value="pieNameField"
              :options="categoryFieldOptions.length > 0 ? categoryFieldOptions : fieldOptions"
              size="small"
              :placeholder="editorT('orgManage.cloneGroup.selectField')"
              @update:value="onPieChange"
            />
          </td>
        </tr>
        <tr>
          <td>{{ editorT('bigscreenEditor.ui.valueField') }}</td>
          <td>
            <n-select
              v-model:value="pieValueField"
              :options="valueFieldOptions.length > 0 ? valueFieldOptions : fieldOptions"
              size="small"
              :placeholder="editorT('orgManage.cloneGroup.selectField')"
              @update:value="onPieChange"
            />
          </td>
        </tr>
      </template>
    </tbody>
  </n-table>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { computed, reactive, ref, watch } from 'vue'
import { RequestDataTypeEnum } from '@/enums/httpEnum'
import { buildColumnName } from '../../../SimplifiedDataPanel/adapters/iotSeriesParser'

const props = defineProps({
  chartKey: {
    type: String,
    required: true,
  },
  chartOption: {
    type: Object,
    required: true,
  },
  requestDataType: {
    type: Number,
    default: undefined,
  },
  iotDeviceConfig: {
    type: Object,
    default: undefined,
  },
})

// 标准化 chartKey：去掉 V 前缀统一比较（COMPOSITE 子组件无前缀，普通 ECharts 有 V 前缀）
const normalizedKey = computed(() => {
  const k = props.chartKey ?? ''
  return k.startsWith('V') ? k.slice(1) : k
})

const isBarOrLine = computed(() =>
  ['BarCommon', 'BarCrossrange', 'BarLine', 'LineCommon', 'LineGradients',
   'LineGradientSingle', 'LineLinearSingle', 'ScatterCommon', 'ScatterLogarithmicRegression'
  ].includes(normalizedKey.value)
)
const isPie = computed(() => ['PieCommon', 'PieCircle'].includes(normalizedKey.value))
const isDualChart = computed(() => props.chartKey === 'VBorderDualChart')
const isHorizontalBar = computed(() => normalizedKey.value === 'BarCrossrange')

/** 推导 dataView：优先用旧字段，无则从 deviceNames/dataIDs 数量推导 */
function resolveDataView(cfg?: any): string {
  const c = cfg ?? props.iotDeviceConfig
  if (c?.queryType === 'deviceInfo') return 'deviceInfo'
  if (c?.queryType === 'deviceStatus') return 'deviceStatus'
  if (c?.dataView) return c.dataView
  return (c?.deviceNames?.length ?? 0) > 1 ? 'device' : 'prop'
}

function getIoTDeviceStatusResolvedKeys(cfg: any): string[] {
  const datasetKeys = getDatasetKeys(false)
  if (cfg?.outputView === 'fields') {
    return datasetKeys.length > 0
      ? datasetKeys
      : (cfg?.selectedFields ?? ['totalCount', 'onlineCount', 'offlineCount', 'inactiveCount', 'onlineRate', 'offlineRate', 'inactiveRate'])
  }
  return ['status', 'count']
}

const getSourceKeys = (): string[] => {
  const source = props.chartOption?.dataset?.source
  if (Array.isArray(source) && source.length > 0 && source[0] && typeof source[0] === 'object') {
    return Object.keys(source[0])
  }

  return []
}

const getDimensionKeys = (): string[] => {
  const dimensions = props.chartOption?.dataset?.dimensions
  if (Array.isArray(dimensions) && dimensions.length > 0) {
    return [...dimensions]
  }

  return []
}

const getDatasetKeys = (preferSource = false): string[] => {
  const sourceKeys = getSourceKeys()
  const dimensionKeys = getDimensionKeys()

  if (preferSource) {
    return sourceKeys.length > 0 ? sourceKeys : dimensionKeys
  }

  return dimensionKeys.length > 0 ? dimensionKeys : sourceKeys
}

const isIotLogBarLine = computed(() =>
  isBarOrLine.value &&
  props.requestDataType === RequestDataTypeEnum.IoTDevice &&
  props.iotDeviceConfig?.mode === 'log'
)

const getIotLogResolvedKeys = (): string[] => {
  if (!props.iotDeviceConfig) return []

  const cfg = props.iotDeviceConfig as any
  const view = resolveDataView(cfg)
  const datasetKeys = getDatasetKeys(false)
  const timeKey = datasetKeys.find((key) => ['timeLabel', 'time', '时间', 'timestamp'].includes(key)) ?? 'time'
  const valueKeys = datasetKeys.filter((key) => !KNOWN_TIME_FIELDS.has(key) && key !== timeKey)

  if (valueKeys.length > 0) {
    return [timeKey, ...valueKeys]
  }

  if (view === 'prop') return ['time', ...(cfg.dataIDs ?? [])]
  if (view === 'device') {
    // 多属性：使用 buildColumnName 生成与 hook 一致的列名
    const dataIDs = cfg.dataIDs ?? []
    const devNames = cfg.deviceNames ?? []
    const devCount = devNames.length
    const propCount = dataIDs.length
    const nameMap = cfg.dataIDNames ?? {}
    if (propCount > 1 || (propCount === 1 && devCount > 1)) {
      const cols: string[] = []
      for (const dev of devNames) {
        for (const id of dataIDs) {
          cols.push(buildColumnName(dev, nameMap[id] || id, devCount, propCount))
        }
      }
      return ['time', ...cols]
    }
    return ['time', ...devNames]
  }
  return ['time', ...(cfg.aggFuncs ?? [])]
}

/** 已知的时间字段名，可作为分类字段但不作为数值字段 */
const KNOWN_TIME_FIELDS = new Set(['_timestamp', 'timeLabel', 'time', editorT('orgManage.pointLog.time')])

/** 分类字段（X 轴）：字符串类型 + 已知时间字段 */
const categoryFieldOptions = computed(() => {
  if (isIotLogBarLine.value) {
    const categoryKey = getIotLogResolvedKeys()[0]
    return categoryKey ? [{ label: categoryKey, value: categoryKey }] : []
  }

  if (props.requestDataType === RequestDataTypeEnum.IoTDevice && props.iotDeviceConfig) {
    const cfg = props.iotDeviceConfig as any
    if (resolveDataView(cfg) === 'deviceStatus' && cfg.outputView !== 'fields') {
      return [{ label: 'status', value: 'status' }]
    }
  }

  const firstRow = props.chartOption?.dataset?.source?.[0]
  if (!firstRow || typeof firstRow !== 'object') {
    // source 为空时：从 dimensions/fieldOptions 中排除已知数值字段名
    const KNOWN_VALUE_FIELDS = new Set(['value', 'data', 'count', 'total', 'amount'])
    return fieldOptions.value.filter(
      opt => !KNOWN_VALUE_FIELDS.has(opt.value as string) || KNOWN_TIME_FIELDS.has(opt.value as string)
    )
  }

  return Object.keys(firstRow)
    .filter(key => KNOWN_TIME_FIELDS.has(key) || typeof (firstRow as any)[key] === 'string')
    .map(key => ({ label: key, value: key }))
})

/** 数值字段（Y 轴）：数字类型，排除已知时间字段 */
const valueFieldOptions = computed(() => {
  if (isIotLogBarLine.value) {
    return getIotLogResolvedKeys()
      .slice(1)
      .map((key) => ({ label: key, value: key }))
  }

  if (props.requestDataType === RequestDataTypeEnum.IoTDevice && props.iotDeviceConfig) {
    const cfg = props.iotDeviceConfig as any
    if (resolveDataView(cfg) === 'deviceStatus' && cfg.outputView !== 'fields') {
      return [{ label: 'count', value: 'count' }]
    }
  }

  const firstRow = props.chartOption?.dataset?.source?.[0]
  if (!firstRow || typeof firstRow !== 'object') {
    // source 为空时：从 dimensions/fieldOptions 中排除已知分类字段名和时间字段
    const KNOWN_CATEGORY_FIELDS = new Set(['name', 'device', 'agg', 'product', 'category', 'label', 'type'])
    return fieldOptions.value.filter(
      opt => !KNOWN_CATEGORY_FIELDS.has(opt.value as string) && !KNOWN_TIME_FIELDS.has(opt.value as string)
    )
  }

  return Object.keys(firstRow)
    .filter(key => !KNOWN_TIME_FIELDS.has(key) && typeof (firstRow as any)[key] === 'number')
    .map(key => ({ label: key, value: key }))
})

const fieldOptions = computed(() => {
  if (props.requestDataType === RequestDataTypeEnum.IoTDevice && props.iotDeviceConfig) {
    const cfg = props.iotDeviceConfig as any
    const view = resolveDataView(cfg)
    const isLog = cfg.mode === 'log'
    const datasetKeys = isIotLogBarLine.value ? getIotLogResolvedKeys() : getDatasetKeys()
    const hasResolvedDataset = datasetKeys.length > 0

    let keys: string[]

    if (view === 'deviceInfo') {
      keys = getDatasetKeys(true).length > 0 ? getDatasetKeys(true) : (cfg.selectedFields ?? [])
    } else if (view === 'deviceStatus') {
      keys = getIoTDeviceStatusResolvedKeys(cfg)
    } else if (view === 'prop') {
      if (isLog) {
        keys = hasResolvedDataset ? datasetKeys : ['time', ...(cfg.dataIDs ?? [])]
      } else {
        if (isBarOrLine.value) {
          const actualKeys = getDatasetKeys(true)
          keys = actualKeys.length > 0 ? actualKeys : [editorT('orgManage.pointLog.time'), ...(cfg.dataIDs ?? [])]
        } else {
          keys = ['name', 'value']
        }
      }
    } else if (view === 'device') {
      keys = isLog
        ? (hasResolvedDataset ? datasetKeys : ['time', ...(cfg.deviceNames ?? [])])
        : (getDatasetKeys(true).length > 0 ? getDatasetKeys(true) : ['device', ...(cfg.dataIDs ?? [])])
    } else {
      keys = isLog
        ? (hasResolvedDataset ? datasetKeys : ['time', ...(cfg.aggFuncs ?? [])])
        : ['agg', cfg.dataID ?? ''].filter(Boolean)
    }

    return keys.map((key: string) => ({ label: key, value: key }))
  }

  return getDatasetKeys().map((key: string) => ({ label: key, value: key }))
})

const dims = ref<string[]>([])

/**
 * 用户是否通过下拉手动修改过字段映射（持久标记）
 * - onDimChange 设为 true → 后续 watch 全部跳过（不覆盖用户选择）
 * - 数据源配置变化（切换设备/属性/模式）时重置为 false → 允许 watch 重新初始化
 */
const userModifiedDims = ref(false)

// 数据源配置变化时重置用户修改标记
watch(
  () => [
    (props.iotDeviceConfig as any)?.dataIDs,
    (props.iotDeviceConfig as any)?.deviceNames,
    (props.iotDeviceConfig as any)?.deviceName,
    (props.iotDeviceConfig as any)?.dataID,
    (props.iotDeviceConfig as any)?.mode,
  ],
  () => { userModifiedDims.value = false },
  { deep: true },
)
const seriesCount = computed(() => {
  if (props.requestDataType === RequestDataTypeEnum.IoTDevice && props.iotDeviceConfig) {
    const cfg = props.iotDeviceConfig as any
    const view = resolveDataView(cfg)
    const isLog = cfg.mode === 'log'

    if (view === 'prop' && !isLog && isBarOrLine.value) {
      return Math.max(cfg.dataIDs?.length ?? 1, 1)
    }
    if (view === 'prop') return Math.max(cfg.dataIDs?.length ?? 1, 1)
    if (view === 'device' && !isLog) return Math.max(cfg.dataIDs?.length ?? 1, 1)
    if (!isLog) return 1
    if (view === 'device') return Math.max(getIotLogResolvedKeys().length - 1, 1)
    if (view === 'agg') return Math.max(cfg.aggFuncs?.length ?? 1, 1)
  }

  const series = props.chartOption?.series
  return Array.isArray(series) ? series.length : 1
})

const buildIotLogDims = (): string[] => {
  const resolvedKeys = getIotLogResolvedKeys()
  if (resolvedKeys.length === 0) return []

  // resolvedKeys 非空时首键必存在，此守卫仅为类型收窄
  const categoryKey = resolvedKeys[0]
  if (!categoryKey) return []

  const valueKeys = resolvedKeys.slice(1)
  const nextDims = [categoryKey]

  for (let index = 0; index < seriesCount.value; index += 1) {
    const currentValue = dims.value[index + 1]
    const fallbackValue = valueKeys[index] ?? valueKeys[valueKeys.length - 1] ?? ''
    // 维度缺失时 includes 判定必为 false，回落到值字段兜底，行为与原实现一致
    nextDims.push(currentValue !== undefined && valueKeys.includes(currentValue) ? currentValue : fallbackValue)
  }

  return nextDims
}

const syncSeriesByDims = (dimKeys: string[]) => {
  const series = props.chartOption?.series
  if (Array.isArray(series) && dimKeys.length >= 2) {
    series.forEach((item: any, index: number) => {
      const valueField = dimKeys[index + 1]
      item.encode = valueField
        ? (
            isHorizontalBar.value
              ? { x: valueField, y: dimKeys[0] }
              : { x: dimKeys[0], y: valueField }
          )
        : (
            isHorizontalBar.value
              ? { x: '', y: dimKeys[0] }
              : { x: dimKeys[0], y: '' }
          )
      item.name = valueField ?? ''
    })
  }
}

/** 同步类目轴 / 数值轴类型 */
function syncAxisTypes(categoryField: string) {
  const datasetDims = Array.isArray(props.chartOption?.dataset?.dimensions)
    ? props.chartOption.dataset.dimensions.map(String)
    : []
  const isIotLogCategoryAxis =
    props.requestDataType === RequestDataTypeEnum.IoTDevice
    && datasetDims.includes('timeLabel')
    && categoryField === 'timeLabel'

  const categoryAxisType = isIotLogCategoryAxis
    ? 'category'
    : KNOWN_TIME_FIELDS.has(categoryField) ? 'time' : 'category'

  const xAxisList = !props.chartOption?.xAxis
    ? []
    : (Array.isArray(props.chartOption.xAxis) ? props.chartOption.xAxis : [props.chartOption.xAxis])
  const yAxisList = !props.chartOption?.yAxis
    ? []
    : (Array.isArray(props.chartOption.yAxis) ? props.chartOption.yAxis : [props.chartOption.yAxis])

  if (isHorizontalBar.value) {
    xAxisList.forEach((axis: any) => {
      axis.type = 'value'
    })
    yAxisList.forEach((axis: any) => {
      axis.type = categoryAxisType
    })
    return
  }

  xAxisList.forEach((axis: any) => {
    axis.type = categoryAxisType
  })
  yAxisList.forEach((axis: any) => {
    if (!axis?.type || axis.type === 'category' || axis.type === 'time') {
      axis.type = 'value'
    }
  })
}

watch(
  [() => props.chartKey, () => props.chartOption?.dataset?.dimensions, () => props.chartOption?.dataset?.source, fieldOptions],
  () => {
    if (!isBarOrLine.value) return

    // 用户手动修改了字段映射 → 跳过（持久标记，直到数据源配置变化才重置）
    if (userModifiedDims.value) return

    if (props.requestDataType === RequestDataTypeEnum.IoTDevice && fieldOptions.value.length) {
      const iotKeys = isIotLogBarLine.value
        ? buildIotLogDims()
        : fieldOptions.value.map((option) => option.value as string)

      dims.value = [...iotKeys]

      const currentDims = props.chartOption?.dataset?.dimensions
      const alreadySet =
        Array.isArray(currentDims) &&
        currentDims.length === iotKeys.length &&
        currentDims.every((key: string, index: number) => key === iotKeys[index])

      if (!alreadySet && props.chartOption?.dataset) {
        props.chartOption.dataset = { ...props.chartOption.dataset, dimensions: [...iotKeys] }
      }

      syncSeriesByDims(iotKeys)
      syncAxisTypes(iotKeys[0] ?? '')
      writeBackMapping(iotKeys)

      return
    }

    const datasetDims = props.chartOption?.dataset?.dimensions
    dims.value = Array.isArray(datasetDims) ? [...datasetDims] : []
  },
  { immediate: true },
)

const onDimChange = () => {
  // 标记：用户手动修改了映射（持久，直到数据源配置变化才重置）
  userModifiedDims.value = true

  // 截断多余的隐藏维度，防止 ECharts 自动将其渲染为柱子
  const validLength = seriesCount.value + 1; // 1 个分类字段(X) + N 个数值字段(Y)
  const nextDims = isIotLogBarLine.value
    ? buildIotLogDims()
    : dims.value.slice(0, validLength);

  dims.value = [...nextDims];

  // 同步 series encode + xAxis.type
  if (!isPie.value) syncSeriesByDims(nextDims)
  syncAxisTypes(nextDims[0] ?? '')

  // 写回 mapping 确保轮询持久化
  writeBackMapping(nextDims)
}

/** 写回 cfg.mapping 确保轮询持久化 */
function writeBackMapping(nextDims: string[]) {
  if (props.requestDataType === RequestDataTypeEnum.IoTDevice && props.iotDeviceConfig) {
    (props.iotDeviceConfig as any).mapping = {
      mappingMode: 'xy',
      xField: nextDims[0],
      yFields: nextDims.slice(1),
    }
  }
}

const pieNameField = ref('')
const pieValueField = ref('')

watch(
  [() => props.chartKey, () => props.chartOption?.dataset?.dimensions, fieldOptions],
  () => {
    if (!isPie.value) return

    if (props.requestDataType === RequestDataTypeEnum.IoTDevice && fieldOptions.value.length) {
      const iotKeys = fieldOptions.value.map((option) => option.value as string)
      pieNameField.value = iotKeys[0] ?? ''
      pieValueField.value = iotKeys[1] ?? ''
      return
    }

    const dimsFromDataset = props.chartOption?.dataset?.dimensions
    pieNameField.value = Array.isArray(dimsFromDataset) && dimsFromDataset[0] ? dimsFromDataset[0] : ''
    pieValueField.value = Array.isArray(dimsFromDataset) && dimsFromDataset[1] ? dimsFromDataset[1] : ''
  },
  { immediate: true },
)

const onPieChange = () => {
  props.chartOption.dataset.dimensions = [pieNameField.value, pieValueField.value]

  const series = props.chartOption?.series?.[0]
  if (series) {
    series.encode = { itemName: pieNameField.value, value: pieValueField.value }
  }

  // IoT 数据源：写回 cfg.mapping 确保轮询持久化
  if (props.requestDataType === RequestDataTypeEnum.IoTDevice && props.iotDeviceConfig) {
    (props.iotDeviceConfig as any).mapping = {
      mappingMode: 'nameValue',
      nameField: pieNameField.value,
      valueField: pieValueField.value,
    }
  }
}

// ===== BorderDualChart 双图表字段映射 =====

// 下拉选项：从 source 的 name 列提取去重值，供用户选择要渲染哪个指标
const dualNameOptions = computed(() => {
  const source = props.chartOption?.dataset?.source
  if (Array.isArray(source) && source.length > 0) {
    const names = [...new Set(source.map((row: any) => row.name).filter(Boolean))]
    if (names.length > 0) {
      return names.map((name: string) => ({ label: name, value: name }))
    }
  }
  // 回退：显示 dimension keys
  const dims = props.chartOption?.dataset?.dimensions
  if (Array.isArray(dims) && dims.length > 0) {
    return dims.map((key: string) => ({ label: key, value: key }))
  }
  return []
})

const dualFieldMapping = reactive({
  topField: '',
  bottomField: '',
})

// 初始化：从 chartOption.fieldMapping 读取已有映射
watch(
  () => props.chartOption?.fieldMapping,
  (mapping) => {
    if (mapping) {
      dualFieldMapping.topField = mapping.topField || ''
      dualFieldMapping.bottomField = mapping.bottomField || ''
    }
  },
  { immediate: true }
)

const onDualFieldChange = () => {
  if (props.chartOption) {
    props.chartOption.fieldMapping = {
      topField: dualFieldMapping.topField,
      bottomField: dualFieldMapping.bottomField,
    }
  }
}
</script>
