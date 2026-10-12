<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <!-- 页面配置 -->
  <collapse-item :name="editorT('bigscreenEditor.ui.componentPage')" :expanded="true">
    <setting-item-box :name="editorT('bigscreenEditor.ui.componentPageURL')" :alone="true">
      <div class="flex flex-col gap-2 w-full">
        <n-input
          :value="optionData.url"
          size="small"
          placeholder="https://...（内嵌页面地址）"
          @update:value="onUrlChange"
        />
        <div class="scene-hint">
          {{ editorT('bigscreenEditor.ui.componentThePageLoadsInAnIframeSandboxWith') }}
        </div>
      </div>
    </setting-item-box>
  </collapse-item>
  <!-- 页面包上传配置 -->
  <collapse-item :name="editorT('bigscreenEditor.ui.componentPagePackage')" :expanded="true">
    <setting-item-box :name="editorT('bigscreenEditor.ui.componentUploadPagePackage')" :alone="true">
      <div class="flex flex-col gap-2 w-full">
        <div class="scene-hint">
          {{ editorT('bigscreenEditor.ui.componentCurrentSource') }}{{ sourceLabel }}
        </div>
        <n-button
          size="small"
          type="primary"
          ghost
          :loading="uploading"
          :disabled="uploadDisabled"
          @click="pickZipFile"
        >
          {{ uploading ? editorT('iotApp.ota.uploading') : editorT('bigscreenEditor.ui.componentSelectAndUploadAZIPPackage') }}
        </n-button>
        <input
          ref="zipInputRef"
          class="scene-zip-input"
          type="file"
          accept=".zip"
          @change="onZipFileChange"
        />
        <div v-if="!screenId" class="scene-hint">
          {{ editorT('bigscreenEditor.ui.componentTheDashboardHasNoValidIDSaveIt') }}
        </div>
        <div v-else class="scene-hint">
          {{ editorT('bigscreenEditor.ui.componentOnlyZIPFilesUpTo100MBContainingIndex') }}
        </div>
      </div>
    </setting-item-box>
  </collapse-item>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

/**
 * 内嵌页面组件右侧「定制」面板
 *
 * 页面地址配置 + 页面包上传：zip 包经 viewsvr upload-zip 托管到对象存储，
 * 成功后回填 option.url 为平台托管入口；锚点树与数据绑定入口收敛至右侧「数据」页签（NodeBindingPanel）。
 */
import type { PropType } from 'vue'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import { CollapseItem, SettingItemBox } from '@/components/Pages/ChartItemSetting'
import { option } from './config'
import { isHostedSceneUrl, uploadSceneZip, validateSceneZipFile } from './upload-package'

const props = defineProps({
  optionData: {
    type: Object as PropType<typeof option>,
    required: true
  }
})

const route = useRoute()

/** 当前编辑中大屏 id（编辑器路由参数）；无值视为尚未保存，不允许上传 */
const screenId = computed(() => {
  const raw = route.params.id
  const id = typeof raw === 'string' ? raw : Array.isArray(raw) ? (raw[0] ?? '') : ''
  return id.trim()
})

/** 页面地址来源状态：平台托管包 / 外部 URL / 未配置 */
const sourceLabel = computed(() => {
  if (!props.optionData.url) return editorT('iotApp.cardDetail.notConfigured')
  return isHostedSceneUrl(props.optionData.url) ? editorT('bigscreenEditor.ui.componentPlatformHostedPackage') : editorT('bigscreenEditor.ui.componentExternalURL')
})

const uploading = ref(false)
const zipInputRef = ref<HTMLInputElement | null>(null)

/** 上传按钮禁用条件：上传中或大屏尚未保存 */
const uploadDisabled = computed(() => uploading.value || !screenId.value)

function pickZipFile() {
  zipInputRef.value?.click()
}

/** 场景页地址变更：canvas watch(url) 会自动清空旧锚点快照并等待新 anchors 上报 */
function onUrlChange(value: string) {
  props.optionData.url = value
}

/**
 * 上传选中的 zip 页面包：前端先校验扩展名与大小，通过后调 upload-zip，
 * 成功回填 option.url（触发 canvas 按 new url 重建 iframe），失败统一 toast
 */
async function onZipFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  // 清空 value 允许再次选择同一文件重新上传
  input.value = ''
  if (!file || uploading.value) return

  const invalidMsg = validateSceneZipFile(file)
  if (invalidMsg) {
    window.$message?.error(invalidMsg)
    return
  }
  if (!screenId.value) {
    window.$message?.warning(editorT('bigscreenEditor.ui.componentSaveTheDashboardBeforeUploadingAPagePackage'))
    return
  }

  uploading.value = true
  try {
    const resp = await uploadSceneZip(file, screenId.value)
    props.optionData.url = resp.entryUrl
    window.$message?.success(editorT('bigscreenEditor.dynamic.pagePackageUploaded', { count: String(resp.fileCount) }))
  } catch (error) {
    const msg = (error as any)?.response?.data?.msg || editorT('bigscreenEditor.ui.componentPagePackageUploadFailedPleaseTryAgainLater')
    window.$message?.error(msg)
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.scene-hint {
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.5;
}

/* 隐藏原生文件选择框，由按钮触发（保留可聚焦性以便 Playwright setInputFiles） */
.scene-zip-input {
  display: none;
}
</style>
