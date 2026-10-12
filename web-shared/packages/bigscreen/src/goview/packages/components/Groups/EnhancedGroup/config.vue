<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PropType } from 'vue'
import { computed } from 'vue'
import { CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting'
import { borderTypeOptions, borderDefaultOptions, titlePositionOptions, fontWeightOptions } from '../../Decorates/BorderCharts/borderConstants'
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore'

const props = defineProps({
  optionData: {
    type: Object as PropType<any>,
    required: true,
  },
})

const chartEditStore = useChartEditStore()

// 当前选中 Group 的数据
const currentGroup = computed(() => {
  const selectId = chartEditStore.getTargetChart.selectId
  if (!selectId.length) return null
  const target = chartEditStore.getComponentList.find(e => e.id === selectId[0])
  if (!target?.isGroup) return null
  return target as any
})

// 当前选中 Group 的 groupList
const groupList = computed(() => {
  return currentGroup.value?.groupList || []
})

// 当前 Group ID
const groupId = computed(() => currentGroup.value?.id || '')

// 容器类型选项
const containerTypeOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('iotApp.card.overageNone'); }, value: 'none' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentBorderContainer'); }, value: 'border' },
]

const ensureGroupBorderShellLayout = (borderKey: string) => {
  const group = currentGroup.value
  if (!group?.isGroup) return

  const designWidth = group.option?.designWidth ?? group.attr.w
  const designHeight = group.option?.designHeight ?? group.attr.h
  const currentPadding = group.option?.padding ?? 0
  const targetPadding = Math.max(currentPadding, 24)
  const targetTitleReserve = borderKey === 'Border04' ? (group.option?.borderOption?.borderTitleHeight ?? 32) : 0

  const hasShell = designWidth !== group.attr.w || designHeight !== group.attr.h
  const currentTitleReserve = hasShell ? Math.max(group.attr.h - designHeight - currentPadding * 2, 0) : 0

  if (!hasShell) {
    group.attr.x -= targetPadding
    group.attr.y -= targetPadding + targetTitleReserve
    group.attr.w += targetPadding * 2
    group.attr.h += targetPadding * 2 + targetTitleReserve
    group.option.padding = targetPadding
    group.option.designWidth = designWidth
    group.option.designHeight = designHeight
    return
  }

  const extraPadding = Math.max(targetPadding - currentPadding, 0)
  const extraTitleReserve = Math.max(targetTitleReserve - currentTitleReserve, 0)
  if (extraPadding <= 0 && extraTitleReserve <= 0) return

  group.attr.x -= extraPadding
  group.attr.y -= extraPadding + extraTitleReserve
  group.attr.w += extraPadding * 2
  group.attr.h += extraPadding * 2 + extraTitleReserve
  group.option.padding = currentPadding + extraPadding
}

// 当前边框选项
const currentBorderOption = computed(() => props.optionData.borderOption || {})

// 是否为 Border04（Border04 使用扁平字符串标题格式）
const isBorder04 = computed(() => props.optionData.borderKey === 'Border04')

// 标题配置
const titleOption = computed({
  get: () => {
    const borderOpt = props.optionData.borderOption || {}
    const borderTitle = borderOpt.borderTitle
    if (!borderTitle || typeof borderTitle !== 'object') {
      return {
        show: false,
        text: '',
        position: 'center',
        fontSize: 18,
        fontColor: '#fff',
        fontWeight: 'normal',
        letterSpacing: 0,
        top: 20,
        sideOffset: 20,
      }
    }
    return borderTitle
  },
  set: (val) => {
    props.optionData.borderOption = props.optionData.borderOption || {}
    props.optionData.borderOption.borderTitle = val
  }
})

// 容器类型切换
const defaultTitleOption = {
  show: false,
  text: '',
  position: 'center',
  fontSize: 18,
  fontColor: '#fff',
  fontWeight: 'normal',
  letterSpacing: 0,
  top: 20,
  sideOffset: 20,
}

// 容器类型切换
const onContainerTypeChange = (val: string) => {
  if (val === 'border') {
    // 自动设置默认边框
    const defaults = borderDefaultOptions['Border01']
    if (defaults) {
      props.optionData.borderKey = 'Border01'
      props.optionData.borderOption = { ...defaults(), borderTitle: { ...defaultTitleOption } }
      ensureGroupBorderShellLayout('Border01')
    }
  } else {
    // 清除边框配置
    props.optionData.borderKey = undefined
    props.optionData.borderOption = {}
  }
}

// 边框类型切换
const onBorderTypeChange = (newKey: string) => {
  const defaults = borderDefaultOptions[newKey]
  if (!defaults) return
  props.optionData.borderKey = newKey
  const newDefaults = defaults()
  const existingTitle = props.optionData.borderOption?.borderTitle

  if (newKey === 'Border04') {
    // → Border04：将对象格式标题转为字符串
    const text = (typeof existingTitle === 'object' && existingTitle?.text) || ''
    props.optionData.borderOption = { ...newDefaults, borderTitle: text }
  } else {
    // → 其他边框：将字符串格式标题转为对象
    const titleObj = (typeof existingTitle === 'object' && existingTitle)
      ? existingTitle
      : { ...defaultTitleOption, text: typeof existingTitle === 'string' ? existingTitle : '' }
    props.optionData.borderOption = { ...newDefaults, borderTitle: titleObj }
  }
  ensureGroupBorderShellLayout(newKey)
}

// 子组件操作
const handleMoveUp = (childId: string) => {
  chartEditStore.moveGroupChild(groupId.value, childId, 'up')
}

const handleMoveDown = (childId: string) => {
  chartEditStore.moveGroupChild(groupId.value, childId, 'down')
}

const handleDelete = (childId: string) => {
  chartEditStore.removeGroupChild(groupId.value, childId)
}
</script>

<template>
  <!-- 容器配置 -->
  <CollapseItem :name="editorT('bigscreenEditor.ui.container')" :expanded="true">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentContainerType')">
      <SettingItem :name="editorT('orgManage.role.type')">
        <n-select
          v-model:value="optionData.containerType"
          size="small"
          :options="containerTypeOptions"
          @update:value="onContainerTypeChange"
        />
      </SettingItem>
    </SettingItemBox>

    <!-- 边框容器配置 -->
    <template v-if="optionData.containerType === 'border'">
      <SettingItemBox :name="editorT('bigscreenEditor.ui.componentBorderStyle')">
        <SettingItem :name="editorT('orgManage.role.type')">
          <n-select
            v-model:value="optionData.borderKey"
            size="small"
            :options="borderTypeOptions"
            @update:value="onBorderTypeChange"
          />
        </SettingItem>
      </SettingItemBox>

      <!-- 内边距 -->
      <SettingItemBox :name="editorT('bigscreenEditor.ui.componentPaddingPx')">
        <SettingItem>
          <n-slider
            v-model:value="optionData.padding"
            :min="0"
            :max="40"
            :step="2"
          />
        </SettingItem>
        <SettingItem>
          <n-input-number
            v-model:value="optionData.padding"
            size="small"
            :min="0"
            :max="40"
          />
        </SettingItem>
      </SettingItemBox>

      <!-- 边框颜色 -->
      <SettingItemBox
        v-for="(color, idx) in currentBorderOption.colors"
        :key="idx"
        :name="editorT('bigscreenEditor.dynamic.colorNumber', { index: String(idx + 1) })"
      >
        <SettingItem :name="editorT('orgManage.flow.fwColor')">
          <n-color-picker
            size="small"
            :modes="['hex']"
            v-model:value="optionData.borderOption.colors[idx]"
          />
        </SettingItem>
      </SettingItemBox>

      <!-- 动画速度 -->
      <SettingItemBox v-if="currentBorderOption.dur !== undefined" :name="editorT('bigscreenEditor.ui.componentAnimationSpeedS')">
        <SettingItem>
          <n-input-number
            v-model:value="optionData.borderOption.dur"
            size="small"
            :step="0.5"
            :min="0.5"
          />
        </SettingItem>
      </SettingItemBox>

      <!-- 背景色 -->
      <SettingItemBox :name="editorT('bigscreenEditor.ui.componentBackgroundColor')">
        <SettingItem>
          <n-color-picker
            v-model:value="optionData.borderOption.backgroundColor"
            size="small"
            :modes="['hex']"
          />
        </SettingItem>
      </SettingItemBox>

      <!-- 标题配置（非 Border04：对象格式） -->
      <CollapseItem v-if="!isBorder04" :name="editorT('orgManage.approve.colTitle')" :expanded="false">
        <SettingItemBox :name="editorT('bigscreenEditor.ui.componentBasic')">
          <SettingItem>
            <n-space>
              <n-switch v-model:value="titleOption.show" size="small" />
              <n-text>{{ editorT('bigscreenEditor.ui.componentShowTitle') }}</n-text>
            </n-space>
          </SettingItem>
          <SettingItem :name="editorT('bigscreenEditor.ui.componentTitleText')">
            <n-input v-model:value="titleOption.text" size="small" :placeholder="editorT('orgPark.ui.enterTitle')" />
          </SettingItem>
          <SettingItem :name="editorT('iotApp.devicePage.location')">
            <n-select
              v-model:value="titleOption.position"
              size="small"
              :options="titlePositionOptions"
            />
          </SettingItem>
        </SettingItemBox>

        <SettingItemBox :name="editorT('bigscreenEditor.ui.componentTextStyle')">
          <SettingItem :name="editorT('bigscreenEditor.ui.componentFontSize2')">
            <n-input-number
              v-model:value="titleOption.fontSize"
              size="small"
              :min="12"
              :max="36"
              :step="1"
            />
          </SettingItem>
          <SettingItem :name="editorT('orgManage.flow.fwColor')">
            <n-color-picker
              v-model:value="titleOption.fontColor"
              size="small"
              :modes="['hex']"
            />
          </SettingItem>
          <SettingItem :name="editorT('bigscreenEditor.ui.componentFontWeight2')">
            <n-select
              v-model:value="titleOption.fontWeight"
              size="small"
              :options="fontWeightOptions"
            />
          </SettingItem>
          <SettingItem :name="editorT('bigscreenEditor.ui.componentLetterSpacing2')">
            <n-input-number
              v-model:value="titleOption.letterSpacing"
              size="small"
              :min="0"
              :max="10"
              :step="0.5"
            />
          </SettingItem>
        </SettingItemBox>

        <SettingItemBox :name="editorT('bigscreenEditor.ui.componentPositionAdjustment')">
          <SettingItem :name="editorT('bigscreenEditor.ui.componentDistanceFromTopPx')">
            <n-input-number
              v-model:value="titleOption.top"
              size="small"
              :min="0"
              :max="100"
              :step="1"
            />
          </SettingItem>
          <SettingItem v-if="titleOption.position !== 'center'" :name="editorT('bigscreenEditor.ui.componentMarginPx')">
            <n-input-number
              v-model:value="titleOption.sideOffset"
              size="small"
              :min="0"
              :max="100"
              :step="1"
            />
          </SettingItem>
        </SettingItemBox>
      </CollapseItem>

      <!-- Border04 标题属性（直接内嵌在容器区，不单独折叠） -->
      <template v-if="isBorder04">
        <SettingItemBox :name="editorT('bigscreenEditor.ui.componentTitleText')">
          <SettingItem>
            <n-input
              v-model:value="optionData.borderOption.borderTitle"
              size="small"
              :placeholder="editorT('orgPark.ui.enterTitle')"
            />
          </SettingItem>
        </SettingItemBox>
        <SettingItemBox :name="editorT('bigscreenEditor.ui.componentTitleStyle')">
          <SettingItem :name="editorT('orgManage.flow.fwColor')">
            <n-color-picker
              v-model:value="optionData.borderOption.borderTitleColor"
              size="small"
              :modes="['hex']"
            />
          </SettingItem>
          <SettingItem :name="editorT('bigscreenEditor.ui.componentFontSize2')">
            <n-input-number
              v-model:value="optionData.borderOption.borderTitleSize"
              size="small"
              :min="12"
            />
          </SettingItem>
          <SettingItem :name="editorT('bigscreenEditor.ui.componentTitleHeight')">
            <n-input-number
              v-model:value="optionData.borderOption.borderTitleHeight"
              size="small"
              :min="24"
            />
          </SettingItem>
          <SettingItem :name="editorT('bigscreenEditor.ui.componentTitleWidth')">
            <n-input-number
              v-model:value="optionData.borderOption.borderTitleWidth"
              size="small"
              :min="50"
              :step="10"
            />
          </SettingItem>
        </SettingItemBox>
      </template>
    </template>
  </CollapseItem>

  <!-- 子组件列表 -->
  <CollapseItem :name="editorT('bigscreenEditor.ui.componentChildComponent')" :expanded="false" v-if="groupList.length > 0">
    <div class="child-list">
      <div
        v-for="item in groupList"
        :key="item.id"
        class="child-item"
      >
        <span class="child-name">{{ item.chartConfig?.title || item.key || editorT('orgManage.flow.unnamed') }}</span>
        <n-button-group size="tiny">
          <n-button @click="handleMoveUp(item.id)" :disabled="groupList[0]?.id === item.id">↑</n-button>
          <n-button @click="handleMoveDown(item.id)" :disabled="groupList[groupList.length - 1]?.id === item.id">↓</n-button>
          <n-button @click="handleDelete(item.id)">✕</n-button>
        </n-button-group>
      </div>
    </div>
  </CollapseItem>
</template>

<style lang="scss" scoped>
.child-list {
  padding: 8px;
}
.child-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  margin-bottom: 4px;
  background: var(--n-color-hover);
  border-radius: 4px;
}
.child-name {
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 150px;
}
</style>
