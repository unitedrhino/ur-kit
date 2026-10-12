<script setup lang="ts">
import { computed, ref } from 'vue';

import { NButton, NInput, NModal, NSpace } from 'naive-ui';

interface TagItem {
  key: string;
  value: string;
}

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    keyPlaceholder?: string;
    placeholder?: string;
    value?: TagItem[];
    valuePlaceholder?: string;
  }>(),
  {
    value: () => [],
    placeholder: '点击选择标签',
    keyPlaceholder: '键',
    valuePlaceholder: '值',
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: 'update:value', value: TagItem[]): void;
}>();

// 弹框显示状态
const dialogOpen = ref(false);

// 本地编辑状态（深拷贝，避免直接修改 props）
const localTags = ref<TagItem[]>([]);

// 计算显示值：key1:value1,key2:value2
const displayValue = computed(() => {
  // 确保 value 是数组
  const valueArray = Array.isArray(props.value) ? props.value : [];
  if (valueArray.length === 0) {
    return '';
  }
  return valueArray
    .filter((item) => item?.key || item?.value)
    .map((item) => `${item.key}:${item.value}`)
    .join(',');
});

// 打开弹框时，复制当前值到本地状态
function openDialog() {
  if (props.disabled) return;

  // 确保 value 是数组，并进行深拷贝
  const valueArray = Array.isArray(props.value) ? props.value : [];
  if (valueArray.length > 0) {
    localTags.value = valueArray.map((item) => ({ ...item }));
  } else {
    localTags.value = [{ key: '', value: '' }];
  }
  dialogOpen.value = true;
}

// 添加新标签
function addItem() {
  localTags.value.push({ key: '', value: '' });
}

// 删除标签
function removeItem(index: number) {
  localTags.value.splice(index, 1);
  // 如果删除后为空，自动添加一个空行
  if (localTags.value.length === 0) {
    localTags.value.push({ key: '', value: '' });
  }
}

// 取消
function cancel() {
  dialogOpen.value = false;
}

// 确认
function confirm() {
  // 过滤掉空的标签
  const validTags = localTags.value.filter(
    (item) => item.key.trim() || item.value.trim(),
  );
  emit('update:value', validTags);
  dialogOpen.value = false;
}
</script>

<template>
  <div class="tag-filter-input w-full">
    <!-- 触发器：只读输入框显示已选标签 -->
    <NInput
      :value="displayValue"
      :placeholder="placeholder"
      :disabled="disabled"
      readonly
      @click="openDialog"
    />

    <!-- 弹框 -->
    <NModal v-model:show="dialogOpen" preset="card" style="width: 500px">
      <template #header>
        <span>标签筛选</span>
      </template>

      <!-- 标签列表 -->
      <div class="space-y-2">
        <div
          v-for="(item, index) in localTags"
          :key="index"
          class="flex items-center gap-2"
        >
          <NInput
            v-model:value="item.key"
            :placeholder="keyPlaceholder"
            class="flex-1"
          />
          <NInput
            v-model:value="item.value"
            :placeholder="valuePlaceholder"
            class="flex-1"
          />
          <NButton
            quaternary
            circle
            @click="removeItem(index)"
          >
            <template #icon>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </template>
          </NButton>
        </div>
      </div>

      <!-- 添加按钮 -->
      <div class="mt-3">
        <NButton text type="primary" @click="addItem"> 添加新标签 </NButton>
      </div>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="cancel">取消</NButton>
          <NButton type="primary" @click="confirm">确定</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>
