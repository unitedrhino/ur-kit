<script lang="ts" setup>
import { computed, defineEmits, defineProps, ref, watch } from 'vue';

import { Button } from '@vben-core/shadcn-ui';
import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { useQRCode } from '@vueuse/integrations/useQRCode';
import { CoreApi } from '@vben/api';

import { getAppOpenUrl } from '../utils';

/** 小程序二维码弹窗的数据模型 */
export interface MiniProgramLaunchInfo {
  /** 小程序应用 ID */
  appID?: string;
  /** 小程序名称 */
  appName?: string;
  /** 当前企业号 */
  orgId?: string;
}

const MINI_PROGRAM_LAUNCH_PAGE = '/app/console/mini-launch.html';

const props = withDefaults(
  defineProps<{
    /** 模态窗打开状态 */
    modelValue: boolean;
    /** 弹窗展示的数据 */
    payload: MiniProgramLaunchInfo | null;
  }>(),
  {
    modelValue: false,
    payload: null,
  },
);
const emit = defineEmits<{
  /** 同步 v-model 状态 */
  'update:modelValue': [isOpen: boolean];
}>();

/** 是否正在获取 URL Link */
const loading = ref(false);

/** 获取 URL Link 失败时的错误文案 */
const error = ref('');

/** 后端返回的微信 URL Link */
const urlLink = ref('');

/** 重置弹窗状态 */
function resetState() {
  loading.value = false;
  error.value = '';
  urlLink.value = '';
}

/** 构造拉起小程序时透传给 mobile-uniapp 的 query。 */
function buildMiniProgramLaunchQuery(appID?: string, orgId?: string): string {
  const normalizedOrgId = orgId?.trim();
  if (!normalizedOrgId) {
    return '';
  }

  const searchParams = new URLSearchParams();
  searchParams.set('org-id', normalizedOrgId);
  searchParams.set('from', 'console');
  if (appID) {
    searchParams.set('appID', appID);
  }
  return searchParams.toString();
}

/** 调用后端接口生成小程序 URL Link */
async function fetchUrlLink() {
  const appID = props.payload?.appID;
  const orgId = props.payload?.orgId;
  if (!appID) {
    error.value = '缺少应用 ID';
    return;
  }
  if (!orgId?.trim()) {
    error.value = '未获取到当前企业号，请重新选择企业后重试';
    return;
  }

  resetState();
  loading.value = true;
  try {
    const resp = await CoreApi.postApiV1SystemAppInfoWxMiniGetUrlLink({
      appID,
      query: buildMiniProgramLaunchQuery(appID, orgId),
    });
    const link = resp?.urlLink?.trim();
    if (!link) {
      error.value = '未获取到小程序链接';
      return;
    }
    urlLink.value = link;
  } catch (e: any) {
    error.value = e?.message || '获取小程序链接失败';
  } finally {
    loading.value = false;
  }
}

const miniProgramLaunchPath = computed(() => {
  if (!urlLink.value) {
    return '';
  }

  const consoleUrl = getAppOpenUrl('/app/console/');
  if (!consoleUrl) {
    return '';
  }

  const normalizedConsoleUrl = consoleUrl.replace(/\/+$/, '');
  const basePath = normalizedConsoleUrl.includes('/app/console')
    ? `${normalizedConsoleUrl}/mini-launch.html`
    : `${normalizedConsoleUrl}${MINI_PROGRAM_LAUNCH_PAGE}`;

  return buildMiniProgramLaunchUrl({
    appID: props.payload?.appID,
    basePath,
    urlLink: urlLink.value,
  });
});

const miniProgramLaunchUrl = computed(() => {
  if (!miniProgramLaunchPath.value) {
    return '';
  }
  return new URL(miniProgramLaunchPath.value, window.location.origin).toString();
});

const miniProgramQRCode = useQRCode(miniProgramLaunchUrl, {
  errorCorrectionLevel: 'H',
  margin: 2,
});

const miniProgramLaunchCanUse = computed(() => !!miniProgramLaunchUrl.value);

const [MiniProgramLaunchModal, miniProgramLaunchModalApi] = useVbenModal({
  centered: true,
  class: 'w-[420px] max-w-[calc(100vw-32px)]',
  footer: false,
  overlayBlur: 4,
  title: '打开微信小程序',
  onOpenChange(isOpen) {
    emit('update:modelValue', isOpen);
  },
});

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      miniProgramLaunchModalApi.open();
      fetchUrlLink();
      return;
    }
    miniProgramLaunchModalApi.close();
    resetState();
  },
  {
    immediate: true,
  },
);

// payload 切换时（弹窗保持打开），重新获取对应小程序的 URL Link。
watch(
  () => props.payload?.appID,
  () => {
    if (props.modelValue && props.payload?.appID) {
      fetchUrlLink();
    }
  },
);

function openMiniProgramLaunchPage() {
  if (!miniProgramLaunchUrl.value) {
    return;
  }
  window.open(miniProgramLaunchUrl.value, '_blank', 'noopener,noreferrer');
}

/**
 * 构造 console 静态中转页地址。
 * @param params - 应用 ID、微信 URL Link 与可选中转页路径
 * @returns 可写入二维码的中转页路径
 */
function buildMiniProgramLaunchUrl(params: {
  appID?: string;
  basePath: string;
  urlLink: string;
}): string {
  const searchParams = new URLSearchParams();
  if (params.appID) {
    searchParams.set('appID', params.appID);
  }
  searchParams.set('scheme', params.urlLink);

  return `${params.basePath}?${searchParams.toString()}`;
}
</script>

<template>
  <MiniProgramLaunchModal :title="`打开微信小程序${payload?.appName ? ` - ${payload.appName}` : ''}`">
    <div class="px-1 pb-2 pt-1">
      <div
        v-if="loading"
        class="text-muted-foreground flex items-center justify-center gap-2 py-10"
      >
        <IconifyIcon icon="lucide:loader-2" class="size-5 shrink-0 animate-spin" />
        <span>正在生成小程序链接…</span>
      </div>

      <div
        v-else-if="error"
        class="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
      >
        <div class="flex items-start gap-2">
          <IconifyIcon icon="mdi:alert-circle-outline" class="mt-0.5 size-4 shrink-0" />
          <div class="leading-relaxed">
            {{ error }}
          </div>
        </div>
      </div>

      <div v-else-if="!miniProgramLaunchCanUse" class="text-muted-foreground py-10 text-center">
        未获取到可用二维码链接
      </div>

      <div v-else class="flex flex-col items-center">
        <div class="rounded-sm border border-border bg-white p-3 shadow-sm dark:bg-card">
          <img :src="miniProgramQRCode" alt="微信小程序二维码" class="size-52" />
        </div>
        <div class="mt-4 text-center">
          <div class="text-sm font-medium text-foreground">微信扫码打开小程序</div>
        </div>
        <Button class="mt-5 w-full" variant="outline" @click="openMiniProgramLaunchPage">
          <IconifyIcon icon="mdi:open-in-new" class="mr-2 size-4" />
          打开中转页
        </Button>
      </div>
    </div>
  </MiniProgramLaunchModal>
</template>
