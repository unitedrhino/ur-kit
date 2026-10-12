<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <CollapseItem :name="editorT('bigscreenEditor.ui.componentDeviceInteractionButton')" expanded>
    <!-- UI 形态 -->
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentComponentForm')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentUIMode')">
        <n-select
          v-model:value="optionData.uiMode"
          size="small"
          :options="uiModeOptions"
        ></n-select>
      </SettingItem>
    </SettingItemBox>

    <!-- 基础设备绑定 -->
    <SettingItemBox :name="editorT('iotApp.deviceDetail.tabProfile')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentInteractionType')">
        <n-select
          v-model:value="optionData.interactType"
          size="small"
          :options="interactTypeOptions"
        ></n-select>
      </SettingItem>
      <SettingItem :name="editorT('iotApp.ota.deviceScopeHeading')">
        <n-select
          v-model:value="optionData.deviceScope"
          size="small"
          :options="deviceScopeOptions"
        ></n-select>
      </SettingItem>
      <SettingItem :name="editorT('iotApp.productPage.productId')">
        <n-input v-model:value="optionData.productID" size="small" placeholder="productID"></n-input>
      </SettingItem>
      <SettingItem v-if="optionData.deviceScope === 'single'" :name="editorT('iotApp.deviceDetail.subDeviceName')">
        <n-input v-model:value="optionData.deviceName" size="small" placeholder="deviceName"></n-input>
      </SettingItem>
      <SettingItem v-if="optionData.deviceScope === 'area'" :name="editorT('iotApp.deviceDetail.areaId')">
        <n-input v-model:value="optionData.areaID" size="small" placeholder="areaID"></n-input>
      </SettingItem>
      <SettingItem v-if="optionData.deviceScope === 'group'" :name="editorT('iot.group.groupId')">
        <n-input v-model:value="optionData.groupID" size="small" placeholder="groupID"></n-input>
      </SettingItem>
    </SettingItemBox>

    <!-- 物模型配置 -->
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentPropertyModelConfiguration')">
      <SettingItem :name="optionData.interactType === 'action' ? editorT('bigscreenEditor.ui.componentActionIdentifier') : editorT('bigscreenEditor.ui.componentPropertyIdentifier')">
        <n-input v-model:value="optionData.dataIdentifier" size="small" placeholder="identifier"></n-input>
      </SettingItem>
    </SettingItemBox>

    <!-- ====== Button 形态专属 ====== -->
    <template v-if="optionData.uiMode === 'button'">
      <SettingItemBox :name="editorT('bigscreenEditor.ui.componentButtonSettings')">
        <SettingItem :name="editorT('bigscreenEditor.ui.componentButtonText')">
          <n-input v-model:value="optionData.btnText" size="small" :placeholder="editorT('bigscreenEditor.ui.componentSendCommand')"></n-input>
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentParametersJSON')">
          <n-input
            v-model:value="optionData.params"
            type="textarea" size="small"
            placeholder='{"key": "value"}'
            :autosize="{ minRows: 2, maxRows: 4 }"
            @blur="validateJson('params')"
            :status="jsonErrors.params ? 'error' : undefined"
          ></n-input>
          <span v-if="jsonErrors.params" class="json-error">{{ jsonErrors.params }}</span>
        </SettingItem>
      </SettingItemBox>
    </template>

    <!-- ====== Switch 形态专属 ====== -->
    <template v-if="optionData.uiMode === 'switch'">
      <SettingItemBox :name="editorT('bigscreenEditor.ui.componentSwitchText')">
        <SettingItem :name="editorT('bigscreenEditor.ui.componentOnText')">
          <n-input v-model:value="optionData.onText" size="small" :placeholder="editorT('bigscreenEditor.ui.componentOn')"></n-input>
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentOffText')">
          <n-input v-model:value="optionData.offText" size="small" :placeholder="editorT('bigscreenEditor.ui.componentOff')"></n-input>
        </SettingItem>
      </SettingItemBox>

      <SettingItemBox :name="editorT('bigscreenEditor.ui.componentSwitchParameters')">
        <SettingItem :name="editorT('bigscreenEditor.ui.componentOnParametersJSON')">
          <n-input
            v-model:value="optionData.paramsOn"
            type="textarea" size="small"
            placeholder='{"switch": 1}'
            :autosize="{ minRows: 2, maxRows: 4 }"
            @blur="validateJson('paramsOn')"
            :status="jsonErrors.paramsOn ? 'error' : undefined"
          ></n-input>
          <span v-if="jsonErrors.paramsOn" class="json-error">{{ jsonErrors.paramsOn }}</span>
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentOffParametersJSON')">
          <n-input
            v-model:value="optionData.paramsOff"
            type="textarea" size="small"
            placeholder='{"switch": 0}'
            :autosize="{ minRows: 2, maxRows: 4 }"
            @blur="validateJson('paramsOff')"
            :status="jsonErrors.paramsOff ? 'error' : undefined"
          ></n-input>
          <span v-if="jsonErrors.paramsOff" class="json-error">{{ jsonErrors.paramsOff }}</span>
        </SettingItem>
      </SettingItemBox>
    </template>

    <!-- 高级设置（通用） -->
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentAdvancedSettings')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentAsynchronousMode')">
        <n-switch v-model:value="optionData.isAsync" size="small"></n-switch>
      </SettingItem>
      <SettingItem :name="editorT('iotApp.deviceDetail.shadowControl')">
        <n-select
          v-model:value="optionData.shadowControl"
          size="small"
          :options="shadowControlOptions"
        ></n-select>
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { reactive, type PropType } from 'vue'
import { CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting'
import { option } from './config'

const props = defineProps({
  optionData: {
    type: Object as PropType<typeof option>,
    required: true
  }
})

const jsonErrors = reactive<Record<string, string>>({
  params: '',
  paramsOn: '',
  paramsOff: '',
})

const validateJson = (field: string) => {
  const val = (props.optionData as any)[field]
  if (!val || val.trim() === '') {
    jsonErrors[field] = ''
    return
  }
  try {
    JSON.parse(val)
    jsonErrors[field] = ''
  } catch (e: any) {
    jsonErrors[field] = editorT('bigscreenEditor.dynamic.jsonFormatError', { message: String(e.message) })
  }
}

const uiModeOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('iotApp.menu.typeButton'); }, value: 'button' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.flow.fwSwitch'); }, value: 'switch' },
]

const interactTypeOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('iotApp.deviceDetail.sendTypeProperty'); }, value: 'property' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('scene.ui.actionCall'); }, value: 'action' },
]

const deviceScopeOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentSingleDevice'); }, value: 'single' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.memory.entityArea'); }, value: 'area' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('iotApp.project.tabGroups'); }, value: 'group' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('iotApp.ota.scopeAll'); }, value: 'all' },
]

const shadowControlOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('iotApp.productPage.onlineAuto'); }, value: 0 },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentLiveDeliveryOnly'); }, value: 1 },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentShadowOnly'); }, value: 2 },
]
</script>

<style scoped>
.json-error {
  color: #e34d59;
  font-size: 12px;
}
</style>
