<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { ref, computed } from 'vue'
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  'select': [config: any]
}>()

const chartEditStore = useChartEditStore()
const searchText = ref('')

// 获取所有可用组件（排除容器类组件）
const allComponents = computed(() => {
  // 从 chartEditStore 获取组件列表
  // 这里需要根据实际组件库的数据结构来获取
  const components: any[] = []
  
  // 模拟：实际应从 packagesListObj 或类似数据源获取
  // 排除 Group 类组件避免递归嵌套
  return components.filter(c => c.category !== 'group')
})

// 过滤后的组件列表
const filteredComponents = computed(() => {
  if (!searchText.value) return allComponents.value
  return allComponents.value.filter((c: any) => 
    c.title?.includes(searchText.value) || c.key?.includes(searchText.value)
  )
})

// 关闭弹窗
const handleClose = () => {
  emit('update:show', false)
}

// 选择组件
const handleSelect = (config: any) => {
  emit('select', config)
  handleClose()
}
</script>

<template>
  <n-modal
    :show="show"
    @update:show="emit('update:show', $event)"
    preset="card"
    :title="editorT('bigscreenEditor.ui.componentSelectComponent')"
    style="width: 600px; max-width: 90vw"
    :bordered="false"
    :segmented="{ content: true, footer: 'soft' }"
  >
    <div class="picker-container">
      <!-- 搜索框 -->
      <n-input
        v-model:value="searchText"
        :placeholder="editorT('bigscreenManagement.ui.searchComponentName')"
        clearable
        style="margin-bottom: 16px"
      >
        <template #prefix>
          <n-icon><SearchIcon /></n-icon>
        </template>
      </n-input>

      <!-- 组件网格 -->
      <div class="component-grid">
        <div
          v-for="item in filteredComponents"
          :key="item.key"
          class="component-item"
          @click="handleSelect(item)"
        >
          <div class="component-icon">
            <img v-if="item.image" :src="item.image" :alt="item.title" />
            <div v-else class="icon-placeholder">{{ item.title?.[0] || '?' }}</div>
          </div>
          <div class="component-name">{{ item.title || item.key }}</div>
        </div>
      </div>

      <!-- 空状态 -->
      <n-empty v-if="filteredComponents.length === 0" :description="editorT('bigscreenManagement.ui.noComponents')" />
    </div>
  </n-modal>
</template>

<style lang="scss" scoped>
.picker-container {
  min-height: 300px;
}
.component-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}
.component-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: var(--n-primary-color);
    background: var(--n-color-hover);
  }
}
.component-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  img {
    max-width: 100%;
    max-height: 100%;
  }
  .icon-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--n-color-hover);
    border-radius: 4px;
    font-size: 20px;
    font-weight: bold;
  }
}
.component-name {
  font-size: 12px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}
</style>