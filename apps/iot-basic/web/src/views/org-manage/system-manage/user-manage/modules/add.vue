<script lang="ts" setup>
import { notifyRequestError } from '@vben/saas/request-error';

import { $t } from '@vben/locales';
import type { CoreApi } from '@vben/api';

import { computed, onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  NButton,
  NCard,
  NEmpty,
  NInput,
  NSelect,
  NSpin,
  NTag,
  NTreeSelect,
  useMessage,
} from 'naive-ui';

// import { getDeptList } from '#/api/system/dept';
// import { getRoleList } from '#/api/system/role';

import { Api } from '../index.api';

const emit = defineEmits(['success']);
const message = useMessage();

// 搜索关键词
const searchKeyword = ref('');
// 搜索中状态
const searching = ref(false);
// 当前搜索到的用户
const searchedUser = ref<CoreApi.UserInfo | null>(null);
// 已选中的用户列表
const selectedUsers = ref<CoreApi.UserInfo[]>([]);
// 提交中状态
const submitting = ref(false);

// 角色列表
const roleOptions = ref<{ label: string; value: number }[]>([]);
// 部门列表（树形）
const deptOptions = ref<any[]>([]);
// 选中的角色IDs（必填）
const selectedRoleIds = ref<number[]>([]);
// 选中的部门IDs（可选）
const selectedDeptIds = ref<number[]>([]);
// 加载角色/部门中
const loadingOptions = ref(false);

// 加载角色和部门选项
async function loadRoleAndDeptOptions() {
  loadingOptions.value = true;
  try {
    // // 并行加载角色和部门
    // const [roleRes, deptRes] = await Promise.all([
    //   getRoleList({ page: { page: 1, size: 100 } }),
    //   getDeptList(),
    // ]);

    // // 处理角色选项
    // if (roleRes?.list) {
    //   roleOptions.value = roleRes.list.map((item: any) => ({
    //     label: item.name,
    //     value: Number(item.id),
    //   }));
    // }

    // // 处理部门选项（树形）
    // if (deptRes) {
    //   deptOptions.value = convertDeptToTreeSelect(deptRes);
    // }
  } catch (requestError) {
    notifyRequestError(requestError, () => $t('orgManage.user.loadRoleDeptFailed'), (text) => message.error(text));
  } finally {
    loadingOptions.value = false;
  }
}

// 转换部门为树形选择器格式
// function convertDeptToTreeSelect(depts: any[]): any[] {
//   return depts.map((dept) => ({
//     key: Number(dept.id),
//     label: dept.name,
//     children: dept.children ? convertDeptToTreeSelect(dept.children) : undefined,
//   }));
// }

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (selectedUsers.value.length === 0) {
      message.warning($t('orgManage.user.selectUsersFirst'));
      return;
    }

    if (selectedRoleIds.value.length === 0) {
      message.warning($t('orgManage.user.selectRoleFirst'));
      return;
    }

    submitting.value = true;
    modalApi.lock();

    try {
      const users = selectedUsers.value.map((u) => ({
        userID: String(u.userID),
        roleIDs: selectedRoleIds.value.map(id => String(id)),
        deptIDs: selectedDeptIds.value.length > 0 ? selectedDeptIds.value.map(id => String(id)) : undefined,
      }));
      await Api.multiCreate({ users });
      message.success($t('orgManage.user.addSuccess'));
      emit('success');
      modalApi.close();
    } catch (requestError) {
      notifyRequestError(requestError, () => $t('orgManage.user.addFailed'), (text) => message.error(text));
    } finally {
      submitting.value = false;
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      // 重置状态
      searchKeyword.value = '';
      searchedUser.value = null;
      selectedUsers.value = [];
      selectedRoleIds.value = [];
      selectedDeptIds.value = [];
      // 加载角色和部门选项
      loadRoleAndDeptOptions();
    }
  },
});

// 搜索用户
async function handleSearch() {
  if (!searchKeyword.value.trim()) {
    message.warning($t('orgManage.user.accountPlaceholder'));
    return;
  }

  searching.value = true;
  searchedUser.value = null;

  try {
    const res = await Api.searchUser(searchKeyword.value.trim());
    if (res) {
      searchedUser.value = res as unknown as CoreApi.UserInfo;
    } else {
      message.info($t('orgIotClient.org.userNotFound'));
    }
  } catch (error) {
    // 业务码 100009（未查询到）：账号在平台不存在，属正常未命中而非接口故障
    const errData = (error as any)?.data ?? {};
    const notFound = errData.code === 100009 || errData.msg === '未查询到';
    if (notFound) {
      message.warning($t('orgIotClient.org.userNotFoundRegister'));
    } else {
      notifyRequestError(error, () => $t('orgManage.user.searchFailed'), (text) => message.error(text));
    }
  } finally {
    searching.value = false;
  }
}

// 添加用户到选中列表
function handleSelectUser(user: CoreApi.UserInfo) {
  // 检查是否已存在
  const exists = selectedUsers.value.some((u) => u.userID === user.userID);
  if (exists) {
    message.warning($t('orgManage.user.alreadyInList'));
    return;
  }
  selectedUsers.value.push(user);
  // 清空搜索结果，方便继续搜索
  searchedUser.value = null;
  searchKeyword.value = '';
  message.success($t('orgManage.user.addedToList'));
}

// 从选中列表移除用户
function handleRemoveUser(userID: string | number | undefined) {
  if (!userID) return;
  selectedUsers.value = selectedUsers.value.filter((u) => u.userID !== userID);
}

// 是否已选中
function isSelected(userID: string | number | undefined) {
  if (!userID) return false;
  return selectedUsers.value.some((u) => u.userID === userID);
}

const getTitle = computed(() => $t('orgManage.user.addTitle'));

onMounted(() => {
  // 预加载选项
});
</script>

<template>
  <Modal :title="getTitle" class="w-[600px]">
    <div class="flex flex-col gap-4 p-4">
      <!-- 搜索区域 -->
      <div class="flex gap-2">
        <NInput
          v-model:value="searchKeyword"
          :placeholder="$t('orgManage.user.searchPlaceholder')"
          clearable
          @keyup.enter="handleSearch"
        />
        <NButton type="primary" :loading="searching" @click="handleSearch">
          {{ $t('orgManage.common.search') }}
        </NButton>
      </div>

      <!-- 搜索结果 -->
      <NSpin :show="searching">
        <NCard v-if="searchedUser" :title="$t('orgManage.user.searchResult')" size="small">
          <div class="flex items-center justify-between">
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2">
                <span class="font-medium">{{ searchedUser.userName || searchedUser.nickName }}</span>
                <NTag v-if="searchedUser.nickName" size="small" type="info">
                  {{ searchedUser.nickName }}
                </NTag>
              </div>
              <div class="text-sm text-gray-500">
                {{ $t('orgManage.user.accountValue', { value: searchedUser.userName }) }}
              </div>
              <div v-if="searchedUser.phone" class="text-sm text-gray-500">
                {{ $t('orgManage.user.phoneValue', { value: searchedUser.phone }) }}
              </div>
              <div v-if="searchedUser.email" class="text-sm text-gray-500">
                {{ $t('orgManage.user.emailValue', { value: searchedUser.email }) }}
              </div>
            </div>
            <NButton
              :type="isSelected(searchedUser.userID) ? 'default' : 'primary'"
              :disabled="isSelected(searchedUser.userID)"
              size="small"
              @click="handleSelectUser(searchedUser)"
            >
              {{ isSelected(searchedUser.userID) ? $t('orgManage.user.selected') : $t('orgManage.user.select') }}
            </NButton>
          </div>
        </NCard>
        <div
          v-else-if="!searching && searchKeyword"
          class="py-4 text-center text-gray-400"
        >
          {{ $t('orgManage.user.searchHint') }}
        </div>
      </NSpin>

      <!-- 已选用户列表 -->
      <NCard :title="$t('orgManage.user.pendingUsers')" size="small">
        <template #header-extra>
          <NTag type="info" size="small">
            {{ $t('orgManage.user.peopleCount', { count: selectedUsers.length }) }}
          </NTag>
        </template>
        <div v-if="selectedUsers.length === 0">
          <NEmpty :description="$t('orgManage.user.pendingEmpty')" />
        </div>
        <div v-else class="flex flex-col gap-2">
          <div
            v-for="user in selectedUsers"
            :key="user.userID"
            class="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800"
          >
            <div class="flex items-center gap-2">
              <span>{{ user.userName || user.nickName }}</span>
              <NTag v-if="user.nickName && user.userName" size="tiny" type="info">
                {{ user.nickName }}
              </NTag>
            </div>
            <NButton
              type="error"
              size="tiny"
              text
              @click="handleRemoveUser(user.userID)"
            >
              {{ $t('orgManage.user.remove') }}
            </NButton>
          </div>
        </div>
      </NCard>

      <!-- 角色和部门选择 -->
      <NCard :title="$t('orgManage.user.roleDeptSettings')" size="small">
        <template #header-extra>
          <span class="text-xs text-gray-400">{{ $t('orgManage.user.applyToAll') }}</span>
        </template>
        <NSpin :show="loadingOptions">
          <div class="flex flex-col gap-3">
            <!-- 角色选择（必填） -->
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-1">
                <span class="text-sm font-medium">{{ $t('orgManage.user.role') }}</span>
                <span class="text-red-500">*</span>
              </div>
              <NSelect
                v-model:value="selectedRoleIds"
                :options="roleOptions"
                multiple
                :placeholder="$t('orgManage.user.rolePlaceholder')"
                clearable
                :max-tag-count="3"
              />
            </div>

            <!-- 部门选择（可选） -->
            <div class="flex flex-col gap-1">
              <span class="text-sm font-medium">{{ $t('orgManage.user.dept') }}</span>
              <NTreeSelect
                v-model:value="selectedDeptIds"
                :options="deptOptions"
                multiple
                :placeholder="$t('orgManage.user.deptPlaceholder')"
                clearable
                checkable
                cascade
                check-strategy="child"
                :max-tag-count="3"
              />
            </div>
          </div>
        </NSpin>
      </NCard>
    </div>
  </Modal>
</template>
