<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <!-- 模型配置 -->
  <collapse-item :name="editorT('bigscreenEditor.ui.componentModel')" :expanded="true">
    <setting-item-box :name="editorT('bigscreenEditor.ui.componentModelFile')" :alone="true">
      <div class="flex flex-col gap-2 w-full">
        <div class="model-file-box">
          <span class="model-file-name" :class="{ 'model-file-name--empty': !optionData.modelUrl }">
            {{ optionData.modelAssetName || fileNameFromUrl || editorT('bigscreenEditor.ui.componentNoModelSelectedGLBUpTo50MB') }}
          </span>
        </div>
        <div class="flex gap-2">
          <n-button size="small" :loading="uploading" @click="onUploadClick">{{ editorT('bigscreenEditor.ui.componentUploadGLB') }}</n-button>
          <n-button size="small" @click="pickerVisible = true">{{ editorT('bigscreenEditor.ui.componentSelectFromAssetLibrary') }}</n-button>
          <n-button size="small" text type="warning" @click="onClearModel">{{ editorT('scene.ui.clear') }}</n-button>
        </div>
        <setting-item :name="editorT('bigscreenEditor.ui.componentOrEnterTheModelURL')">
          <n-input
            :value="optionData.modelUrl"
            size="small"
            placeholder="https://...（.glb）"
            @update:value="onManualUrl"
          />
        </setting-item>
        <div class="model-hint">{{ editorT('bigscreenEditor.ui.componentStandardGLBExportsAreSupportedDRACOKTX2Compression') }}</div>
      </div>
    </setting-item-box>

    <setting-item-box :name="editorT('iotApp.project.tabScenes')">
      <setting-item :name="editorT('bigscreenEditor.ui.componentAutoRotate')">
        <n-switch v-model:value="optionData.autoRotate" size="small" />
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentTransparentBackground')">
        <n-switch v-model:value="optionData.bgTransparent" size="small" />
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentDefaultViewpoint')" :alone="true">
        <div class="flex gap-2">
          <n-button size="small" type="primary" @click="enterViewEdit">{{ editorT('bigscreenEditor.ui.componentAdjustModelViewpointFullscreen') }}</n-button>
          <n-button size="small" @click="saveView">{{ editorT('bigscreenEditor.ui.componentSaveCurrentViewpoint') }}</n-button>
        </div>
        <div class="model-hint">{{ editorT('bigscreenEditor.ui.componentAdjustModelPositionAndOrientationInFullscreenThen') }}</div>
      </setting-item>
    </setting-item-box>
  </collapse-item>

  <AssetPicker v-model:show="pickerVisible" @select="onAssetSelected" />
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

/**
 * 3D 模型组件右侧「定制」面板
 *
 * 仅保留模型文件配置（上传/资产库/手动地址）与场景选项；
 * 节点树与数据绑定入口收敛至右侧「数据」页签（NodeBindingPanel）。
 */
import { computed, onUnmounted, ref, type PropType } from 'vue'

import { getRequestClient } from '@vben/api'
import { uploadFile } from '@vben/saas'

import { CollapseItem, SettingItem, SettingItemBox } from '@/components/Pages/ChartItemSetting'
import { option } from './config'

const props = defineProps({
  optionData: {
    type: Object as PropType<typeof option>,
    required: true
  }
})

// ── 模型：上传 / 资源库 / 手动地址 ────────────────────────────

const pickerVisible = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const MAX_MODEL_SIZE = 50 * 1024 * 1024

const fileNameFromUrl = computed(() => {
  const raw = props.optionData.modelUrl || ''
  const seg = (raw.split('?')[0] ?? '').split('#')[0] ?? ''
  return seg.split('/').pop() || ''
})

function onUploadClick() {
  if (!fileInputRef.value) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.glb,.gltf,model/gltf-binary'
    input.style.display = 'none'
    input.addEventListener('change', handleFileChange)
    document.body.append(input)
    fileInputRef.value = input
  }
  fileInputRef.value.click()
}

/** 上传走 core 通用上传接口（与大屏其他上传同口径），成功后登记资产库并回填 */
async function handleFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > MAX_MODEL_SIZE) {
    ;(window as any).$message?.error?.(editorT('bigscreenEditor.ui.componentTheModelExceedsThe50MBLimit'))
    return
  }
  uploading.value = true
  try {
    const uploadRes = await uploadFile(file)
    const fileUri = (uploadRes as any)?.data?.fileUri || (uploadRes as any)?.fileUri
    if (!fileUri) throw new Error(editorT('bigscreenEditor.ui.componentUploadFailedNoFileURLWasReturned'))

    // 登记到 view 资产库（失败不阻断，模型仍可直接使用）
    let assetId: string | undefined
    try {
      const requestClient = getRequestClient()
      const regRes = await requestClient.post('/api/v1/view/asset/upload', {
        name: file.name,
        type: 'image',
        url: fileUri,
        size: file.size
      })
      assetId = (regRes as any)?.data?.id
    } catch (regError) {
      console.warn('[GlTFModel] 登记资产库失败（不影响使用）', regError)
    }

    props.optionData.modelUrl = fileUri
    props.optionData.modelAssetId = assetId
    props.optionData.modelAssetName = file.name
    ;(window as any).$message?.success?.(editorT('bigscreenEditor.ui.componentModelUploadedSuccessfully'))
  } catch (error: any) {
    ;(window as any).$message?.error?.(error?.message || editorT('bigscreenEditor.ui.componentModelUploadFailed'))
  } finally {
    uploading.value = false
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
}

function onAssetSelected(asset: { id?: string; name?: string; url?: string }) {
  props.optionData.modelUrl = asset.url || ''
  props.optionData.modelAssetId = asset.id
  props.optionData.modelAssetName = asset.name
}

function onManualUrl(value: string) {
  props.optionData.modelUrl = value
  props.optionData.modelAssetId = undefined
  props.optionData.modelAssetName = undefined
}

function onClearModel() {
  props.optionData.modelUrl = ''
  props.optionData.modelAssetId = undefined
  props.optionData.modelAssetName = undefined
  props.optionData.parsedNodes = []
  props.optionData.selectedNodePath = ''
}

/** 保存视角：改 token 触发 canvas 把编辑器当前相机状态写入 cameraState */
function saveView() {
  props.optionData.saveViewToken = Date.now()
  ;(window as any).$message?.success?.(editorT('bigscreenEditor.ui.componentCurrentViewpointSavedThePublishedDashboardWillUse'))
}

/** 进入全屏视角调整模式：canvas 监听 viewEditToken 后切全屏交互，退出时自动保存视角 */
function enterViewEdit() {
  props.optionData.viewEditToken = Date.now()
}

onUnmounted(() => {
  fileInputRef.value?.remove()
  fileInputRef.value = null
})
</script>

<style scoped>
.model-file-box {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 4px 10px;
  border: 1px dashed var(--n-border-color, #d4d7dc);
  border-radius: 6px;
  background: var(--n-color-embedded, #f9fafb);
}

.model-file-name {
  font-size: 12px;
  word-break: break-all;
}

.model-file-name--empty {
  color: #9ca3af;
}

.model-hint {
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.5;
}
</style>
