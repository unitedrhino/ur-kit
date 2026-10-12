<script lang="ts" setup>
// cspell:ignore tabler
import type { SaasNotificationItem } from '../../hooks/use-notifications'

import { computed, ref } from 'vue'

import { Bell, MailCheck } from '@vben/icons'
import { IconifyIcon } from '@vben/icons'
import { $t } from '@vben/locales'
import { VbenButton, VbenIconButton, VbenPopover, VbenScrollbar } from '@vben-core/shadcn-ui'

import { onKeyStroke, useNow, useToggle } from '@vueuse/core'

import { sanitizeUserMessageBodyHtml } from '../../utils/notification-body'

interface Props {
  dot?: boolean
  notifications?: SaasNotificationItem[]
  muted?: boolean
}

defineOptions({ name: 'SaasNotificationPopup' })

const props = withDefaults(defineProps<Props>(), {
  dot: false,
  muted: false,
  notifications: () => [],
})

const emit = defineEmits<{
  clear: []
  makeAll: []
  read: [SaasNotificationItem]
  remove: [SaasNotificationItem]
  toggleMute: []
  viewAll: []
}>()

const [open, toggle] = useToggle()

// 每分钟更新一次，驱动所有相对时间自动刷新
const now = useNow({ interval: 60_000 })

// 图标名 → 背景色（与 use-notifications.ts 中的 NOTIFY_TYPE_ICON 对应）
const ICON_COLOR_MAP: Record<string, string> = {
  'lucide:bell':           '#4F46E5', // 站内信
  'lucide:smartphone':     '#10B981', // 短信
  'lucide:mail':           '#F59E0B', // 邮箱
  'tabler:brand-dingtalk': '#1677FF', // 钉钉机器人
  'lucide:webhook':        '#1677FF', // 钉钉 Webhook
  'tabler:brand-wechat':   '#07C160', // 微信系
  'lucide:phone':          '#7C3AED', // 电话通知
}

// avatar 字段存的是 iconify 图标名（如 "lucide:bell"），含 : 则视为图标名
function isIconName(avatar: string) {
  return avatar.includes(':')
}

function iconBg(avatar: string) {
  return ICON_COLOR_MAP[avatar] ?? '#6366F1'
}

/**
 * 将毫秒时间戳字符串格式化为精确时间字符串（用于 tooltip）
 * 例：2026年3月11日 14:30:05
 */
function formatExactTime(dateStr: string): string {
  const ts = /^\d+$/.test(dateStr) ? Number(dateStr) : Date.parse(dateStr)
  if (isNaN(ts)) return dateStr
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/**
 * 中文相对时间格式化（最佳实践）
 * date: 毫秒时间戳字符串（纯数字）或任意可解析字符串
 *
 * 规则：
 *  < 1 min    → 刚刚
 *  1–59 min   → X 分钟前
 *  今天内（< 6h）→ X 小时前
 *  今天内（≥ 6h）→ 今天 HH:mm
 *  昨天       → 昨天 HH:mm
 *  < 7 天     → X 天前
 *  今年内     → M月D日 HH:mm
 *  更早       → YYYY年M月D日
 */
function formatTime(dateStr: string, nowDate: Date): string {
  const ts = /^\d+$/.test(dateStr) ? Number(dateStr) : Date.parse(dateStr)
  if (isNaN(ts)) return dateStr

  const date = new Date(ts)
  const nowMs = nowDate.getTime()
  const diffMs = nowMs - ts

  if (diffMs < 60_000) return '刚刚'

  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 60) return `${diffMin} 分钟前`

  const diffHour = Math.floor(diffMs / 3_600_000)
  const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  const yesterday = new Date(nowMs - 86_400_000)

  if (isSameDay(date, nowDate)) {
    return diffHour < 6 ? `${diffHour} 小时前` : `今天 ${timeStr}`
  }
  if (isSameDay(date, yesterday)) return `昨天 ${timeStr}`

  const diffDay = Math.floor(diffMs / 86_400_000)
  if (diffDay < 7) return `${diffDay} 天前`

  if (date.getFullYear() === nowDate.getFullYear()) {
    return `${date.getMonth() + 1}月${date.getDate()}日 ${timeStr}`
  }

  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

function close() {
  open.value = false
}

/** 详情弹窗当前展示的消息；组件局部状态，不与推送弹窗 NotifyModal 的全局 modalNotification 混用 */
const detailItem = ref<SaasNotificationItem | null>(null)

/** 详情正文：body 为消息原始富文本 HTML，sanitize 后渲染；为空时退回列表预览文本 */
const detailBodyHtml = computed(() => {
  const b = detailItem.value?.body
  return b ? sanitizeUserMessageBodyHtml(b) : ''
})

function closeDetail() {
  detailItem.value = null
}

// ESC 关闭详情弹窗，与消息中心详情弹窗交互一致
onKeyStroke('Escape', () => {
  if (detailItem.value) closeDetail()
})

// actionUrl 来自消息内容（发送方可控），必须带 noopener 打开，
// 防止被打开页面经 window.opener 反向操作控制台页面
function openAction(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * 点击面板中的消息项：
 * 1. 对外发出 read 事件（由布局层负责标记已读）
 * 2. 消息带 actionUrl 时新窗口直接打开目标详情页
 * 3. 否则弹出详情弹窗展示完整富文本正文（与消息中心 openDetail 行为一致）
 */
function handleItemClick(item: SaasNotificationItem) {
  emit('read', item)
  close()
  if (item.actionUrl) {
    window.open(item.actionUrl, '_blank', 'noopener,noreferrer')
    return
  }
  detailItem.value = item
}

function handleViewAll() {
  emit('viewAll')
  close()
}
</script>

<template>
  <VbenPopover v-model:open="open" content-class="relative right-2 w-[360px] p-0">
    <template #trigger>
      <div class="flex-center mr-2 h-full" @click.stop="toggle()">
        <VbenIconButton class="bell-button text-foreground relative">
          <span v-if="dot" class="bg-primary absolute right-0.5 top-0.5 h-2 w-2 rounded"></span>
          <Bell class="size-4" />
        </VbenIconButton>
      </div>
    </template>

    <div class="relative">
      <div class="flex items-center justify-between p-4 py-3">
        <div class="text-foreground">{{ $t('ui.widgets.notifications') }}</div>
        <div class="flex items-center gap-1">
          <VbenButton size="sm" variant="ghost" class="text-muted-foreground text-xs h-7 px-2" @click="emit('toggleMute')">
            {{ props.muted ? '重新开启' : '不再提醒' }}
          </VbenButton>
          <VbenIconButton :disabled="notifications.length <= 0" :tooltip="$t('ui.widgets.markAllAsRead')" @click="emit('makeAll')">
            <MailCheck class="size-4" />
          </VbenIconButton>
        </div>
      </div>

      <VbenScrollbar v-if="notifications.length > 0">
        <ul class="!flex max-h-[360px] w-full flex-col">
          <template v-for="item in notifications" :key="item.id">
            <li
              class="hover:bg-accent border-border group relative flex w-full cursor-pointer items-start gap-5 border-t px-3 py-3"
              @click="handleItemClick(item)"
            >
              <span v-if="!item.isRead" class="bg-primary absolute right-2 top-2 h-2 w-2 rounded group-hover:hidden"></span>
              <button
                class="text-muted-foreground hover:text-destructive absolute right-2 top-2 hidden rounded p-0.5 transition-colors group-hover:flex"
                @click.stop="emit('remove', item)"
              >
                <IconifyIcon icon="lucide:trash-2" class="size-3.5" />
              </button>

              <!-- 图标型 avatar：用 IconifyIcon 渲染 -->
              <span
                v-if="isIconName(item.avatar)"
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                :style="{ backgroundColor: iconBg(item.avatar) }"
              >
                <IconifyIcon :icon="item.avatar" class="size-5 text-white" />
              </span>
              <!-- 图片型 avatar：兜底 img -->
              <span v-else class="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full">
                <img :src="item.avatar" class="aspect-square h-full w-full object-cover" role="img" />
              </span>

              <div class="flex flex-col gap-1 leading-none">
                <p class="font-semibold">{{ item.title }}</p>
                <p class="text-muted-foreground my-1 line-clamp-2 text-xs">{{ item.message }}</p>
                <p class="text-muted-foreground line-clamp-2 text-xs" :title="formatExactTime(item.date)">{{ formatTime(item.date, now) }}</p>
              </div>
            </li>
          </template>
        </ul>
      </VbenScrollbar>

      <template v-else>
        <div class="flex-center text-muted-foreground min-h-[150px] w-full">
          {{ $t('common.noData') }}
        </div>
      </template>

      <div class="border-border flex items-center justify-between border-t px-4 py-3">
        <VbenButton :disabled="notifications.length <= 0" size="sm" variant="ghost" @click="emit('clear')">
          {{ $t('ui.widgets.clearNotifications') }}
        </VbenButton>
        <VbenButton size="sm" @click="handleViewAll">
          {{ $t('ui.widgets.viewAll') }}
        </VbenButton>
      </div>
    </div>
  </VbenPopover>

  <!-- 消息详情弹窗：无 actionUrl 的消息点击后展示完整富文本正文，Teleport 到 body 避免被 popover 裁剪 -->
  <Teleport to="body">
    <div
      v-if="detailItem"
      class="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
      @click.self="closeDetail"
    >
      <div class="bg-card flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl shadow-2xl">
        <div class="bg-muted/30 border-border flex items-center justify-between border-b p-5">
          <h3 class="text-foreground line-clamp-1 text-lg font-semibold">
            {{ detailItem.title || '消息详情' }}
          </h3>
          <button
            class="text-muted-foreground hover:bg-muted hover:text-foreground rounded-full p-1 transition-colors"
            @click="closeDetail"
          >
            <IconifyIcon icon="lucide:x" class="size-5" />
          </button>
        </div>
        <div class="flex-1 overflow-auto p-5">
          <div
            v-if="detailBodyHtml"
            class="prose prose-sm dark:prose-invert prose-headings:text-foreground prose-img:rounded-lg max-w-none"
            v-html="detailBodyHtml"
          />
          <p v-else class="text-muted-foreground text-sm">
            {{ detailItem.message }}
          </p>
        </div>
        <div
          v-if="detailItem.actionText && detailItem.actionUrl"
          class="bg-muted/30 border-border border-t p-5"
        >
          <button
            type="button"
            class="bg-primary text-primary-foreground h-10 w-full cursor-pointer rounded-md"
            @click="detailItem.actionUrl && openAction(detailItem.actionUrl)"
          >
            {{ detailItem.actionText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
:deep(.bell-button) {
  &:hover {
    svg {
      animation: bell-ring 1s both;
    }
  }
}

@keyframes bell-ring {
  0%, 100% { transform-origin: top; }
  15% { transform: rotateZ(10deg); }
  30% { transform: rotateZ(-10deg); }
  45% { transform: rotateZ(5deg); }
  60% { transform: rotateZ(-5deg); }
  75% { transform: rotateZ(2deg); }
}
</style>
