<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <Teleport to="body">
    <div class="editor-header-title-portal">
      <!-- 显示态 -->
      <span class="title-prefix">{{ editorT('bigscreenEditor.ui.dashboardTitle') }}</span>
      <div v-if="!editing" class="title-display" @click="handleEdit">
        <span class="title-text">{{ title }}</span>
        <span class="edit-icon">✏</span>
      </div>
      <!-- 编辑态 -->
      <n-input
        v-else
        ref="inputRef"
        v-model:value.trim="editValue"
        size="small"
        :maxlength="30"
        show-count
        :placeholder="editorT('bigscreenManagement.ui.enterDashboardName')"
        style="width: 200px; font-size: 15px; font-weight: 600"
        @keyup.enter="handleEnter"
        @blur="handleBlur"
      />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { ref, nextTick, computed } from 'vue'
import { useRoute } from 'vue-router'
import { setTitle } from '@/utils'
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore'
import { EditCanvasConfigEnum } from '@/store/modules/chartEditStore/chartEditStore.type'
import { ScreenApi } from '../../../../../views/bigscreen/screen/index.api'

const route = useRoute()
const chartEditStore = useChartEditStore()
const canvasConfig = chartEditStore.getEditCanvasConfig

const editing = ref(false)
const inputRef = ref<any>(null)
const editValue = ref('')
// 防止 Enter 触发 keyup 后再触发 blur 导致双重保存
const saved = ref(false)

const title = computed(() => canvasConfig.projectName || editorT('bigscreenEditor.ui.newProject'))

const handleEdit = () => {
  editValue.value = title.value
  saved.value = false
  editing.value = true
  nextTick(() => inputRef.value?.focus())
}

const doSave = async () => {
  if (saved.value) return
  saved.value = true
  editing.value = false

  const newTitle = editValue.value.trim() || editorT('bigscreenEditor.ui.newProject')
  // 更新本地 store
  chartEditStore.setEditCanvasConfig(EditCanvasConfigEnum.PROJECT_NAME, newTitle)
  setTitle(editorT('bigscreenEditor.dynamic.message73', { name: String(newTitle) }))

  // 同步更新后端大屏名称
  const id = route.params.id as string
  if (id) {
    try {
      await ScreenApi.update({ id, name: newTitle })
    } catch {
      // 后端更新失败不阻断体验，仅 store 已更新
    }
  }

  window.$message.success(editorT('bigscreenEditor.ui.titleUpdated'))
}

const handleEnter = () => {
  doSave()
}

const handleBlur = () => {
  doSave()
}
</script>

<style scoped>
.editor-header-title-portal {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  height: 50px;
  z-index: 9999;
  display: flex;
  align-items: center;
  pointer-events: auto;
}

.title-prefix {
  font-size: 15px;
  font-weight: 600;
  color: var(--n-text-color, #fff);
  white-space: nowrap;
  opacity: 0.85;
}

.title-display {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--n-text-color, #fff);
  font-size: 15px;
  font-weight: 600;
}

.title-text {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.edit-icon {
  opacity: 0;
  font-size: 12px;
  transition: opacity 0.2s;
}

.title-display:hover .edit-icon {
  opacity: 0.7;
}
</style>
