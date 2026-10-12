<script setup lang="ts">
/**
 * 资讯列表组件
 *
 * 展示 type=news 的资讯列表。
 * - 侧栏：默认 h-full + 自带「资讯」标题。
 * - 嵌入主内容：`embedded` + `showHeading=false`，由页面提供区域标题。
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useCookies } from '@vueuse/integrations/useCookies';
import { CoreApi } from '@vben/api';
import { ORG_ID_KEY } from '../constants';
import { getAvatarUrl } from '../utils';
import { sanitizeUserMessageBodyHtml } from '../utils/notification-body';

interface NewsItem {
  id: number;
  title: string;
  body: string;
  coverImage?: string;
  actionText?: string;
  actionUrl?: string;
  notifyTime: number;
}

const props = withDefaults(
  defineProps<{
    /** 嵌入主内容区（非侧栏）：不占满高度，列表区域可滚动 */
    embedded?: boolean;
    /** 是否显示组件内「资讯」标题（嵌入时一般由页面标题替代） */
    showHeading?: boolean;
  }>(),
  {
    embedded: false,
    showHeading: true,
  },
);

const cookies = useCookies([ORG_ID_KEY]);

/** 全局资讯消息落在 platform 租户下；与当前 org cookie 可能不一致，需显式指定 */
const newsTenantHeader = () => {
  const code = (import.meta.env.VITE_GLOB_TENANT_CODE as string | undefined)?.trim();
  return { 'tenant-code': code || 'platform' };
};

const newsList = ref<NewsItem[]>([]);
const loading = ref(true);
/** 是否展示列表区域骨架（首屏无数据、或用户点击刷新时为 true；定时静默刷新不铺满骨架） */
const showListSkeleton = ref(true);

// 详情弹窗状态
const detailVisible = ref(false);
const detailNews = ref<NewsItem | null>(null);
// XSS 防护：富文本正文渲染前经白名单净化（fastbee 公告漏洞④对应修复）
const sanitizedDetailBody = computed(() =>
  sanitizeUserMessageBodyHtml(detailNews.value?.body ?? ''),
);

async function loadNews(opts?: { listSkeleton?: boolean }) {
  loading.value = true;
  showListSkeleton.value =
    newsList.value.length === 0 || opts?.listSkeleton === true;
  try {
    const res = await CoreApi.postApiV1SystemUserSelfMessageGetList(
      {
        page: { page: 1, size: 10 },
        group: 'news',
      },
      { headers: newsTenantHeader() },
    );
    // 兼容不同 requestClient 包装层：有的环境直接返回 data，有的保留 { code, data }
    const rawList = (res as any)?.list ?? (res as any)?.data?.list ?? [];
    newsList.value = rawList.map((item: any) => ({
        id: Number(item.id),
        title: item.message?.subject || '',
        body: item.message?.body || '',
        coverImage: item.message?.coverImage,
        actionText: item.message?.actionText,
        actionUrl: item.message?.actionURL,
        notifyTime: item.message?.notifyTime || 0,
      }));
  } catch (error) {
    console.error('加载资讯失败:', error);
  } finally {
    loading.value = false;
    showListSkeleton.value = false;
  }
}

function openDetail(news: NewsItem) {
  detailNews.value = news;
  detailVisible.value = true;
}

function closeDetail() {
  detailVisible.value = false;
  detailNews.value = null;
}

function openAction(url?: string) {
  if (url) window.open(url, '_blank');
}

/** 列表时间展示（兼容秒/毫秒） */
function formatNewsTime(ts: number): string {
  if (!ts) return '';
  const ms = ts < 1e12 ? ts * 1000 : ts;
  const d = new Date(ms);
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  if (d.toDateString() === now.toDateString()) {
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  if (y === now.getFullYear()) {
    return `${m}-${day}`;
  }
  return `${y}-${m}-${day}`;
}

// 刷新定时器
let refreshTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  loadNews();
  // 每5分钟刷新一次
  refreshTimer = setInterval(loadNews, 5 * 60 * 1000);
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});

// 监听租户切换，重新加载数据
watch(
  () => cookies.get(ORG_ID_KEY),
  (newOrgID, oldOrgID) => {
    if (newOrgID !== oldOrgID) {
      loadNews();
    }
  }
);

// 暴露刷新方法（与手动刷新一致：列表骨架 + 转圈）
defineExpose({ refresh: () => loadNews({ listSkeleton: true }) });
</script>

<template>
  <div
    :class="[
      'notify-news-panel flex flex-col',
      props.embedded ? 'min-h-0 w-full' : 'h-full',
    ]">
    <div v-if="props.showHeading" class="mb-4 flex items-center justify-between">
      <h3 class="text-lg font-semibold text-foreground">资讯</h3>
      <button
        type="button"
        class="text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        aria-label="刷新资讯"
        :disabled="loading"
        @click="loadNews({ listSkeleton: true })"
      >
        <span class="icon-[lucide--refresh-cw] size-4" :class="{ 'animate-spin': loading }" />
      </button>
    </div>
    <div v-else :class="['flex justify-end', props.embedded ? 'mb-1' : 'mb-3']">
      <button
        type="button"
        class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/80 bg-background/80 text-muted-foreground shadow-sm transition-colors hover:border-primary/30 hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
        aria-label="刷新资讯"
        :disabled="loading"
        @click="loadNews({ listSkeleton: true })"
      >
        <span class="icon-[lucide--refresh-cw] size-3.5" :class="{ 'animate-spin': loading }" />
      </button>
    </div>

    <!-- 加载状态（首屏 / 手动刷新铺满骨架；定时刷新仅按钮转圈） -->
    <div
      v-if="loading && showListSkeleton"
      aria-busy="true"
      :class="[
        props.embedded ? 'min-h-[200px] space-y-2 rounded-xl border border-border/50 bg-card p-2' : 'space-y-4',
      ]"
    >
      <template v-if="props.embedded">
        <div
          v-for="i in 4"
          :key="i"
          class="flex animate-pulse gap-3 rounded-lg border border-border/40 bg-card p-3"
        >
          <div class="h-14 w-20 shrink-0 rounded-md bg-muted" />
          <div class="min-w-0 flex-1 space-y-2 py-0.5">
            <div class="h-4 rounded bg-muted" :style="{ width: `${72 + i * 4}%` }" />
            <div class="h-3 w-24 rounded bg-muted/80" />
          </div>
        </div>
      </template>
      <template v-else>
        <div v-for="i in 3" :key="i" class="overflow-hidden rounded-xl border border-border/60 animate-pulse">
          <div class="h-32 bg-muted" />
          <div class="space-y-2 p-3">
            <div class="h-4 w-3/4 rounded bg-muted" />
            <div class="h-3 w-full rounded bg-muted" />
            <div class="h-3 w-1/2 rounded bg-muted" />
          </div>
        </div>
      </template>
    </div>

    <!-- 嵌入主内容：横向列表行 -->
    <div
      v-else-if="newsList.length > 0 && props.embedded"
      class="max-h-[min(520px,55vh)] overflow-y-auto rounded-xl border border-border/55 bg-card pr-1 shadow-sm dark:border-border/50 dark:bg-card"
    >
      <ul class="divide-y divide-border/60" role="list">
        <li
          v-for="news in newsList"
          :key="news.id"
        >
          <button
            type="button"
            class="flex w-full gap-3 p-3 text-left transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:gap-4 sm:p-4"
            @click="openDetail(news)"
          >
            <div
              class="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
            >
              <img
                v-if="news.coverImage"
                :src="getAvatarUrl(news.coverImage)"
                :alt="news.title"
                class="h-full w-full object-cover"
                loading="lazy"
              />
              <div
                v-else
                class="flex h-full w-full items-center justify-center text-muted-foreground/70"
              >
                <span class="icon-[lucide--newspaper] size-6" aria-hidden="true" />
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <h4 class="line-clamp-2 text-sm font-medium leading-snug text-foreground sm:text-[15px]">
                {{ news.title || '无标题' }}
              </h4>
              <div class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                <time v-if="formatNewsTime(news.notifyTime)" :datetime="String(news.notifyTime)">
                  {{ formatNewsTime(news.notifyTime) }}
                </time>
                <span class="text-muted-foreground/80">查看详情</span>
              </div>
            </div>
            <span
              class="icon-[lucide--chevron-right] mt-1 size-5 shrink-0 text-muted-foreground/50"
              aria-hidden="true"
            />
          </button>
        </li>
      </ul>
    </div>

    <!-- 侧栏：竖向卡片列表 -->
    <div
      v-else-if="newsList.length > 0 && !props.embedded"
      class="flex-1 space-y-3 overflow-auto"
    >
      <div
        v-for="news in newsList"
        :key="news.id"
        class="group cursor-pointer overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm ring-1 ring-black/[0.04] transition-all hover:border-primary/40 hover:shadow-md dark:ring-white/[0.05]"
        @click="openDetail(news)"
      >
        <div v-if="news.coverImage" class="relative h-32 overflow-hidden bg-muted">
          <img
            :src="getAvatarUrl(news.coverImage)"
            :alt="news.title"
            class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        </div>
        <div class="p-3.5">
          <h4 class="line-clamp-2 text-sm font-medium text-foreground">
            {{ news.title }}
          </h4>
          <div class="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <time v-if="formatNewsTime(news.notifyTime)">{{ formatNewsTime(news.notifyTime) }}</time>
            <span class="text-primary/80 opacity-0 transition-opacity group-hover:opacity-100">详情 →</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div
      v-else
      :class="[
        'flex items-center justify-center',
        props.embedded ? 'min-h-[200px] rounded-xl border border-dashed border-border/60 bg-muted/15 py-10' : 'flex-1',
      ]">
      <div class="text-center px-4">
        <div
          class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground ring-1 ring-border/50"
        >
          <span class="icon-[lucide--newspaper] size-7" />
        </div>
        <p class="text-sm font-medium text-muted-foreground">暂无资讯</p>
        <p class="mt-1 text-xs text-muted-foreground/70">平台有新动态时会显示在这里</p>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <div
      v-if="detailVisible"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      @click.self="closeDetail"
    >
      <div class="bg-card rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[85vh] flex flex-col">
        <!-- 弹窗头部 -->
        <div class="flex items-center justify-between p-5 border-b border-border bg-muted/30">
          <h3 class="text-lg font-semibold text-foreground line-clamp-1">
            {{ detailNews?.title }}
          </h3>
          <button
            class="text-muted-foreground hover:text-foreground transition-colors rounded-full p-1 hover:bg-muted"
            @click="closeDetail"
          >
            <span class="icon-[lucide--x] size-5" />
          </button>
        </div>

        <!-- 弹窗内容 -->
        <div class="flex-1 overflow-auto p-5">
          <!-- 富文本正文 -->
          <div
            class="prose prose-sm dark:prose-invert max-w-none prose-img:rounded-lg prose-headings:text-foreground"
            v-html="sanitizedDetailBody"
          />
        </div>

        <!-- 弹窗底部操作按钮 -->
        <div v-if="detailNews?.actionText && detailNews?.actionUrl" class="p-5 border-t border-border bg-muted/30">
          <button
            class="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            @click="openAction(detailNews.actionUrl)"
          >
            {{ detailNews.actionText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
