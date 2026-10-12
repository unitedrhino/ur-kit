<!--
  文件说明：FormRenderer — 选人字段控件（component=user）。
  Popover 弹层搜索租户用户（CoreApi.postApiV1SystemTenantUserGetList），
  支持 multiple 多选；值为 userID 字符串（多选为 string[]，见设计方案 2.6）。
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { CoreApi } from '@vben/api';

import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Input } from '@unitedrhino/saas-ui/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@unitedrhino/saas-ui/ui/popover';
import { ScrollArea } from '@unitedrhino/saas-ui/ui/scroll-area';

/** 候选用户（列表数据源条目） */
interface CandidateUser {
  avatar?: string;
  nickName: string;
  userID: string;
  userName: string;
}

const props = withDefaults(
  defineProps<{
    /** 是否禁用（只读态） */
    disabled?: boolean;
    /** 选中值：userID 字符串，multiple 时为 string[] */
    modelValue?: string | string[];
    /** 是否多选 */
    multiple?: boolean;
    /** 占位文案 */
    placeholder?: string;
  }>(),
  {
    modelValue: undefined,
    multiple: false,
    disabled: false,
    placeholder: '点击选择人员',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string | string[] | undefined];
}>();

/** 弹层开关 */
const open = ref(false);
/** 搜索关键字 */
const keyword = ref('');
/** 候选列表 */
const candidates = ref<CandidateUser[]>([]);
/** 加载中 */
const loading = ref(false);
/** 名称缓存（userID → nickName，用于回显与只读展示） */
const nameCache = ref<Map<string, string>>(new Map());

/** 已选值集合（统一转数组处理） */
const selectedIds = computed<string[]>(() => {
  if (Array.isArray(props.modelValue)) return props.modelValue;
  return props.modelValue ? [props.modelValue] : [];
});

/** 已选展示文案 */
const displayText = computed(() => {
  const ids = selectedIds.value;
  if (ids.length === 0) return '';
  return ids.map((id) => nameCache.value.get(id) || id).join('、');
});

/** searchUsers 按关键字拉取租户用户（userName 模糊匹配）。 */
async function searchUsers() {
  loading.value = true;
  try {
    const res = await CoreApi.postApiV1SystemTenantUserGetList({
      page: { page: 1, size: 50 },
      userName: keyword.value.trim() || undefined,
    });
    candidates.value = (res.list ?? []).map((item: any) => ({
      userID: String(item.userID ?? ''),
      nickName: item.user?.nickName || item.user?.userName || String(item.userID ?? ''),
      userName: item.user?.userName ?? '',
    }));
    // 名称缓存持续累积，保证已选回显
    for (const c of candidates.value) {
      nameCache.value.set(c.userID, c.nickName);
    }
  } finally {
    loading.value = false;
  }
}

/** toggle 切换某用户选中态。 */
function toggle(user: CandidateUser) {
  if (props.disabled) return;
  nameCache.value.set(user.userID, user.nickName);
  if (props.multiple) {
    const next = selectedIds.value.includes(user.userID) ? selectedIds.value.filter((id) => id !== user.userID) : [...selectedIds.value, user.userID];
    emit('update:modelValue', next);
  } else {
    emit('update:modelValue', user.userID);
    open.value = false;
  }
}

/** removeSelected 移除一个已选用户。 */
function removeSelected(id: string) {
  if (props.multiple) {
    emit(
      'update:modelValue',
      selectedIds.value.filter((v) => v !== id),
    );
  } else {
    emit('update:modelValue', undefined);
  }
}

// 打开弹层时重置搜索并加载首屏
watch(open, (v) => {
  if (v) {
    keyword.value = '';
    void searchUsers();
  }
});
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button variant="outline" role="combobox" class="w-full justify-between font-normal" :disabled="props.disabled">
          <span :class="displayText ? 'text-foreground' : 'text-muted-foreground'">
            {{ displayText || props.placeholder }}
          </span>
          <span class="icon-[carbon--chevron-down] size-4 shrink-0 opacity-50" aria-hidden="true"></span>
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-80 p-0" align="start">
        <div class="border-border flex items-center gap-2 border-b p-2">
          <Input v-model="keyword" class="h-8" placeholder="搜索用户名" @keyup.enter="searchUsers" />
          <Button class="h-8" size="sm" variant="outline" @click="searchUsers">搜索</Button>
        </div>
        <ScrollArea class="h-64">
          <div v-if="loading" class="text-muted-foreground p-4 text-center text-sm">加载中...</div>
          <div v-else-if="candidates.length === 0" class="text-muted-foreground p-4 text-center text-sm">暂无用户</div>
          <button
            v-for="user in candidates"
            v-else
            :key="user.userID"
            type="button"
            class="hover:bg-accent flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
            @click="toggle(user)"
          >
            <span class="min-w-0 flex-1 truncate">{{ user.nickName }}</span>
            <span class="text-muted-foreground truncate text-xs">{{ user.userName }}</span>
            <span v-if="selectedIds.includes(user.userID)" class="icon-[carbon--checkmark] text-primary size-4 shrink-0" aria-hidden="true"></span>
          </button>
        </ScrollArea>
      </PopoverContent>
    </Popover>

    <!-- 多选已选标签（可单独移除） -->
    <template v-if="props.multiple && selectedIds.length > 0">
      <span v-for="id in selectedIds" :key="id" class="bg-muted text-foreground flex items-center gap-1 rounded-full px-2 py-0.5 text-xs">
        {{ nameCache.get(id) || id }}
        <button v-if="!props.disabled" type="button" class="text-muted-foreground hover:text-foreground" @click="removeSelected(id)">×</button>
      </span>
    </template>
  </div>
</template>
