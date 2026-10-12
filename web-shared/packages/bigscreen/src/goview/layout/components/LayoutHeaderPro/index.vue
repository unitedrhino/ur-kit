<template>
  <layout-header>
    <template #left>
      <slot name="left"></slot>
    </template>
    <template #center>
      <slot name="center"></slot>
    </template>
    <template #ri-left>
      <slot name="ri-left"></slot>
    </template>
    <template #ri-right>
      <slot name="ri-right"></slot>
      <!-- 退出按钮已隐藏（宿主应用自行处理导航） -->
    </template>
  </layout-header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { LayoutHeader } from '@/layout/components/LayoutHeader'
import { icon } from '@/plugins'

const { CloseIcon } = icon.ionicons5
const router = useRouter()

const props = defineProps<{
  onExit?: () => void
}>()

const handleExit = () => {
  if (props.onExit) {
    props.onExit()
  } else {
    router.back()
  }
}
</script>
