/** 消息通知管理：装载消息、同步已读状态和推送，失败提示复用多语言去重入口。 */
import { notifyRequestError } from '@vben/saas/request-error';
import { $t } from '@vben/locales';
// cspell:ignore tabler
import type { NotificationItem } from '@vben/layouts'

import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

import { CoreApi } from '@vben/api'
import { useAppConfig } from '@vben/hooks'
import { useAccessStore } from '@vben/stores'

import { messageBodyToPreviewText } from '../utils/notification-body'
import { useToast } from './use-toast'
import { acquireSharedWsClient, releaseSharedWsClient } from './ws-client'

/**
 * 扩展 vben NotificationItem：携带消息正文与跳转信息，
 * 支撑通知面板点击打开消息详情/跳转 actionURL 的交互。
 */
export interface SaasNotificationItem extends NotificationItem {
  /** 消息原始正文（富文本 HTML），详情弹窗展示用 */
  body?: string
  /** 操作按钮文案 */
  actionText?: string
  /** 操作跳转 URL，点击消息时优先打开 */
  actionUrl?: string
}

interface WsUserMessage {
  group?: string       // 消息类型分组（system/device 等）
  notifyCode?: string  // 通知配置代码
  priority?: number    // 优先级 1:P0紧急 2:P1重要 3:P2普通
  type?: string        // 渠道类型：sms/email/message/banner/news 等
  message?: {
    subject?: string
    body?: string
    notifyTime?: number  // Unix 秒，前端 * 1000 转毫秒
    actionText?: string
    actionUrl?: string
    // 渠道专属字段
    showAsModal?: string       // message/news专属：是否弹窗 "1"=是 "2"=否
    severity?: string          // banner专属：严重等级 info/warning/error
    allowDismiss?: string      // banner专属：允许关闭 "1"=是 "2"=否
    coverImage?: string        // news专属：封面图URL
    videoUrl?: string          // news专属：视频URL
    modalShowStartTime?: string
    modalShowEndTime?: string
  }
}

/** 弹窗通知项，用于 showAsModal=1 的站内信 */
export interface ModalNotification {
  id: number
  title: string
  body: string
  coverImage?: string
  actionText?: string
  actionUrl?: string
}

/** 横幅通知项，用于 type=banner 的消息 */
export interface BannerNotification {
  id: number
  title: string
  body: string
  severity: 'info' | 'warning' | 'error'
  allowDismiss: boolean
  actionText?: string
  actionUrl?: string
}

// 通知渠道类型 → Iconify 图标名（颜色映射在 SaasNotification.vue 中定义）
const NOTIFY_TYPE_ICON: Record<string, string> = {
  message:     'lucide:bell',
  sms:         'lucide:smartphone',
  email:       'lucide:mail',
  dingTalk:    'tabler:brand-dingtalk',
  dingWebhook: 'lucide:webhook',
  wxMini:      'tabler:brand-wechat',
  wxEWebHook:  'tabler:brand-wechat',
  wxCorApp:    'tabler:brand-wechat',
  phoneCall:   'lucide:phone',
  banner:      'lucide:megaphone',
  news:        'lucide:newspaper',
}

function getNotifyTypeIcon(type?: string): string {
  return NOTIFY_TYPE_ICON[type ?? ''] ?? NOTIFY_TYPE_ICON.message!
}

function mapToNotificationItem(data: WsUserMessage): SaasNotificationItem {
  return {
    id: 0, // WebSocket 通知无 ID，面板打开时从 API 拉取完整列表
    avatar: getNotifyTypeIcon(data.type ?? 'message'),
    title: data.message?.subject ?? '新通知',
    message: messageBodyToPreviewText(data.message?.body ?? ''),
    // date 存毫秒时间戳字符串，由 SaasNotification.vue 格式化为相对时间
    date: data.message?.notifyTime
      ? String(data.message.notifyTime * 1000)
      : String(Date.now()),
    isRead: false,
    body: data.message?.body ?? '',
    actionText: data.message?.actionText,
    actionUrl: data.message?.actionUrl,
  }
}

/** 全局横幅通知列表（跨组件共享） */
export const bannerNotifications = ref<BannerNotification[]>([])

/** 当前弹窗通知（同时只显示一个） */
export const modalNotification = ref<ModalNotification | null>(null)

/** 关闭横幅 */
export function dismissBanner(id: number) {
  bannerNotifications.value = bannerNotifications.value.filter((b) => b.id !== id)
}

/** 关闭弹窗（同时标记已读，防止刷新后重复弹出） */
export function closeModal() {
  const id = modalNotification.value?.id
  modalNotification.value = null
  if (id && id > 0) {
    CoreApi.postApiV1SystemUserSelfMessageMultiIsRead({ ids: [String(id)] }).catch(() => {})
  }
}

let _wsMessageCounter = -1
function nextTempId() {
  return _wsMessageCounter--
}

/** 发送 OS 原生通知（macOS / Windows 系统级通知栏） */
function showOsNotification(title: string, body?: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const n = new Notification(title, {
    body: body || '',
    icon: '/favicon.ico',
    tag: 'saas-notify',           // 同 tag 只保留最新一条，避免刷屏
    requireInteraction: false,
  })
  n.onclick = () => {
    window.focus()
    n.close()
  }
  setTimeout(() => n.close(), 8000)
}

/** useNotifications 返回消息列表、未读状态及已读/清空动作，统一维护推送订阅生命周期。 */
export function useNotifications() {
  const notifications = ref<SaasNotificationItem[]>([])
  const showDot = computed(() => notifications.value.some((item) => !item.isRead))

  // muted / toggleMute 来自 useToast（模块级共享），WsToaster 也能直接读到
  const { toast, muted, toggleMute } = useToast()

  // 在 setup 阶段同步初始化 WS client
  // 开发态常用 BACKEND_URL 走 Vite 代理，此时 VITE_GLOB_API_URL 可能为空，需回退到当前页面源
  const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD)
  const accessStore = useAccessStore()

  // 去除末尾斜杠，防止拼出双斜杠 URL
  const rawApiUrl = (apiURL || (typeof window !== 'undefined' ? window.location.origin : '')).trim()
  const baseUrl = rawApiUrl.replace(/\/$/, '')
  const wsUrl =
    baseUrl.replace(/^https?/, (p: string) => (p === 'https' ? 'wss' : 'ws')) +
    '/api/v1/system/common/websocket/connect'

  // 共享连接（同 URL 单例）：BasicLayout 与业务布局等多个调用方复用一条连接，
  // 避免同账号多连接触发服务端单用户连接上限的“踢最旧”替换与重连风暴
  const client = acquireSharedWsClient({
    url: wsUrl,
    token: accessStore.accessToken ?? '',
  })

  // 通知回调按调用方注册；必须用稳定引用，卸载时才能从共享连接精确移除
  const onNotify = (data: unknown) => {
    const msg = data as WsUserMessage
    const tempId = nextTempId()

    // 横幅通知（type=banner）
    if (msg.type === 'banner') {
      const banner: BannerNotification = {
        id: tempId,
        title: msg.message?.subject ?? '通知',
        body: msg.message?.body ?? '',
        severity: (msg.message?.severity as BannerNotification['severity']) || 'info',
        allowDismiss: msg.message?.allowDismiss !== '2',
        actionText: msg.message?.actionText,
        actionUrl: msg.message?.actionUrl,
      }
      bannerNotifications.value.unshift(banner)
      return
    }

    // 弹窗通知（showAsModal=1 的站内信）
    if (msg.message?.showAsModal === '1') {
      modalNotification.value = {
        id: tempId,
        title: msg.message?.subject ?? '通知',
        body: msg.message?.body ?? '',
        coverImage: msg.message?.coverImage,
        actionText: msg.message?.actionText,
        actionUrl: msg.message?.actionUrl,
      }
      // 弹窗同时也加入铃铛列表
    }

    const item = mapToNotificationItem(msg)
    notifications.value.unshift(item)
    if (!muted.value) {
      toast({ title: item.title, description: item.message || undefined })
      // 页面不在前台时，发送 OS 原生通知（macOS/Windows 系统通知栏）
      if (document.visibilityState === 'hidden') {
        showOsNotification(item.title, item.message || undefined)
      }
    }
  }

  // 必须在 setup 内只注册一次，且不能放在 onConnected 里，否则每次重连都会叠加 listener
  client.listen('user.notify.*', onNotify)

  watch(
    () => accessStore.accessToken,
    (t) => {
      client.setToken(t ?? '')
    },
  )

  // 在顶层注册生命周期钩子，确保 setup 阶段同步注册
  onMounted(() => {
    // 请求 OS 原生通知权限（仅在用户未决定时弹窗询问）
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  })

  onUnmounted(() => {
    // 共享连接：只清理本组件回调并归还引用，最后一个引用释放时才真正断开；
    // user.notify.* 属服务端自动订阅频道，不能发送 unsubscribe（见 ws-client.unlisten 注释）
    client.unlisten('user.notify.*', onNotify)
    releaseSharedWsClient(wsUrl)
  })

  function loadInitialMessages() {
    CoreApi.postApiV1SystemUserSelfMessageGetList({
      page: { page: 1, size: 1000 },
      group: '',
    }).then((res) => {
      notifications.value =
        res?.list?.map((item) => ({
          id: Number(item.id ?? 0),
          avatar: getNotifyTypeIcon(item.type),
          title: item.message?.subject ?? '通知',
          message: messageBodyToPreviewText(item.message?.body ?? ''),
          // date 存毫秒时间戳字符串，由 SaasNotification.vue 格式化为相对时间
          // REST API 返回的 notifyTime 已是毫秒（后端 time.Time 经 utils.Copy 转换），无需 * 1000
          date: item.message?.notifyTime
            ? String(item.message.notifyTime)
            : item.createdTime,
          isRead: item.isRead === 1,
          body: item.message?.body ?? '',
          actionText: item.message?.actionText,
          actionUrl: item.message?.actionURL,
        })) ?? []
    })

    // 加载待展示的横幅和弹窗通知
    CoreApi.postApiV1SystemUserSelfMessageGetPending({
      page: { page: 1, size: 50 },
    }).then((res) => {
      const now = Date.now()
      for (const item of res?.list ?? []) {
        const msg = item.message
        if (!msg) continue

        // 横幅通知
        if (item.type === 'banner') {
          const exists = bannerNotifications.value.some((b) => b.id === Number(item.id))
          if (!exists) {
            bannerNotifications.value.push({
              id: Number(item.id),
              title: msg.subject ?? '',
              body: msg.body ?? '',
              severity: (msg.severity as BannerNotification['severity']) || 'info',
              allowDismiss: msg.allowDismiss !== '2',
              actionText: msg.actionText,
              actionUrl: msg.actionURL,
            })
          }
        }

        // 弹窗通知（showAsModal=1 且在展示时间段内 且未读）
        if (msg.showAsModal === '1' && !modalNotification.value && item.isRead !== 1) {
          const start = Number(msg.modalShowStartTime) || 0
          const end = Number(msg.modalShowEndTime) || 0
          const inTimeWindow = (start === 0 || now >= start) && (end === 0 || now <= end)
          if (inTimeWindow) {
            modalNotification.value = {
              id: Number(item.id),
              title: msg.subject ?? '通知',
              body: msg.body ?? '',
              coverImage: msg.coverImage,
              actionText: msg.actionText,
              actionUrl: msg.actionURL,
            }
          }
        }
      }
    }).catch(() => {
      // getPending 接口失败不影响主流程
    })
  }

  function markAsRead(clickItem: SaasNotificationItem) {
    CoreApi.postApiV1SystemUserSelfMessageMultiIsRead({
      ids: [clickItem.id.toString()],
    }).then(() => {
      notifications.value.forEach((item) => {
        if (item.id === clickItem.id) {
          item.isRead = true
        }
      })
    })
  }

  function markAllRead() {
    CoreApi.postApiV1SystemUserSelfMessageMarkAllRead({})
      .then(() => {
        notifications.value.forEach((item) => {
          item.isRead = true
        })
      })
      .catch((requestError) => {
        notifyRequestError(requestError, () => $t('ui.actionMessage.markReadFailed'), (text) => toast({ title: text, type: 'error' }))
      })
  }

  function removeOne(item: NotificationItem) {
    // WebSocket 推送的消息无持久化 ID，只做本地移除
    if (item.id === 0) {
      notifications.value = notifications.value.filter((n) => n !== item)
      return
    }
    CoreApi.postApiV1SystemUserSelfMessageMultiDelete({
      ids: [item.id.toString()],
    }).then(() => {
      notifications.value = notifications.value.filter((n) => n !== item)
    })
  }

  function clearAll() {
    const ids = notifications.value.filter((n) => n.id > 0).map((n) => n.id.toString())
    if (ids.length === 0) {
      notifications.value = []
      return
    }
    CoreApi.postApiV1SystemUserSelfMessageMultiDelete({ ids })
      .then(() => {
        notifications.value = []
      })
      .catch((requestError) => {
        notifyRequestError(requestError, () => $t('ui.actionMessage.clearFailed'), (text) => toast({ title: text, type: 'error' }))
      })
  }

  return {
    notifications,
    showDot,
    muted,
    toggleMute,
    loadInitialMessages,
    markAsRead,
    markAllRead,
    removeOne,
    clearAll,
  }
}
