<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <n-collapse-item :title="editorT('bigscreenEditor.ui.advancedEventConfiguration')" name="3">
    <template #header-extra>
      <n-button type="primary" tertiary size="small" @click.stop="showModal = true">
        <template #icon>
          <n-icon>
            <pencil-icon />
          </n-icon>
        </template>
        {{ editorT('orgManage.common.edit') }}
      </n-button>
    </template>
    <n-card class="collapse-show-box">
      <!-- 函数体 -->
      <div v-for="eventName in EventLife" :key="eventName">
        <p>
          <span class="func-annotate">// {{ EventLifeName[eventName] }}</span>
          <br />
          <span class="func-keyword">async {{ eventName }}</span> (e, components, echarts, node_modules) {
        </p>
        <p class="go-ml-4">
          <n-code :code="(targetData.events.advancedEvents || {})[eventName] || ''" language="typescript"></n-code>
        </p>
        <p>}<span>,</span></p>
      </div>
    </n-card>
  </n-collapse-item>

  <!-- 弹窗 -->
  <n-modal class="go-chart-data-monaco-editor" v-model:show="showModal" :mask-closable="false">
    <n-card :bordered="false" role="dialog" size="small" aria-modal="true" style="width: 1200px; height: 700px">
      <template #header>
        <n-space>
          <n-text>{{ editorT('bigscreenEditor.ui.advancedEventEditorSourceCode') }}</n-text>
        </n-space>
      </template>

      <template #header-extra> </template>

      <n-layout has-sider sider-placement="right">
        <n-layout style="height: 580px; padding-right: 20px">
          <n-tabs v-model:value="editTab" type="card" tab-style="min-width: 100px;">
            <!-- 提示 -->
            <template #suffix>
              <n-text class="tab-tip" type="warning">{{ editorT('bigscreenEditor.ui.tip') }} {{ EventLifeTip[editTab] }}</n-text>
            </template>
            <n-tab-pane
              v-for="(eventName, index) in EventLife"
              :key="index"
              :tab="`${EventLifeName[eventName]}-${eventName}`"
              :name="eventName"
            >
              <!-- 函数名称 -->
              <p class="go-pl-3">
                <span class="func-keyword">async function &nbsp;&nbsp;</span>
                <span class="func-keyNameWord">{{ eventName }}(e, components, echarts, node_modules)&nbsp;&nbsp;{</span>
              </p>
              <!-- 编辑主体 -->
              <monaco-editor v-model:modelValue="advancedEvents[eventName]" height="480px" language="javascript" />
              <!-- 函数结束 -->
              <p class="go-pl-3 func-keyNameWord">}</p>
            </n-tab-pane>
          </n-tabs>
        </n-layout>
        <n-layout-sider
          :collapsed-width="14"
          :width="340"
          show-trigger="bar"
          collapse-mode="transform"
          content-style="padding: 12px 12px 0px 12px;margin-left: 3px;"
        >
          <n-tabs default-value="1" justify-content="space-evenly" type="segment">
            <!-- 验证结果 -->
            <n-tab-pane :tab="editorT('bigscreenEditor.ui.validationResult')" name="1" size="small">
              <n-scrollbar trigger="none" style="max-height: 505px">
                <n-collapse class="go-px-3" arrow-placement="right" :default-expanded-names="[1, 2, 3]">
                  <template v-for="error in [validEvents()]" :key="error">
                    <n-collapse-item :title="editorT('bigscreenEditor.ui.errorFunction')" :name="1">
                      <n-text depth="3">{{ error.errorFn || editorT('bigscreenEditor.ui.noneAvailable') }}</n-text>
                    </n-collapse-item>
                    <n-collapse-item :title="editorT('iotApp.cardPollingError.colMessage')" :name="2">
                      <n-text depth="3">{{ error.name || editorT('bigscreenEditor.ui.noneAvailable') }}</n-text>
                    </n-collapse-item>
                    <n-collapse-item :title="editorT('bigscreenEditor.ui.stackTrace')" :name="3">
                      <n-text depth="3">{{ error.message || editorT('bigscreenEditor.ui.noneAvailable') }}</n-text>
                    </n-collapse-item>
                  </template>
                </n-collapse>
              </n-scrollbar>
            </n-tab-pane>
            <!-- 辅助说明 -->
            <n-tab-pane :tab="editorT('bigscreenEditor.ui.variableDescriptions')" name="2">
              <n-scrollbar trigger="none" style="max-height: 505px">
                <n-collapse class="go-px-3" arrow-placement="right" :default-expanded-names="[1, 2, 3, 4]">
                  <n-collapse-item title="e" :name="1">
                    <n-text depth="3">{{ editorT('bigscreenEditor.ui.parametersReceivedWhenCorrespondingLifecycleEventTriggered') }}</n-text>
                  </n-collapse-item>
                  <n-collapse-item title="this" :name="2">
                    <n-text depth="3">{{ editorT('bigscreenEditor.ui.chartComponentInstance') }}</n-text>
                    <br />
                    <n-tag class="go-m-1" v-for="prop in ['refs', 'setupState', 'ctx', 'props', '...']" :key="prop">{{
                      prop
                    }}</n-tag>
                  </n-collapse-item>
                  <n-collapse-item title="components" :name="3">
                    <n-text depth="3"
                      >{{ editorT('bigscreenEditor.ui.collectionAllDashboardComponentsComponentConfigurationIDCan') }}</n-text
                    >
                    <n-code :code="`{\n  [id]: component\n}`" language="typescript"></n-code>
                  </n-collapse-item>
                  <n-collapse-item title="node_modules" :name="4">
                    <n-text depth="3">{{ editorT('bigscreenEditor.ui.packageVariablesAvailableCodeEnvironment') }}</n-text>
                    <br />
                    <n-tag class="go-m-1" v-for="pkg in Object.keys(npmPkgs || {})" :key="pkg">{{ pkg }}</n-tag>
                  </n-collapse-item>
                </n-collapse>
              </n-scrollbar>
            </n-tab-pane>
            <!-- 介绍案例 -->
            <n-tab-pane :tab="editorT('bigscreenEditor.ui.exampleIntroduction')" name="3">
              <n-scrollbar trigger="none" style="max-height: 505px">
                <n-collapse arrow-placement="right">
                  <n-collapse-item
                    v-for="(item, index) in templateList"
                    :key="index"
                    :title="editorT('bigscreenEditor.dynamic.message40', { index: String(index + 1), description: String(item.description) })"
                    :name="index"
                  >
                    <n-code :code="item.code" language="typescript"></n-code>
                  </n-collapse-item>
                </n-collapse>
              </n-scrollbar>
            </n-tab-pane>
          </n-tabs>
        </n-layout-sider>
      </n-layout>

      <template #action>
        <n-space justify="space-between">
          <div class="go-flex-items-center">
            <n-tag :bordered="false" type="primary">
              <template #icon>
                <n-icon :component="DocumentTextIcon" />
              </template>
              {{ editorT('iotApp.ota.moduleDesc') }}
            </n-tag>
            <n-text class="go-ml-2" depth="2">{{ editorT('bigscreenEditor.ui.useProvidedParametersCustomizeChartTooltipsInteractionEvents') }}</n-text>
          </div>

          <n-space>
            <n-button size="medium" @click="closeEvents">{{ editorT('orgManage.common.cancel') }}</n-button>
            <n-button size="medium" type="primary" @click="saveEvents">{{ editorT('orgManage.common.save') }}</n-button>
          </n-space>
        </n-space>
      </template>
    </n-card>
  </n-modal>
</template>

<script lang="ts" setup>
import { $t as editorT } from '@vben/saas/locales';

import { ref, watch } from 'vue'
import { MonacoEditor } from '@/components/Pages/MonacoEditor'
import { useTargetData } from '../../../hooks/useTargetData.hook'
import { templateList } from './importTemplate'
import { npmPkgs } from '@/hooks'
import { icon } from '@/plugins'
import type { CreateComponentType } from '@/packages/index.type'
import { EventLife } from '@/enums/eventEnum'

const { targetData, chartEditStore } = useTargetData()
const { DocumentTextIcon, ChevronDownIcon, PencilIcon } = icon.ionicons5

const EventLifeName = {
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get [EventLife.VNODE_BEFORE_MOUNT]() { return editorT('bigscreenEditor.ui.beforeRendering'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get [EventLife.VNODE_MOUNTED]() { return editorT('bigscreenEditor.ui.afterRendering'); }
}

const EventLifeTip = {
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get [EventLife.VNODE_BEFORE_MOUNT]() { return editorT('bigscreenEditor.ui.componentDOMDoesNotYetExistAtThis'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get [EventLife.VNODE_MOUNTED]() { return editorT('bigscreenEditor.ui.componentDOMAlreadyExistsAtThisPoint'); }
}

// 受控弹窗
const showModal = ref(false)
// 编辑区域控制
const editTab = ref(EventLife.VNODE_MOUNTED)
// events 函数模板
let advancedEvents = ref({ ...targetData.value.events.advancedEvents })
// 事件错误标识
const errorFlag = ref(false)

// 验证语法
const validEvents = () => {
  let errorFn = ''
  let message = ''
  let name = ''

  errorFlag.value = Object.entries(advancedEvents.value).every(([eventName, str]) => {
    try {
      // 支持await，验证语法
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
      new AsyncFunction(str)
      return true
    } catch (error: any) {
      message = error.message
      name = error.name
      errorFn = eventName
      return false
    }
  })
  return {
    errorFn,
    message,
    name
  }
}

// 关闭事件
const closeEvents = () => {
  showModal.value = false
}

// 新增事件
const saveEvents = () => {
  if (validEvents().errorFn) {
    window['$message'].error(editorT('bigscreenEditor.ui.cannotSaveEventFunctionContainsError'))
    return
  }
  if (Object.values(advancedEvents.value).join('').trim() === '') {
    // 清空事件
    targetData.value.events.advancedEvents = {
      vnodeBeforeMount: undefined,
      vnodeMounted: undefined
    }
  } else {
    targetData.value.events.advancedEvents = { ...advancedEvents.value }
  }
  closeEvents()
}

watch(
  () => showModal.value,
  (newData: boolean) => {
    if (newData) {
      advancedEvents.value = { ...targetData.value.events.advancedEvents }
    }
  }
)
</script>

<style lang="scss" scoped>
@import '../index.scss';
</style>
