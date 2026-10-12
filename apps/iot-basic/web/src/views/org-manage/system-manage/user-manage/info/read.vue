<script setup lang="ts">
import { notifyRequestError } from '@vben/saas/request-error';

import type { VbenFormSchema } from '@vben/saas';

import { onMounted, ref } from 'vue';

import { CoreApi } from '@vben/api';
import { Page, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { useUserStore } from '@vben/stores';

import {
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NGrid,
  NGridItem,
  NSpin,
  NSpace,
  useMessage,
  NTabs,
  NTabPane,
  NList,
  NListItem,
} from 'naive-ui';


import { useFileDialog } from '@vueuse/core';
import { useVbenForm, SaasAvatar } from '@vben/saas';

import { uploadFile } from '@vben/saas';


import { useTabs } from '@vben/hooks';

// import { renderProCopyableText,ProCopyableTextConfig } from 'pro-naive-ui'

import BindModel from './bindModel.vue';

const message = useMessage();
const userStore = useUserStore();

const loading = ref(false);
const editing = ref(false);
const userInfo = ref<CoreApi.UserInfo>();

const { refreshTab } = useTabs();


const [Modal, modalApi] = useVbenModal({
  connectedComponent: BindModel,
});

// 表单Schema
const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'userName',
    label: $t('orgManage.user.username'),
    componentProps: {
      disabled: true,
      placeholder: $t('orgManage.user.usernamePlaceholder'),
    },
  },
  {
    component: 'Input',
    fieldName: 'nickName',
    label: $t('orgManage.user.nickname'),
    componentProps: {
      placeholder: $t('orgManage.user.nicknamePlaceholder'),
    },
  },
  // {
  //   component: 'Input',
  //   fieldName: 'email',
  //   label: '邮箱',
  //   componentProps: {
  //     placeholder: '请输入邮箱',
  //   },
  //   // rules: 'email',
  // },
  // {
  //   component: 'Input',
  //   fieldName: 'phone',
  //   label: '手机号',
  //   componentProps: {
  //     placeholder: '请输入手机号',
  //   },
  // },
  {
    component: 'RadioGroup',
    fieldName: 'sex',
    label: $t('orgManage.user.gender'),
    componentProps: {
      options: [
        { label: $t('orgManage.user.unknown'), value: 0 },
        { label: $t('orgManage.user.male'), value: 1 },
        { label: $t('orgManage.user.female'), value: 2 },
      ],
    },
    defaultValue: 0,
  },
  {
    component: 'Input',
    fieldName: 'city',
    label: $t('orgManage.user.city'),
    componentProps: {
      placeholder: $t('orgManage.user.cityPlaceholder'),
    },
  },
];

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'horizontal',
  schema,
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 gap-4',
});

// 获取用户信息
async function fetchUserInfo() {
  try {
    loading.value = true;

    // 获取当前用户ID - 从store中获取
    const currentUserID = userStore.userInfo?.userID;

    if (!currentUserID) {
      message.error($t('orgManage.user.getUserIdFailed'));
      return;
    }

    const result = await CoreApi.postApiV1SystemUserInfoGetOne({
      userID: currentUserID,
    });

    userInfo.value = result;

    // 获取角色列表
    await CoreApi.postApiV1SystemRoleInfoGetList({});

  } catch (error: any) {
    notifyRequestError(error, () => error?.msg || $t('orgManage.user.getUserInfoFailed'), (text) => message.error(text));
    console.error('获取用户信息失败:', error);
  } finally {
    loading.value = false;
  }
}

// 保存用户信息
async function handleSave() {
  try {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }

    const values = await formApi.getValues();
    loading.value = true;

    if (userInfo.value?.userID) {
      await CoreApi.postApiV1SystemUserInfoUpdate({
        userID: userInfo.value?.userID,
        ...values,
      });
    }

    message.success($t('orgManage.common.saveSuccess'));
    editing.value = false;
    await fetchUserInfo();
  } catch (error: any) {
    notifyRequestError(error, () => error?.msg || $t('orgManage.common.saveFailed'), (text) => message.error(text));
    console.error('保存失败:', error);
  } finally {
    loading.value = false;
  }
}

// 进入编辑模式
function handleEdit() {
  editing.value = true;
  // 进入编辑模式时设置表单值
  if (userInfo.value) {
    setTimeout(() => {
      formApi.setValues({
        userName: userInfo.value?.userName || '',
        nickName: userInfo.value?.nickName || '',
        email: userInfo.value?.email || '',
        phone: userInfo.value?.phone || '',
        sex: userInfo.value?.sex || 0,
        city: userInfo.value?.city || '',
      });
    }, 50);
  }
}

// 取消编辑
function handleCancel() {
  editing.value = false;
}

// 获取性别文本
function getSexText(sex?: number) {
  const sexMap: Record<number, string> = {
    0: $t('orgManage.user.unknown'),
    1: $t('orgManage.user.male'),
    2: $t('orgManage.user.female'),
  };
  return sexMap[sex ?? 0] || $t('orgManage.user.unknown');
}

const { open, onChange } = useFileDialog({
  accept: 'image/png,image/jpg,image/jpeg',
});

onChange((file) => {
  if (file) {
    uploadFile(file[0] as File).then((res: any) => {
      const filePath = res.filePath;
      if (filePath) {
        message.success($t('orgManage.common.uploadSuccess'));
        CoreApi.postApiV1SystemUserSelfUpdate({
          avatar: filePath,
        }).then(() => {
          refreshTab();
        });
      }
    });
  }
});

// 编辑头像
function handleEditAvatar() {
  open();
}

// 获取头像URL

onMounted(async () => {
  await fetchUserInfo();
});



function handleBind(type: string) {
  modalApi.setData({
    type,
    userInfo: userInfo.value,
  }).open();
}

</script>

<template>
  <Page content-class="flex flex-col gap-4" :title="$t('orgManage.user.profileTitle')">
    <Modal />
    <NSpin :show="loading">
      <NGrid :cols="24" :x-gap="16" y-gap="16">
        <!-- 左侧：基本信息卡片 -->
        <NGridItem :span="24" :xl="8">
          <NCard :title="$t('orgManage.user.basicInfo')">
            <div class="flex flex-col items-center gap-4">
              <div class="relative">
                <SaasAvatar :avatar="userInfo?.avatar" :name="userInfo?.nickName || userInfo?.userName" :size="120" class="rounded-full" />

                <!-- 编辑头像小icon -->
                <div class="absolute bottom-0 right-0" @click="handleEditAvatar">
                  <span class="icon-[carbon--settings-edit] size-6">11</span>
                </div>
              </div>

              <div class="text-center">
                <div class="text-lg font-semibold">
                  {{ userInfo?.nickName || userInfo?.userName }}
                </div>
                <div class="text-foreground/60 mt-1 text-sm">
                  @{{ userInfo?.userName }}
                </div>
              </div>
            </div>

            <NDescriptions :column="1" bordered class="mt-6" label-placement="left" size="small">
              <NDescriptionsItem :label="$t('orgManage.user.account')">
                {{ userInfo?.userName || '-' }}
              </NDescriptionsItem>
              <NDescriptionsItem :label="$t('orgManage.user.userId')">
                {{ userInfo?.userID || '-' }}
              </NDescriptionsItem>
              <!-- <NDescriptionsItem label="状态">
                <NTag
                  :type="getStatusType(userInfo?.status)"
                  size="small"
                >
                  {{ getStatusText(userInfo?.status) }}
                </NTag>
              </NDescriptionsItem> -->
              <!-- <NDescriptionsItem label="设备数量">
                {{ userInfo?.deviceCount || 0 }}
              </NDescriptionsItem> -->
              <NDescriptionsItem :label="$t('orgManage.user.registerTime')">
                {{ new Date(parseInt(userInfo?.createdTime ?? '0') * 1000).toLocaleString() || '-' }}
              </NDescriptionsItem>
              <!-- <NDescriptionsItem v-if="userInfo?.tenant" label="企业">
                {{ userInfo.tenant.name || '-' }}
              </NDescriptionsItem> -->
            </NDescriptions>
          </NCard>
        </NGridItem>

        <!-- 右侧：详细信息编辑 -->
        <NGridItem :span="24" :xl="16">
          <NCard>
            <NTabs type="line" animated>

              <NTabPane name="info" :tab="$t('orgManage.user.detailInfo')" :title="$t('orgManage.user.detailInfo')">
                <NCard :bordered="false" content-style="padding: 0px;">
                  <div class="flex justify-end mb-4">
                    <NSpace v-if="!editing">
                      <NButton type="primary" @click="handleEdit">
                        {{ $t('orgManage.common.edit') }}
                      </NButton>
                    </NSpace>
                    <NSpace v-else>
                      <NButton @click="handleCancel">
                        {{ $t('orgManage.common.cancel') }}
                      </NButton>
                      <NButton type="primary" @click="handleSave">
                        {{ $t('orgManage.common.save') }}
                      </NButton>
                    </NSpace>
                  </div>
                  <!-- 编辑模式 -->
                  <div v-if="editing">
                    <Form />
                  </div>

                  <!-- 查看模式 -->
                  <NDescriptions v-else :column="2" bordered label-placement="left">
                    <NDescriptionsItem :label="$t('orgManage.user.username')">
                      {{ userInfo?.userName || '-' }}
                    </NDescriptionsItem>
                    <NDescriptionsItem :label="$t('orgManage.user.nickname')">
                      {{ userInfo?.nickName || '-' }}
                    </NDescriptionsItem>
                    <NDescriptionsItem :label="$t('orgManage.user.email')">
                      {{ userInfo?.email || '-' }}
                    </NDescriptionsItem>
                    <NDescriptionsItem :label="$t('orgManage.user.phoneNo')">
                      {{ userInfo?.phone || '-' }}
                    </NDescriptionsItem>
                    <NDescriptionsItem :label="$t('orgManage.user.gender')">
                      {{ getSexText(userInfo?.sex) }}
                    </NDescriptionsItem>
                    <NDescriptionsItem :label="$t('orgManage.user.city')">
                      {{ userInfo?.city || '-' }}
                    </NDescriptionsItem>
                    <NDescriptionsItem :label="$t('orgManage.user.province')">
                      {{ userInfo?.province || '-' }}
                    </NDescriptionsItem>
                    <NDescriptionsItem :label="$t('orgManage.user.country')">
                      {{ userInfo?.country || '-' }}
                    </NDescriptionsItem>
                    <NDescriptionsItem :label="$t('orgManage.user.language')">
                      {{ userInfo?.language || '-' }}
                    </NDescriptionsItem>
                    <NDescriptionsItem :label="$t('orgManage.user.lastLoginIp')">
                      {{ userInfo?.lastIP || '-' }}
                    </NDescriptionsItem>
                  </NDescriptions>
                </NCard>
              </NTabPane>

              <NTabPane name="bindInfo" :tab="$t('orgManage.user.bindInfo')" :title="$t('orgManage.user.bindInfo')">
                <NCard content-style="padding: 0px;" :bordered="false">

                  <NList hoverable clickable>
                    <!-- 手机 -->
                    <NListItem>
                      <div class="flex items-center justify-between w-full">
                        <div class="flex items-center gap-4">
                          <div class="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                            <span class="icon-[carbon--phone] size-6"></span>
                          </div>
                          <div>
                            <div class="font-medium">{{ $t('orgManage.user.phone') }}</div>
                            <div class="text-sm text-muted-foreground">
                              <span v-if="userInfo?.phone">{{ $t('orgManage.user.boundWith', { value: userInfo.phone }) }}</span>
                              <span v-else class="text-destructive">{{ $t('orgManage.user.unbound') }}</span>
                            </div>
                          </div>
                        </div>
                        <NButton size="small" :type="userInfo?.phone ? 'error' : 'primary'"
                          @click="handleBind('phone')">
                          {{ userInfo?.phone ? $t('orgManage.user.unbind') : $t('orgManage.user.bind') }}
                        </NButton>
                      </div>
                    </NListItem>

                    <!-- 邮箱 -->
                    <NListItem>
                      <div class="flex items-center justify-between w-full">
                        <div class="flex items-center gap-4">
                          <div class="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                            <span class="icon-[carbon--email] size-6"></span>
                          </div>
                          <div>
                            <div class="font-medium">{{ $t('orgManage.user.email') }}</div>
                            <div class="text-sm text-muted-foreground">
                              <span v-if="userInfo?.email">{{ $t('orgManage.user.boundWith', { value: userInfo.email }) }}</span>
                              <span v-else class="text-destructive">{{ $t('orgManage.user.unbound') }}</span>
                            </div>
                          </div>
                        </div>
                        <NButton size="small" :type="userInfo?.email ? 'error' : 'primary'"
                          @click="handleBind('email')">
                          {{ userInfo?.email ? $t('orgManage.user.unbind') : $t('orgManage.user.bind') }}
                        </NButton>
                      </div>
                    </NListItem>
                  </NList>
                </NCard>
              </NTabPane>
              <NTabPane name="roles" :tab="$t('orgManage.user.roleInfo')" :title="$t('orgManage.user.roleInfo')">
                <!-- 角色信息 -->
                <!-- <NCard v-if="userInfo?.roles && userInfo.roles.length > 0" class="mt-4" content-style="padding: 0px;"
                  :bordered="false">
                  <NSpace>
                    <NTag v-for="role in userInfo.roles" :key="role.id" type="info">
                      {{ role.name }}
                    </NTag>
                  </NSpace>
                </NCard> -->
              </NTabPane>
              <NTabPane name="depts" :tab="$t('orgManage.user.deptInfo')" :title="$t('orgManage.user.deptInfo')">
                <!-- 部门信息 -->
                <!-- <NCard v-if="userInfo?.depts && userInfo.depts.length > 0" class="mt-4" title="部门信息">
                  <NSpace>
                    <NTag v-for="dept in userInfo.depts" :key="dept.id" type="warning">
                      {{ dept.name }}
                    </NTag>
                  </NSpace>
                </NCard> -->
              </NTabPane>
            </NTabs>
          </NCard>


        </NGridItem>
      </NGrid>
    </NSpin>
  </Page>
</template>
