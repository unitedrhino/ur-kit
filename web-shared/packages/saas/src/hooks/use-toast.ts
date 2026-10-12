import { ref } from 'vue'

export interface ToastItem {
  id: string
  title: string
  description?: string
  /** 自动关闭时间（ms），0 表示不自动关闭，默认 4500 */
  duration?: number
  /** toast 类型 */
  type?: 'error' | 'info' | 'success' | 'warning'
}

// 模块级共享状态：所有调用方共享同一份 toasts 和 muted
const toasts = ref<ToastItem[]>([])
const muted = ref(false)

export function useToast() {
  function toast(item: Omit<ToastItem, 'id'>) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const duration = item.duration ?? 4500
    toasts.value.push({ ...item, id })
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }
    return id
  }

  function dismiss(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function toggleMute() {
    muted.value = !muted.value
  }

  return { toasts, toast, dismiss, muted, toggleMute }
}
