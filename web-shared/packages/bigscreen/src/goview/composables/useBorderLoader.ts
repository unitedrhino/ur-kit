/**
 * 边框复用缓存 Hook
 * 用于动态加载边框组件并缓存，避免重复请求
 * 同时提供标题配置的通用计算逻辑
 */
import { shallowRef, watch, toRef, type Ref } from 'vue'

// 用 import.meta.glob 预声明所有边框模块（Vite 静态分析需要字面量路径）
// 注意：此文件位于 src/goview/composables/，Borders 位于 src/goview/packages/components/Decorates/Borders/
const borderModules = import.meta.glob('../packages/components/Decorates/Borders/*/index.vue')


/**
 * 边框加载 composable
 * @param borderKeyRef 边框类型名的响应式引用（如 'Border01'）
 * @param borderOptionRef 可选的边框选项响应式引用，用于计算标题配置
 */
export function useBorderLoader(
  borderKeyRef: Ref<string>,
  borderOptionRef?: Ref<any>
) {
  // 边框组件缓存 Map
  const borderCache = new Map<string, any>()

  // 当前边框组件
  const borderComponent = shallowRef<any>(null)

  // 加载边框组件
  const loadBorderComponent = async (key: string) => {
    // 先查缓存
    if (borderCache.has(key)) {
      borderComponent.value = borderCache.get(key)
      return
    }

    // 缓存未命中，动态加载
    const path = `../packages/components/Decorates/Borders/${key}/index.vue`
    const loader = borderModules[path]
    if (!loader) {
      console.warn(`[useBorderLoader] 未找到边框模块: ${path}`)
      return
    }
    const mod = (await loader()) as any
    const component = mod.default

    // 写入缓存
    borderCache.set(key, component)
    borderComponent.value = component
  }

  // 监听边框类型变化
  watch(
    () => borderKeyRef.value,
    (key) => {
      loadBorderComponent(key ?? 'Border01')
    },
    { immediate: true },
  )

  // 标题配置（从 BorderChartBase/index.vue 原样提取）
  // 当传入 borderOptionRef 时，基于它计算；否则返回默认值
  const titleConfig = {
    show: false,
    text: '',
    position: 'center' as const,
    fontSize: 18,
    fontColor: '#fff',
    fontWeight: 'normal' as const,
    letterSpacing: 0,
    top: 20,
    sideOffset: 20,
  }

  // 标题样式计算
  const computeTitleConfig = () => {
    if (!borderOptionRef?.value) {
      return titleConfig
    }

    const borderOpt = borderOptionRef.value.borderOption || {}
    // 兼容 Border04 的旧配置格式
    if (typeof borderOpt.borderTitle === 'string') {
      return {
        show: !!borderOpt.borderTitle,
        text: borderOpt.borderTitle || '',
        position: 'center' as const,
        fontSize: borderOpt.borderTitleSize || 18,
        fontColor: borderOpt.borderTitleColor || '#fff',
        fontWeight: 'normal' as const,
        letterSpacing: 0,
        top: (borderOpt.borderTitleHeight || 32) - 5,
        sideOffset: 20,
      }
    }

    // 新配置格式：borderTitle 是对象
    if (!borderOpt.borderTitle || typeof borderOpt.borderTitle !== 'object') {
      return titleConfig
    }

    const cfg = borderOpt.borderTitle
    return {
      show: cfg.show ?? false,
      text: cfg.text ?? '',
      position: cfg.position ?? 'center',
      fontSize: cfg.fontSize ?? 18,
      fontColor: cfg.fontColor ?? '#fff',
      fontWeight: cfg.fontWeight ?? 'normal',
      letterSpacing: cfg.letterSpacing ?? 0,
      top: cfg.top ?? 20,
      sideOffset: cfg.sideOffset ?? 20,
    }
  }

  // 标题样式计算
  const computeTitleStyle = (cfg: ReturnType<typeof computeTitleConfig>) => {
    let left = '50%'
    let transform = 'translateX(-50%)'

    if (cfg.position === 'left') {
      left = `${cfg.sideOffset}px`
      transform = 'none'
    } else if (cfg.position === 'right') {
      left = `calc(100% - ${cfg.sideOffset}px)`
      transform = 'translateX(-100%)'
    }

    return {
      position: 'absolute' as const,
      top: `${cfg.top}px`,
      left,
      transform,
      fontSize: `${cfg.fontSize}px`,
      color: cfg.fontColor,
      fontWeight: cfg.fontWeight,
      letterSpacing: `${cfg.letterSpacing}px`,
      zIndex: 2,
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
    }
  }

  // fakeBorderConfig 生成器（供调用方使用）
  const createFakeBorderConfig = (borderOption: Record<string, any>) => ({
    option: borderOption,
  })

  return {
    borderComponent,
    createFakeBorderConfig,
    computeTitleConfig,
    computeTitleStyle,
  }
}