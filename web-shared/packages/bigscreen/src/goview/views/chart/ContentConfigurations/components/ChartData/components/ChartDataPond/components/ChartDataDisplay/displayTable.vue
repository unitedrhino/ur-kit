<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <n-table :bordered="false" :single-line="false" size="small" style="border-bottom-right-radius: 7px; border-bottom-left-radius: 7px">
    <thead>
      <tr>
        <th>key</th>
        <th>value</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(item, index) in tableArray.content" :key="index">
        <td>
          {{ item.key || editorT('bigscreenEditor.ui.noneAvailable') }}
        </td>
        <td>
          {{ item.value || editorT('bigscreenEditor.ui.noneAvailable') }}
        </td>
      </tr>
    </tbody>
  </n-table>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { type PropType, reactive, watch } from 'vue';
import type { RequestParamsObjType } from '@/enums/httpEnum';
import noData from '@/assets/images/canvas/noData.png';

const props = defineProps({
  target: Object as PropType<RequestParamsObjType>,
});

// 默认表格
const defaultItem = {
  key: '',
  value: '',
};
const tableArray = reactive<{
  content: (typeof defaultItem)[];
}>({ content: [] });

// 监听选项
watch(
  () => props.target as RequestParamsObjType,
  (target: RequestParamsObjType) => {
    tableArray.content = [];
    for (const k in target) {
      tableArray.content.push({
        key: k,
        // 索引签名访问可能为 undefined，缺省为空串（与模板"暂无"兜底一致）
        value: target[k] || '',
      });
    }
    // 默认值
    if (!tableArray.content.length) tableArray.content = [JSON.parse(JSON.stringify(defaultItem))];
  },
  {
    immediate: true,
    deep: true,
  },
);
</script>
