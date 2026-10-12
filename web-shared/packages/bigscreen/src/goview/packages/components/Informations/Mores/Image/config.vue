<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <collapse-item :name="editorT('orgManage.flow.propertyTitle')" :expanded="true">
    <!-- 来源模式切换 -->
    <setting-item-box :name="editorT('orgManage.pointLog.source')" :alone="true">
      <setting-item>
        <n-radio-group v-model:value="sourceMode" size="small">
          <n-radio-button value="library">{{ editorT('bigscreenEditor.ui.componentAssetLibraryImage') }}</n-radio-button>
          <n-radio-button value="manual">{{ editorT('bigscreenEditor.ui.componentManualURL') }}</n-radio-button>
        </n-radio-group>
      </setting-item>
    </setting-item-box>

    <!-- 资源库模式面板 -->
    <setting-item-box v-if="sourceMode === 'library'" :name="editorT('orgManage.memory.pathCol')" :alone="true">
      <div class="flex flex-col gap-2">
        <!-- 缩略图预览 -->
        <div class="asset-preview-box">
          <img
            v-if="optionData.dataset"
            :src="optionData.dataset"
            class="asset-thumb"
          />
          <span v-else class="asset-thumb-placeholder">{{ editorT('bigscreenEditor.ui.componentNoImages') }}</span>
        </div>
        <!-- 资源名称 -->
        <span
          class="asset-name"
          :class="{ 'asset-name--empty': !optionData.assetName }"
        >
          {{ optionData.assetName || editorT('bigscreenEditor.ui.componentNoAssetSelected') }}
        </span>
        <!-- 按钮组 -->
        <div class="flex gap-2">
          <n-button size="small" @click="pickerVisible = true">
            {{ editorT('bigscreenEditor.ui.componentSelectFromAssetLibrary') }}
          </n-button>
          <n-button
            size="small"
            :loading="uploading"
            @click="onUploadClick"
          >
            {{ editorT('bigscreenEditor.ui.componentUploadAndAddToAssetLibrary') }}
          </n-button>
          <n-button size="small" type="warning" text @click="onClearAsset">
            {{ editorT('bigscreenEditor.ui.componentClearReference') }}
          </n-button>
        </div>
      </div>
    </setting-item-box>

    <!-- 手动地址模式面板 -->
    <setting-item-box v-else :name="editorT('orgManage.memory.pathCol')" :alone="true">
      <setting-item>
        <n-input v-model:value="optionData.dataset" size="small"></n-input>
      </setting-item>
      <div class="manual-mode-hint">
        {{ editorT('bigscreenEditor.ui.componentAdvancedModeIsForTemporaryExternalImageURLs') }}
      </div>
    </setting-item-box>

    <!-- 样式区（不变） -->
    <setting-item-box :name="editorT('bigscreenEditor.ui.componentStyle')">
      <setting-item :name="editorT('orgManage.role.type')">
        <n-select
          v-model:value="optionData.fit"
          size="small"
          :options="fitList"
        ></n-select>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentRoundedCorners')">
        <n-input-number
          v-model:value="optionData.borderRadius"
          size="small"
          :min="0"
          :placeholder="editorT('bigscreenEditor.ui.componentRoundedCorners')"
        ></n-input-number>
      </setting-item>
    </setting-item-box>

    <!-- 资源选择弹窗 -->
    <AssetPicker v-model:show="pickerVisible" @select="onAssetSelected" />
  </collapse-item>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PropType } from 'vue'
import { onUnmounted, ref, watch } from 'vue'

import { getRequestClient } from '@vben/api'
import { uploadFile } from '@vben/saas'

import logo from '@/assets/logo.png'

import {
  CollapseItem,
  SettingItemBox,
  SettingItem,
} from '@/components/Pages/ChartItemSetting'

import { option } from './config'
import AssetPicker from '../../../../../views/chart/ContentConfigurations/components/AssetPicker/index.vue'

const props = defineProps({
  optionData: {
    type: Object as PropType<typeof option>,
    required: true,
  },
})

// ── 来源模式 ──────────────────────────────────────────────
// 默认按 assetId 有值判为资源库模式
const sourceMode = ref<'library' | 'manual'>(
  props.optionData.assetId ? 'library' : 'manual',
)

/** 切换到手动模式时，保留 dataset，清空资源库字段 */
watch(sourceMode, (newMode, oldMode) => {
  if (newMode === 'manual' && oldMode === 'library') {
    ;(props.optionData as any).assetId = undefined
    ;(props.optionData as any).assetName = undefined
    ;(props.optionData as any).assetSource = 'manual'
  }
})

// ── 资源库选择弹窗 ──────────────────────────────────────────
const pickerVisible = ref(false)

/** AssetPicker 选中回调：回填资源信息到组件 */
function onAssetSelected(asset: { id?: string; name?: string; url?: string }) {
  const od = props.optionData as any
  od.dataset = asset.url || ''
  od.assetId = asset.id
  od.assetName = asset.name
  od.assetSource = 'library'
}

/** 清除资源引用，恢复默认 logo */
function onClearAsset() {
  const od = props.optionData as any
  od.dataset = logo
  od.assetId = undefined
  od.assetName = undefined
  od.assetSource = undefined
}

// ── 上传并加入资源库 ────────────────────────────────────────
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

/** 触发文件选择（支持图片与 CAD 图纸） */
function onUploadClick() {
  if (!fileInputRef.value) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,.dwg,.dxf,.dwf,.dwfx,.xps'
    input.style.display = 'none'
    input.addEventListener('change', handleFileChange)
    document.body.append(input)
    fileInputRef.value = input
  }
  fileInputRef.value.click()
}

/** 文件选择后：上传文件 → 注册资源库 → 回填组件 */
async function handleFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  uploading.value = true
  try {
    // 1. 上传文件到存储
    const uploadRes = await uploadFile(file)
    const fileUri =
      (uploadRes as any)?.data?.fileUri || (uploadRes as any)?.fileUri
    if (!fileUri) throw new Error(editorT('bigscreenManagement.ui.uploadFailedNoFilePathReturned'))

    // 2. 注册到资源库
    const requestClient = getRequestClient()
    const regRes = await requestClient.post('/api/v1/view/asset/upload', {
      name: file.name,
      type: 'image',
      url: fileUri,
      size: file.size,
    })
    const assetId = (regRes as any)?.data?.id

    // 3. 回填组件
    const od = props.optionData as any
    od.dataset = fileUri
    od.assetId = assetId
    od.assetName = file.name
    od.assetSource = 'library'

    ;(window as any).$message?.success?.(editorT('orgManage.common.uploadSuccess'))
  } catch (error: any) {
    ;(window as any).$message?.error?.(error?.message || editorT('aiChat.ui.uploadFailed'))
  } finally {
    uploading.value = false
    // 清空 file input，允许重复选择同一文件
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
}

// 组件卸载时清理动态创建的文件输入元素
onUnmounted(() => {
  if (fileInputRef.value) {
    fileInputRef.value.remove()
    fileInputRef.value = null
  }
})

// ── 适应类型 ──────────────────────────────────────────────
const fitList = [
  {
    value: 'fill',
    label: 'fill',
  },
  {
    value: 'contain',
    label: 'contain',
  },
  {
    value: 'cover',
    label: 'cover',
  },
  {
    value: 'scale-down',
    label: 'scale-down',
  },
  {
    value: 'none',
    label: 'none',
  },
]
</script>

<style scoped>
/* ── 资源库模式 ──────────────────────────────────────────── */
.asset-preview-box {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
  max-height: 120px;
  border: 1px solid var(--n-border-color, #e5e7eb);
  border-radius: 6px;
  overflow: hidden;
  background: var(--n-color-embedded, #f9fafb);
}

.asset-thumb {
  max-width: 100%;
  max-height: 120px;
  object-fit: contain;
}

.asset-thumb-placeholder {
  font-size: 12px;
  color: #9ca3af;
}

.asset-name {
  font-size: 12px;
  line-height: 1.4;
  word-break: break-all;
}

.asset-name--empty {
  color: #9ca3af;
}

/* ── 手动地址模式 ────────────────────────────────────────── */
.manual-mode-hint {
  margin-top: 4px;
  font-size: 12px;
  color: #9ca3af;
}
</style>
