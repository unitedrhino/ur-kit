import throttle from 'lodash/throttle'

// 拆出来是为了更好的分离单独复用

/**
 * 预览宿主容器尺寸
 * 预览页常被内嵌在带侧边栏/页头的布局里（如 saas iot 应用的大屏预览/发布页），
 * window 尺寸 ≠ 可用区域，按 window 计算会把画布放大到可视区之外被裁掉；
 * 统一取 .go-preview 容器实际尺寸，取不到（独立全屏等场景容器即视口）回退 window。
 */
const getHostSize = (scaleDom: HTMLElement | null) => {
  const host = scaleDom?.closest('.go-preview') as HTMLElement | null
  return {
    w: host?.clientWidth || window.innerWidth,
    h: host?.clientHeight || window.innerHeight,
  }
}

/**
 * 监听宿主容器尺寸变化（侧边栏折叠/页头显隐等不改变 window 的场景），返回停止函数
 */
const observeHostResize = (scaleDom: HTMLElement | null, callback: () => void) => {
  const host = scaleDom?.closest('.go-preview') ?? null
  if (!host || typeof ResizeObserver === 'undefined') return () => {}
  const observer = new ResizeObserver(throttle(callback, 200))
  observer.observe(host)
  return () => observer.disconnect()
}

// * 屏幕缩放适配（两边留白）
export const usePreviewFitScale = (
  width: number,
  height: number,
  scaleDom: HTMLElement | null,
  callback?: (scale: {
    width: number;
    height: number;
  }) => void
) => {
  // * 画布尺寸（px）
  const baseWidth = width
  const baseHeight = height

  // * 默认缩放值
  const scale = {
    width: 1,
    height: 1,
  }

  // * 需保持的比例
  const baseProportion = parseFloat((baseWidth / baseHeight).toFixed(5))
  const calcRate = () => {
    // 当前宿主容器宽高比
    const { w, h } = getHostSize(scaleDom)
    const currentRate = parseFloat(
      (w / h).toFixed(5)
    )
    if (scaleDom) {
      if (currentRate > baseProportion) {
        // 表示更宽
        scale.width = parseFloat(((h * baseProportion) / baseWidth).toFixed(5))
        scale.height = parseFloat((h / baseHeight).toFixed(5))
        scaleDom.style.transform = `scale(${scale.width}, ${scale.height})`
      } else {
        // 表示更高
        scale.height = parseFloat(((w / baseProportion) / baseHeight).toFixed(5))
        scale.width = parseFloat((w / baseWidth).toFixed(5))
        scaleDom.style.transform = `scale(${scale.width}, ${scale.height})`
      }
      if (callback) callback(scale)
    }
  }

  const resize = throttle(() => {
    calcRate()
  }, 200)

  let unObserve: () => void = () => {}

  // * 改变窗口/宿主容器大小重新绘制
  const windowResize = () => {
    window.addEventListener('resize', resize)
    unObserve = observeHostResize(scaleDom, calcRate)
  }

  // * 卸载监听
  const unWindowResize = () => {
    window.removeEventListener('resize', resize)
    unObserve()
  }

  return {
    calcRate,
    windowResize,
    unWindowResize,
  }
}

// *  X轴撑满，Y轴滚动条
export const usePreviewScrollYScale = (
  width: number,
  height: number,
  scaleDom: HTMLElement | null,
  callback?: (scale: {
    width: number;
    height: number;
  }) => void
) => {
  // * 画布尺寸（px）
  const baseWidth = width
  const baseHeight = height

  // * 默认缩放值
  const scale = {
    width: 1,
    height: 1,
  }

  // * 需保持的比例
  const baseProportion = parseFloat((baseWidth / baseHeight).toFixed(5))
  const calcRate = () => {
    if (scaleDom) {
      const { w } = getHostSize(scaleDom)
      scale.height = parseFloat(((w / baseProportion) / baseHeight).toFixed(5))
      scale.width = parseFloat((w / baseWidth).toFixed(5))
      scaleDom.style.transform = `scale(${scale.width}, ${scale.height})`
      if (callback) callback(scale)
    }
  }

  const resize = throttle(() => {
    calcRate()
  }, 200)

  let unObserve: () => void = () => {}

  // * 改变窗口/宿主容器大小重新绘制
  const windowResize = () => {
    window.addEventListener('resize', resize)
    unObserve = observeHostResize(scaleDom, calcRate)
  }

  // * 卸载监听
  const unWindowResize = () => {
    window.removeEventListener('resize', resize)
    unObserve()
  }

  return {
    calcRate,
    windowResize,
    unWindowResize,
  }
}

// *  Y轴撑满，X轴滚动条
export const usePreviewScrollXScale = (
  width: number,
  height: number,
  scaleDom: HTMLElement | null,
  callback?: (scale: {
    width: number;
    height: number;
  }) => void
) => {
  // * 画布尺寸（px）
  const baseWidth = width
  const baseHeight = height

  // * 默认缩放值
  const scale = {
    height: 1,
    width: 1,
  }

  // * 需保持的比例
  const baseProportion = parseFloat((baseWidth / baseHeight).toFixed(5))
  const calcRate = () => {
    if (scaleDom) {
      const { h } = getHostSize(scaleDom)
      scale.width = parseFloat(((h * baseProportion) / baseWidth).toFixed(5))
      scale.height = parseFloat((h / baseHeight).toFixed(5))
      scaleDom.style.transform = `scale(${scale.width}, ${scale.height})`
      if (callback) callback(scale)
    }
  }

  const resize = throttle(() => {
    calcRate()
  }, 200)

  let unObserve: () => void = () => {}

  // * 改变窗口/宿主容器大小重新绘制
  const windowResize = () => {
    window.addEventListener('resize', resize)
    unObserve = observeHostResize(scaleDom, calcRate)
  }

  // * 卸载监听
  const unWindowResize = () => {
    window.removeEventListener('resize', resize)
    unObserve()
  }

  return {
    calcRate,
    windowResize,
    unWindowResize,
  }
}

// * 变形内容，宽高铺满
export const usePreviewFullScale = (
  width: number,
  height: number,
  scaleDom: HTMLElement | null,
  callback?: (scale: {
    width: number;
    height: number;
  }) => void
) => {

  // * 默认缩放值
  const scale = {
    width: 1,
    height: 1,
  }

  const calcRate = () => {
    if (scaleDom) {
      const { w, h } = getHostSize(scaleDom)
      scale.width = parseFloat((w / width).toFixed(5))
      scale.height = parseFloat((h / height).toFixed(5))
      scaleDom.style.transform = `scale(${scale.width}, ${scale.height})`
      if (callback) callback(scale)
    }
  }

  const resize = throttle(() => {
    calcRate()
  }, 200)

  let unObserve: () => void = () => {}

  // * 改变窗口/宿主容器大小重新绘制
  const windowResize = () => {
    window.addEventListener('resize', resize)
    unObserve = observeHostResize(scaleDom, calcRate)
  }

  // * 卸载监听
  const unWindowResize = () => {
    window.removeEventListener('resize', resize)
    unObserve()
  }

  return {
    calcRate,
    windowResize,
    unWindowResize,
  }
}