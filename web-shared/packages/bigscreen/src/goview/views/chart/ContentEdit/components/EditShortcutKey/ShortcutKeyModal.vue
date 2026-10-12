<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <n-modal v-model:show="modelShowRef" :mask-closable="true" @afterLeave="closeHandle">
    <n-table class="model-content" :bordered="false" :single-line="false">
      <thead>
        <tr>
          <th>{{ editorT('iotApp.cardDetail.tabOnline') }}</th>
          <th>{{ editorT('bigscreenEditor.ui.windowsKeyboardShortcuts') }}</th>
          <th>
            <n-space justify="space-between">
              <span> {{ editorT('bigscreenEditor.ui.macKeyboardShortcuts') }} </span>
              <n-icon size="20" class="go-cursor-pointer" @click="closeHandle">
                <close-icon></close-icon>
              </n-icon>
            </n-space>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in shortcutKeyOptions" :key="index">
          <td>{{ item.label }}</td>
          <td>{{ item.win }}</td>
          <td v-if="item.macSource">{{ item.mac }}</td>
          <td v-else>
            <n-gradient-text :size="22">{{ item.mac.substr(0, 1) }}</n-gradient-text>
            + {{ item.mac.substr(3) }}
          </td>
        </tr>
      </tbody>
    </n-table>
  </n-modal>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { watch, ref } from 'vue'
import { icon } from '@/plugins'
import { WinKeyboard, MacKeyboard } from '@/enums/editPageEnum'

const { CloseIcon } = icon.ionicons5
const modelShowRef = ref(false)

const emit = defineEmits(['update:modelShow'])

const props = defineProps({
  modelShow: Boolean
})


watch(() => props.modelShow, (newValue) => {
  modelShowRef.value = newValue
})

// 快捷键
const shortcutKeyOptions = [
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.dragCanvas'); },
    win: `${WinKeyboard.SPACE.toUpperCase()} + 🖱️ `,
    mac: `${MacKeyboard.SPACE.toUpperCase()} + 🖱️ `,
    macSource: true
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.moveUpRightDownLeft'); },
    win: editorT('bigscreenEditor.dynamic.message67', { key: String(WinKeyboard.CTRL.toUpperCase()) }),
    mac: `${MacKeyboard.CTRL.toUpperCase()} + ↑ `
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgPark.ui.locked'); },
    win: `${WinKeyboard.CTRL.toUpperCase()} + L `,
    mac: `${MacKeyboard.CTRL.toUpperCase()} + L `
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgPark.ui.unlock'); },
    win: `${WinKeyboard.CTRL.toUpperCase()} + ${WinKeyboard.SHIFT.toUpperCase()}+ L `,
    mac: `${MacKeyboard.CTRL.toUpperCase()} + ${MacKeyboard.SHIFT.toUpperCase()} + L `
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.display'); },
    win: `${WinKeyboard.CTRL.toUpperCase()} + H `,
    mac: `${MacKeyboard.CTRL.toUpperCase()} + H `
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.flow.permHidden'); },
    win: `${WinKeyboard.CTRL.toUpperCase()} + ${WinKeyboard.SHIFT.toUpperCase()} + H `,
    mac: `${MacKeyboard.CTRL.toUpperCase()} + ${MacKeyboard.SHIFT.toUpperCase()} + H `
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.common.delete'); },
    win: 'Delete'.toUpperCase(),
    mac: `${MacKeyboard.CTRL.toUpperCase()} + Backspace `
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.flow.copy'); },
    win: `${WinKeyboard.CTRL.toUpperCase()} + C `,
    mac: `${MacKeyboard.CTRL.toUpperCase()} + C `
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.cut'); },
    win: `${WinKeyboard.CTRL.toUpperCase()} + X `,
    mac: `${MacKeyboard.CTRL.toUpperCase()} + X `
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.paste'); },
    win: `${WinKeyboard.CTRL.toUpperCase()} + V `,
    mac: `${MacKeyboard.CTRL.toUpperCase()} + V `
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.back'); },
    win: `${WinKeyboard.CTRL.toUpperCase()} + Z `,
    mac: `${MacKeyboard.CTRL.toUpperCase()} + Z `
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.forward'); },
    win: `${WinKeyboard.CTRL.toUpperCase()} + ${WinKeyboard.SHIFT.toUpperCase()} + Z `,
    mac: `${MacKeyboard.CTRL.toUpperCase()} + ${MacKeyboard.SHIFT.toUpperCase()} + Z `
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.flow.fcCheckbox'); },
    win: `${WinKeyboard.CTRL.toUpperCase()} + 🖱️ `,
    mac: `${MacKeyboard.CTRL_SOURCE_KEY.toUpperCase()} + 🖱️ `
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('iot.group.create'); },
    win: `${WinKeyboard.CTRL.toUpperCase()} + G / 🖱️ `,
    mac: `${MacKeyboard.CTRL_SOURCE_KEY.toUpperCase()} + G / 🖱️`
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.ungroup2'); },
    win: `${WinKeyboard.CTRL.toUpperCase()} + ${WinKeyboard.SHIFT.toUpperCase()} + G `,
    mac: `${MacKeyboard.CTRL_SOURCE_KEY.toUpperCase()} + ${WinKeyboard.SHIFT.toUpperCase()} + G `
  }
]

const closeHandle = () => {
  emit('update:modelShow', false)
}
</script>

<style lang="scss" scoped>
.model-content {
  width: 50vw;
  padding-bottom: 20px;
  overflow: hidden;
  border-radius: 15px;
  td {
    padding: 5px 10px;
  }
}
</style>
