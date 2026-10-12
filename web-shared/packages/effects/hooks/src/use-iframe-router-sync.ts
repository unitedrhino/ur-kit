import type { RouteLocationNormalized } from 'vue-router';

import { onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export interface IframeRouteMessage {
  type: 'iframe-route-change' | 'vben-route-update';
  data: {
    path: string;
    fullPath?: string;
    query?: Record<string, any>;
    hash?: string;
  };
}

export interface IframeRouteMapConfig {
  // vben 路由路径
  vbenPath: string;
  // iframe 路由路径
  iframePath: string;
  // 是否支持动态参数
  dynamic?: boolean;
}

/**
 * iframe 路由同步 Hook
 * 用于 vben 主应用与 iframe 子应用之间的双向路由同步
 */
export function useIframeRouterSync() {
  const router = useRouter();
  const route = useRoute();
  
  // 标记是否正在进行路由同步，防止循环更新
  const isSyncing = ref(false);
  
  // iframe 元素引用列表
  const iframeRefs = ref<HTMLIFrameElement[]>([]);

  /**
   * 注册 iframe 元素，并同步当前路由
   */
  function registerIframe(iframe: HTMLIFrameElement) {
    if (iframe && !iframeRefs.value.includes(iframe)) {
      iframeRefs.value.push(iframe);
      
      // 注册后立即同步当前路由到 iframe
      const currentRoute = route;
      if (currentRoute.meta?.iframeSrc) {
        // 优先从 query 参数中读取 iframe 路径（用于刷新恢复）
        let iframeRoute: { path: string; query?: Record<string, any> } | null = null;
        
        if (currentRoute.query.iframePath) {
          // 从 query 参数中恢复 iframe 路由
          const { iframePath, ...otherQuery } = currentRoute.query;
          iframeRoute = {
            path: iframePath as string,
            query: otherQuery,
          };
          console.log('[vben] 从 URL 恢复 iframe 路由:', iframeRoute);
        } else {
          // 首次访问，使用默认路由
          iframeRoute = convertVbenRouteToIframe(currentRoute);
          console.log('[vben] 使用默认 iframe 路由:', iframeRoute);
        }
        
        if (iframeRoute) {
          // 设置同步标志，防止 iframe 响应时再次触发更新
          isSyncing.value = true;
          
          // 延迟发送，确保 iframe 完全加载
          setTimeout(() => {
            if (iframe?.contentWindow) {
              const message: IframeRouteMessage = {
                type: 'vben-route-update',
                data: iframeRoute,
              };
              const targetOrigin = import.meta.env.DEV ? '*' : window.location.origin;
              iframe.contentWindow.postMessage(message, targetOrigin);
              console.log('[vben] iframe 注册后同步初始路由:', iframeRoute);
              
              // 延迟重置同步标志
              setTimeout(() => {
                isSyncing.value = false;
              }, 500);
            }
          }, 200);
        }
      }
    }
  }

  /**
   * 注销 iframe 元素
   */
  function unregisterIframe(iframe: HTMLIFrameElement) {
    const index = iframeRefs.value.indexOf(iframe);
    if (index > -1) {
      iframeRefs.value.splice(index, 1);
    }
  }

  /**
   * 发送路由更新消息到 iframe
   */
  function sendRouteToIframe(routeData: { path: string; query?: Record<string, any>; hash?: string }) {
    iframeRefs.value.forEach((iframe) => {
      if (iframe?.contentWindow) {
        const message: IframeRouteMessage = {
          type: 'vben-route-update',
          data: routeData,
        };
        
        // 在开发环境使用 '*'，生产环境应该指定具体的 origin
        const targetOrigin = import.meta.env.DEV ? '*' : window.location.origin;
        
        iframe.contentWindow.postMessage(message, targetOrigin);
        console.log('[vben] 发送路由更新到 iframe:', routeData);
      }
    });
  }

  /**
   * 根据路由映射配置将 iframe 路由转换为 vben 路由
   */
  function convertIframeRouteToVben(
    iframePath: string,
    query?: Record<string, any>,
    currentRoute?: RouteLocationNormalized,
  ): { path: string; query?: Record<string, any> } | null {
    // 获取当前路由的 iframeSrc
    const iframeSrc = currentRoute?.meta?.iframeSrc as string;
    if (!iframeSrc) return null;

    // 提取 iframe 基础路径（去除 hash 部分）
    const hashIndex = iframeSrc.indexOf('/#/');
    if (hashIndex === -1) return null;

    const iframeBasePath = iframeSrc.substring(hashIndex + 2); // 去掉 /#

    // 检查当前 iframe 路由是否与配置的路径匹配
    if (currentRoute && iframePath.startsWith(iframeBasePath)) {
      // 如果是当前路由页面内的子路由，不需要跳转
      return {
        path: currentRoute.path,
        query,
      };
    }

    // 查找所有包含 iframeSrc 的路由
    const routes = router.getRoutes();
    for (const route of routes) {
      if (route.meta?.iframeSrc) {
        const routeIframeSrc = route.meta.iframeSrc as string;
        const routeHashIndex = routeIframeSrc.indexOf('/#/');
        if (routeHashIndex !== -1) {
          const routeIframePath = routeIframeSrc.substring(routeHashIndex + 2);
          if (iframePath.startsWith(routeIframePath)) {
            return {
              path: route.path,
              query,
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * 根据路由映射配置将 vben 路由转换为 iframe 路由
   */
  function convertVbenRouteToIframe(
    vbenRoute: RouteLocationNormalized,
  ): { path: string; query?: Record<string, any> } | null {
    const iframeSrc = vbenRoute.meta?.iframeSrc as string;
    if (!iframeSrc) return null;

    // 提取 iframe 路径
    const hashIndex = iframeSrc.indexOf('/#/');
    if (hashIndex === -1) return null;

    const iframePath = iframeSrc.substring(hashIndex + 2); // 去掉 /#

    return {
      path: iframePath,
      query: vbenRoute.query as Record<string, any>,
    };
  }

  /**
   * 处理来自 iframe 的路由变化消息
   */
  function handleIframeRouteChange(event: MessageEvent) {
    // 验证消息来源（可根据实际情况调整）
    // if (import.meta.env.PROD && event.origin !== window.location.origin) {
    //   return;
    // }

    if (!event.data || event.data.type !== 'iframe-route-change') {
      return;
    }

    // 如果当前正在同步中，避免循环更新
    if (isSyncing.value) {
      return;
    }

    const message = event.data as IframeRouteMessage;
    const { path, query } = message.data;

    console.log('[vben] 接收到 iframe 路由变化:', path, query);

    // 不改变主路由，只更新 query 参数中的 iframe 路径
    if (route.meta?.iframeSrc) {
      // 检查是否真的需要更新（避免重复更新）
      const currentIframePath = route.query.iframePath as string;
      if (currentIframePath === path) {
        console.log('[vben] iframe 路径未变化，跳过更新');
        return;
      }
      
      isSyncing.value = true;
      
      // 构建新的 query 参数，包含 iframe 路径信息
      const newQuery = {
        ...route.query,
        iframePath: path,
        ...query, // 合并 iframe 的 query 参数
      };
      
      console.log('[vben] 更新 query 参数（主路由不变）:', {
        主路由: route.path,
        新Query: newQuery,
      });
      
      // 使用 replace 避免产生多余的历史记录
      router.replace({
        path: route.path, // 保持主路由不变
        query: newQuery,
      }).finally(() => {
        // 延迟重置同步标志，确保路由完全更新
        setTimeout(() => {
          isSyncing.value = false;
        }, 300); // 增加延迟到 300ms
      });
    }
  }

  /**
   * 监听 vben 路由变化，同步到 iframe
   */
  function watchVbenRoute() {
    router.afterEach((to, from) => {
      // 如果当前正在同步中，避免循环更新
      if (isSyncing.value) {
        console.log('[vben] 路由同步中，跳过此次更新');
        return;
      }

      // 只处理包含 iframeSrc 的路由
      if (!to.meta?.iframeSrc) {
        return;
      }

      // 如果是同一个 iframe 页面且只有 query 参数变化（可能是 iframe 通知导致的更新）
      if (from.meta?.iframeSrc && from.path === to.path) {
        const fromIframePath = from.query.iframePath;
        const toIframePath = to.query.iframePath;
        
        // 如果 iframePath 变化了，说明是 iframe 通知的，不要再发回去
        if (fromIframePath !== toIframePath && toIframePath) {
          console.log('[vben] query 参数变化（由 iframe 触发），不发送消息');
          return;
        }
      }

      console.log('[vben] 路由变化，准备同步到 iframe:', to.path, to.query);

      let iframeRoute: { path: string; query?: Record<string, any> } | null = null;

      // 检查 query 中是否有 iframe 路径（用户直接修改 URL 或刷新后）
      if (to.query.iframePath) {
        const { iframePath, ...otherQuery } = to.query;
        iframeRoute = {
          path: iframePath as string,
          query: otherQuery,
        };
        console.log('[vben] 使用 query 中的 iframe 路由:', iframeRoute);
      } else {
        // 使用默认路由（从 iframeSrc 提取）
        iframeRoute = convertVbenRouteToIframe(to);
      }

      if (iframeRoute) {
        // 延迟发送，确保 iframe 已经加载（如果是新打开的标签页）
        const delay = from.meta?.iframeSrc ? 100 : 300;
        setTimeout(() => {
          if (iframeRefs.value.length > 0) {
            sendRouteToIframe(iframeRoute);
          } else {
            console.warn('[vben] 没有已注册的 iframe，无法发送路由更新');
          }
        }, delay);
      }
    });
  }

  /**
   * 初始化路由同步
   */
  function init() {
    // 监听来自 iframe 的消息
    window.addEventListener('message', handleIframeRouteChange);
    
    // 监听 vben 路由变化
    watchVbenRoute();
  }

  /**
   * 清理路由同步
   */
  function cleanup() {
    window.removeEventListener('message', handleIframeRouteChange);
    iframeRefs.value = [];
  }

  onMounted(() => {
    init();
  });

  onUnmounted(() => {
    cleanup();
  });

  return {
    registerIframe,
    unregisterIframe,
    sendRouteToIframe,
    convertIframeRouteToVben,
    convertVbenRouteToIframe,
    isSyncing,
  };
}

