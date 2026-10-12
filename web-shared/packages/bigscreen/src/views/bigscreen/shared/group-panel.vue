<!-- 文件说明：共享大屏管理界面及交互，文案随当前语言更新。 -->
<script lang="ts" setup>
import { $t as t } from '@vben/saas/locales';

import { onMounted, ref } from 'vue';

import {
  NButton,
  NDivider,
  NDropdown,
  NIcon,
  NInput,
  NSpin,
  useMessage,
} from 'naive-ui';

import { getErrorMessage } from '../../../shared/error';
import { GroupApi, type GroupInfo } from './group.api';

const props = defineProps<{
  type: 'asset' | 'component' | 'dataset';
}>();

const emit = defineEmits<{
  select: [groupId: null | string];
}>();

const message = useMessage();
const loading = ref(false);
const groups = ref<GroupInfo[]>([]);
const activeId = ref<null | string>(null);
const addingName = ref('');
const isAdding = ref(false);
const editingId = ref<null | string>(null);
const editingName = ref('');

async function loadGroups() {
  loading.value = true;
  try {
    const res = await GroupApi.list(props.type);
    groups.value = res.list ?? [];
  } catch (error) {
    groups.value = [];
    message.error(t('bigscreenManagement.dynamic.failedToLoadGroups', { error: String(getErrorMessage(error)) }));
  } finally {
    loading.value = false;
  }
}

function onSelect(id: null | string) {
  activeId.value = id;
  emit('select', id);
}

async function onAdd() {
  const name = addingName.value.trim();
  if (!name) return;
  try {
    const res = await GroupApi.create({ name, type: props.type });
    message.success(t('orgManage.flow.groupCreated'));
    addingName.value = '';
    isAdding.value = false;
    await loadGroups();
    // 自动选中新创建的分组
    const newId = (res as any)?.data?.id || (res as any)?.id;
    if (newId) {
      onSelect(String(newId));
    }
  } catch (e: any) {
    message.error(e.msg || e.message || t('iotApp.schemaPage.createFailed'));
  }
}

function startEdit(group: GroupInfo) {
  editingId.value = group.id!;
  editingName.value = group.name || '';
}

async function onSaveEdit() {
  if (!editingId.value) return;
  const name = editingName.value.trim();
  if (!name) return;
  try {
    await GroupApi.update({ id: editingId.value, name });
    message.success(t('bigscreenManagement.ui.updated'));
    editingId.value = null;
    await loadGroups();
  } catch (e: any) {
    message.error(e.msg || e.message || t('orgManage.common.updateFailed'));
  }
}

async function onDelete(id: string) {
  try {
    await GroupApi.delete(id);
    message.success(t('iotApp.deviceDetail.deleted'));
    if (activeId.value === id) {
      onSelect(null);
    }
    await loadGroups();
  } catch (e: any) {
    message.error(e.msg || e.message || t('orgManage.common.deleteFailed'));
  }
}

function getDropdownOptions(group: GroupInfo) {
  return [
    { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('aiChat.ui.rename'); }, key: 'rename' },
    { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.common.delete'); }, key: 'delete' },
  ];
}

function onDropdownSelect(key: string, group: GroupInfo) {
  if (key === 'rename') {
    startEdit(group);
  } else if (key === 'delete') {
    onDelete(group.id!);
  }
}

onMounted(loadGroups);
</script>

<template>
  <div class="group-panel">
    <!-- 标题栏 -->
    <div class="group-panel__header">
      <span class="text-sm font-medium">{{ t('iotApp.project.tabGroups') }}</span>
      <NButton quaternary size="tiny" @click="isAdding = !isAdding">
        <template #icon>
          <NIcon><span class="icon-[mdi--plus]" /></NIcon>
        </template>
      </NButton>
    </div>

    <!-- 新建分组输入 -->
    <div v-if="isAdding" class="mb-2 flex gap-1 px-1">
      <NInput
        v-model:value="addingName"
        size="small"
        :placeholder="t('orgManage.flow.groupNameLabel')"
        @keyup.enter="onAdd"
      />
      <NButton size="small" type="primary" @click="onAdd">{{ t('orgManage.dept.confirm') }}</NButton>
    </div>

    <NSpin :show="loading">
      <div class="group-panel__list">
        <!-- 系统级筛选项 -->
        <div
          class="group-panel__item"
          :class="{ 'group-panel__item--active': activeId === null }"
          @click="onSelect(null)"
        >
          <NIcon size="16" class="mr-1.5 flex-shrink-0">
            <span class="icon-[mdi--folder-multiple-outline]" />
          </NIcon>
          <span class="truncate">{{ t('orgManage.common.all') }}</span>
        </div>

        <!-- 分割线 -->
        <NDivider v-if="groups.length > 0" style="margin: 6px 0" />

        <!-- 自定义分组 -->
        <div
          v-for="g in groups"
          :key="g.id"
          class="group-panel__item"
          :class="{ 'group-panel__item--active': activeId === g.id }"
          @click="onSelect(g.id!)"
        >
          <template v-if="editingId === g.id">
            <div class="flex flex-1 gap-1" @click.stop>
              <NInput
                v-model:value="editingName"
                size="tiny"
                @keyup.enter="onSaveEdit"
              />
              <NButton size="tiny" type="primary" @click="onSaveEdit">
                {{ t('orgManage.dept.confirm') }}
              </NButton>
            </div>
          </template>
          <template v-else>
            <NIcon size="16" class="mr-1.5 flex-shrink-0">
              <span
                :class="
                  activeId === g.id
                    ? 'icon-[mdi--folder-open-outline]'
                    : 'icon-[mdi--folder-outline]'
                "
              />
            </NIcon>
            <span class="min-w-0 flex-1 truncate">{{ g.name }}</span>
            <!-- Hover 更多操作 -->
            <NDropdown
              trigger="click"
              :options="getDropdownOptions(g)"
              @select="(key: string) => onDropdownSelect(key, g)"
            >
              <NButton
                quaternary
                size="tiny"
                class="group-panel__more"
                @click.stop
              >
                <NIcon><span class="icon-[mdi--dots-horizontal]" /></NIcon>
              </NButton>
            </NDropdown>
          </template>
        </div>
      </div>
    </NSpin>
  </div>
</template>

<style scoped>
.group-panel {
  display: flex;
  flex-direction: column;
  width: 200px;
  flex-shrink: 0;
  padding: 12px;
  background: var(--bigscreen-panel-bg);
  border: 1px solid var(--bigscreen-section-border);
  border-radius: var(--bigscreen-radius);
}

.group-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.group-panel__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}

.group-panel__item {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  position: relative;
  transition: background 0.15s;
  user-select: none;
}

/* 浅色模式 hover */
.group-panel__item:not(.group-panel__item--active):hover {
  background: var(--n-item-color-hover, #f3f4f6);

}

.dark .group-panel__item:not(.group-panel__item--active):hover {
  background: rgba(255, 255, 255, 0.06);
}

.group-panel__item--active {
  background: rgba(32, 128, 240, 0.08);
  font-weight: 500;
}

.group-panel__item--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 4px;
  width: 3px;
  border-radius: 2px;
  background: #2080f0;
}

.group-panel__more {
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.group-panel__item:hover .group-panel__more {
  opacity: 1;
}
</style>
