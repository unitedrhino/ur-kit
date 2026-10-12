<script lang="ts" setup>
import { useVbenModal } from '@vben/common-ui';
import { CoreApi } from '@vben/api';
import { $t } from '@vben/locales';

import { createProForm,
  ProForm,
  ProInput,
  ProInputOtp,
  // ProPassword
 } from 'pro-naive-ui'

import { useCaptcha } from '@vben/ur-hooks';

// 使用图片验证码 composable
const {
  captchaImgUrl,
  refreshCaptcha
} = useCaptcha(
  () => form.values.value.account,
  CoreApi.UserCaptchaReqUseEnum.FORGET_PWD,
  2 * 60 * 1000 // 2分钟自动刷新
);

const [Modal, modalApi] = useVbenModal({
  onOpenChange(isOpen: boolean) {
    refreshCaptcha();
    if (isOpen) {
      modalApi.getData<{ type: string; userInfo: CoreApi.UserInfo }>();
    }
  },
});

const form = createProForm({
  onSubmit: handleLogin,
});


function handleLogin(_values: any) {
  // TODO: 实现绑定逻辑
}

</script>
<template>
  <Modal :title="$t('orgManage.user.bindTitle')">
    <ProForm :form="form">
      <ProInput path="account" :label="$t('orgManage.user.account')"/>
      <ProInput
          path="imageCode"
          :label="$t('orgManage.user.imageCaptcha')"
          required
        >
          <template #suffix>
            <img :src="captchaImgUrl" style="height:32px;cursor:pointer;" :alt="$t('orgManage.user.imageCaptcha')" @click="refreshCaptcha" :title="$t('orgManage.user.refreshCaptcha')" />
          </template>
        </ProInput>
      <ProInputOtp path="code" name="code" :label="$t('orgManage.user.captcha')" />
    </ProForm>
  </Modal>
</template>
