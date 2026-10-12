<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script lang="ts" setup>
import { $t as editorT } from '@vben/saas/locales';

import { h, ref } from 'vue';

import { GoSystemInfo } from '@/components/GoSystemInfo/index';
import { GoSystemSet } from '@/components/GoSystemSet/index';
import { icon } from '@/plugins';
import { logout, renderIcon, renderLang } from '@/utils';
import { NAvatar, NText } from 'naive-ui';

import Person from './person.png';

const { ChatboxEllipsesIcon, PersonIcon, LogOutOutlineIcon, SettingsSharpIcon } = icon.ionicons5;

const t = window.$t;

const modelShowInfo = ref(false);
const modelShow = ref(false);

// 是否失败
const fallback = ref(false);

// 用户图标渲染
const renderUserInfo = () => {
  return h(
    'div',
    {
      style: 'display: flex; align-items: center; padding: 8px 12px;',
    },
    [
      h(NAvatar, {
        round: true,
        style: 'margin-right: 12px;',
        src: Person,
      }),
      h('div', null, [h('div', null, [h(NText, { depth: 2 }, { default: () => editorT('bigscreenEditor.ui.animatedLineEffect') })])]),
    ],
  );
};
const options = ref([
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.myInformation'); },
    key: 'info',
    type: 'render',
    render: renderUserInfo,
  },
  {
    type: 'divider',
    key: 'd1',
  },
  {
    label: renderLang('global.sys_set'),
    key: 'sysSet',
    icon: renderIcon(SettingsSharpIcon),
  },
  {
    label: renderLang('global.contact'),
    key: 'contact',
    icon: renderIcon(ChatboxEllipsesIcon),
  },
  {
    type: 'divider',
    key: 'd3',
  },
  {
    label: renderLang('global.logout'),
    key: 'logout',
    icon: renderIcon(LogOutOutlineIcon),
  },
]);

// 图片渲染错误
const errorHandle = (e: Event) => {
  fallback.value = true;
};

// 系统设置
const sysSetHandle = () => {
  modelShow.value = true;
};

// 系统设置
const sysInfoHandle = () => {
  modelShowInfo.value = true;
};

const handleSelect = (key: string) => {
  switch (key) {
    case 'contact': {
      sysInfoHandle();
      break;
    }
    case 'logout': {
      logout();
      break;
    }
    case 'sysSet': {
      sysSetHandle();
      break;
    }
  }
};
</script>

<template>
  <n-dropdown trigger="hover" @select="handleSelect" :show-arrow="true" :options="options">
    <div class="user-info-box">
      <PersonIcon v-if="fallback" />
      <NAvatar v-if="!fallback" round object-fit="cover" size="medium" :src="Person" @error="errorHandle" />
    </div>
  </n-dropdown>

  <!-- 系统设置 model -->
  <GoSystemSet v-model:model-show="modelShow" />
  <!-- 关于软件 model -->
  <GoSystemInfo v-model:model-show="modelShowInfo" />
</template>

<style lang="scss" scoped>
.user-info-box {
  cursor: pointer;
  transform: scale(0.7);
}
</style>
