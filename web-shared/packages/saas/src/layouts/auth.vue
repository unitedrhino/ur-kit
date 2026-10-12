<script lang="ts" setup>
/** 共享认证布局，统一显示品牌页脚、当前应用及密码登录兼容入口。 */
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { AuthPageLayout } from '@vben/layouts';
import { useSystemConfigStore } from '@vben/stores';

import { getAvatarUrl } from '../utils';
import CurrentAppBadge from '../views/_core/authentication/current-app-badge.vue';
import PasswordModeSwitch from '../views/_core/authentication/password-mode-switch.vue';
import { resolveLoginOemConfig, resolveSloganImage } from './login-oem';

// import { $t } from '#/locales';

const systemConfigStore = useSystemConfigStore();
/** route.name 在普通和企业前缀登录路径中均为 Login。 */
const route = useRoute();

const loginOemConfig = computed(() => resolveLoginOemConfig(systemConfigStore.systemConfig?.oem));
const appName = computed(() => loginOemConfig.value.title);
const logo = computed(() => {
  return getAvatarUrl(systemConfigStore.systemConfig?.oem?.avatar || '');
});
const pageTitle = computed(() => loginOemConfig.value.loginPageTitle);
const pageDescription = computed(() => loginOemConfig.value.loginPageDescription);
const sloganImage = computed(() => resolveSloganImage(loginOemConfig.value));
const copyrightDate = computed(() => {
  return systemConfigStore.systemConfig?.oem?.footer?.date || new Date().getFullYear();
});
const footer = computed(() => systemConfigStore.systemConfig?.oem?.footer);
</script>

<template>
  <AuthPageLayout
  :app-name="appName" :logo="logo" :page-title="pageTitle" :page-description="pageDescription"
    :slogan-image="sloganImage">
    <!-- 自定义工具栏 -->
    <!-- <template #toolbar></template> -->
    <template #copyright>
      <div class="flex max-w-[calc(100vw-3rem)] flex-col items-center gap-1">
        <div class="flex flex-wrap items-center justify-center">
          <template v-if="footer?.isEnable === 1">
            <span>Copyright © {{ copyrightDate }}</span>
            <a
              v-if="footer.companyName && footer.companySiteLink"
              :href="footer.companySiteLink"
              class="hover:text-primary mx-1"
              rel="noopener noreferrer"
              target="_blank"
            >
              {{ footer.companyName }}
            </a>
            <span v-else-if="footer.companyName" class="mx-1">{{ footer.companyName }}</span>
            <CurrentAppBadge />
          </template>
          <template v-if="route.name === 'Login'">
            <span v-if="footer?.isEnable === 1" aria-hidden="true" class="mx-1">｜</span>
            <PasswordModeSwitch />
          </template>
        </div>
        <div
          v-if="footer?.isEnable === 1 && (footer.icp || footer.beian)"
          class="flex flex-wrap items-center justify-center gap-x-3"
        >
          <a
            v-if="footer.beian"
            :href="footer.beianLink || undefined"
            class="hover:text-primary !underline"
            rel="noopener noreferrer"
            target="_blank"
          >
            {{ footer.beian }}
          </a>
          <a
            v-if="footer.icp"
            :href="footer.icpLink || undefined"
            class="hover:text-primary !underline"
            rel="noopener noreferrer"
            target="_blank"
          >
            {{ footer.icp }}
          </a>
        </div>
      </div>
    </template>
  </AuthPageLayout>
</template>
