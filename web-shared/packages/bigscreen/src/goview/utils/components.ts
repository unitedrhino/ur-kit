import { defineAsyncComponent, type AsyncComponentLoader } from 'vue'
import { AsyncLoading, AsyncSkeletonLoading } from '@/components/GoLoading'
import { getGoviewApp } from '@/utils/appInstance'

/**
 * * 动态注册组件
 */
export const componentInstall = <T> (key:string, node: T)  => {
  const app = getGoviewApp()
  if (app && !app.component(key) && node) {
    app.component(key, node)
  }
}

/**
 * * 异步加载组件
 * @param loader
 * @returns
 */
export const loadAsyncComponent = (loader: AsyncComponentLoader<any>) =>
  defineAsyncComponent({
    loader,
    loadingComponent: AsyncLoading,
    delay: 20,
  })
  
export const loadSkeletonAsyncComponent = (loader: AsyncComponentLoader<any>) =>
  defineAsyncComponent({
    loader,
    loadingComponent: AsyncSkeletonLoading,
    delay: 20,
  })
