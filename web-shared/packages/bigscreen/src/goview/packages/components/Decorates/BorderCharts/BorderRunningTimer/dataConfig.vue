<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <!-- 数据源配置 -->
  <CollapseItem :name="editorT('bigscreenManagement.ui.dataSource')" :expanded="true">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentTimeSource')">
      <SettingItem :name="editorT('platformManage.mall.sourceType')">
        <n-select
          v-model:value="props.optionData.timeSource"
          size="small"
          :options="timeSourceOptions"
          @update:value="onTimeSourceChange"
        />
      </SettingItem>
      <!-- 设备模式下显示产品/设备选择 -->
      <template v-if="props.optionData.timeSource === 'device'">
        <SettingItem :name="editorT('iotApp.productPage.typeProduct')">
          <n-select
            v-model:value="props.optionData.deviceConfig.productID"
            :options="productOptions"
            :loading="loadingProducts"
            size="small"
            :placeholder="editorT('scene.ui.selectProduct')"
            filterable
            @update:value="onProductChange"
          />
        </SettingItem>
        <SettingItem :name="editorT('orgManage.memory.entityDevice')">
          <n-select
            v-model:value="props.optionData.deviceConfig.deviceName"
            :options="deviceOptions"
            :loading="loadingDevices"
            :disabled="!props.optionData.deviceConfig.productID"
            size="small"
            :placeholder="editorT('bigscreenEditor.ui.componentSearchByDeviceName')"
            filterable
            remote
            @search="onDeviceSearch"
          />
        </SettingItem>
        <n-text depth="3" style="font-size: 12px; color: #999; margin-top: 4px">
          {{ editorT('bigscreenEditor.ui.componentSelectingADeviceAutomaticallyRetrievesUptimeNoManual') }}
        </n-text>
      </template>
    </SettingItemBox>
  </CollapseItem>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { ref, watch } from 'vue'
import type { PropType } from 'vue'
import { CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting'
import { useTargetData } from '@/views/chart/ContentConfigurations/components/hooks/useTargetData.hook'
import { getProductList, getDeviceList } from '@/api/thingsDevice'

const props = defineProps({
  optionData: {
    type: Object as PropType<any>,
    required: true,
  },
})

const { targetData } = useTargetData()

const timeSourceOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentPlatformUptime'); }, value: 'platform' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentDeviceUptime'); }, value: 'device' },
]

const productOptions = ref<{ label: string; value: string }[]>([])
const deviceOptions = ref<{ label: string; value: string }[]>([])
const loadingProducts = ref(false)
const loadingDevices = ref(false)

let deviceSearchTimer: any = null

const loadProducts = async () => {
  loadingProducts.value = true
  try {
    const res = await getProductList({ page: { page: 1, size: 200 } })
    // 兼容拦截器解包（直接 list）与原始 AxiosResponse（data.list）两种响应形态
    const payload = res as { data?: { list?: any[] }; list?: any[] }
    const list = payload?.data?.list ?? payload?.list ?? []
    productOptions.value = list.map((p: any) => ({
      label: p.productName || p.productID,
      value: String(p.productID),
    }))
  } catch (e) {
    console.warn('[BorderRunningTimer] 加载产品列表失败:', e)
  } finally {
    loadingProducts.value = false
  }
}

const loadDevices = async (productID: string, query?: string) => {
  if (!productID) return
  loadingDevices.value = true
  try {
    const params: any = { productID, deviceName: query }
    const res = await getDeviceList(params)
    // 兼容拦截器解包（直接 list）与原始 AxiosResponse（data.list）两种响应形态
    const payload = res as { data?: { list?: any[] }; list?: any[] }
    const list = payload?.data?.list ?? payload?.list ?? []
    deviceOptions.value = list.map((d: any) => ({
      label: d.deviceAlias || d.deviceName,
      value: d.deviceName,
    }))
  } catch (e) {
    console.warn('[BorderRunningTimer] 加载设备列表失败:', e)
  } finally {
    loadingDevices.value = false
  }
}

loadProducts()

const onTimeSourceChange = (val: string) => {
  props.optionData.timeSource = val
  const request = targetData.value.request
  if (val === 'platform') {
    request.requestUrl = '/api/v1/view/system/uptime'
    request.requestParams.Body.json = '{}'
    request.requestInterval = 3600
  } else {
    request.requestUrl = '/api/v1/things/device/info/get-one'
    request.requestInterval = 3600
    updateDeviceRequest()
  }
}

const onProductChange = (productID: string) => {
  props.optionData.deviceConfig.productID = productID
  props.optionData.deviceConfig.deviceName = ''
  loadDevices(productID)
  updateDeviceRequest()
}

const onDeviceSearch = (query: string) => {
  if (deviceSearchTimer) clearTimeout(deviceSearchTimer)
  deviceSearchTimer = setTimeout(() => {
    const productID = props.optionData.deviceConfig?.productID
    if (productID) loadDevices(productID, query)
  }, 300)
}

watch(
  () => props.optionData.deviceConfig?.deviceName,
  (deviceName) => {
    if (deviceName) updateDeviceRequest()
  }
)

const updateDeviceRequest = () => {
  const request = targetData.value.request
  const cfg = props.optionData.deviceConfig
  if (cfg?.productID && cfg?.deviceName) {
    request.requestParams.Body.json = JSON.stringify({
      productID: cfg.productID,
      deviceName: cfg.deviceName,
    })
  }
}
</script>
