/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import throttle from 'lodash/throttle'
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore'
import { EditCanvasTypeEnum } from '@/store/modules/chartEditStore/chartEditStore.type'
import { useSync } from '@/views/chart/hooks/useSync.hook'
import { ChartEnum } from '@/enums/pageEnum'
import { SavePageEnum } from '@/enums/editPageEnum'
import { editToJsonInterval } from '@/settings/designSetting'
import { goDialog } from '@/utils'

export const syncData = () => {
  const chartEditStore = useChartEditStore()
  goDialog({
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get message() { return editorT('bigscreenEditor.ui.overwriteSourceViewThisCannotBeUndone'); },
    isMaskClosable: true,
    transformOrigin: 'center',
    onPositiveCallback: () => {
      window['$message'].success(editorT('bigscreenEditor.ui.syncingEditor'))
      dispatchEvent(new CustomEvent(SavePageEnum.CHART, { detail: chartEditStore.getStorageInfo() }))
    }
  })
}

// 同步数据到预览页
export const syncDataToPreview = () => {
  const chartEditStore = useChartEditStore()
  dispatchEvent(new CustomEvent(SavePageEnum.CHART_TO_PREVIEW, { detail: chartEditStore.getStorageInfo() }))
}

// 侦听器更新
const useSyncUpdateHandle = () => {
  // 定义侦听器变量
  let timer: any
  const { updateComponent } = useSync()
  const chartEditStore = useChartEditStore()

  // 更新处理
  const updateFn = (e: any) => {
    window['$message'].success(editorT('bigscreenEditor.ui.updating'))
    updateComponent(e!.detail, true)
  }

  // 页面关闭处理
  const closeFn = () => {
    chartEditStore.setEditCanvas(EditCanvasTypeEnum.IS_CODE_EDIT, false)
  }

  // 开启侦听
  const use = () => {
    // 定时同步数据（暂不开启）
    // timer = setInterval(() => {
    //   // 窗口激活并且处于工作台
    //   document.hasFocus() && syncData()
    // }, editToJsonInterval)

    // 失焦同步数据
    addEventListener('blur', syncDataToPreview)

    // 监听编辑器保存事件 刷新工作台图表
    addEventListener(SavePageEnum.JSON, updateFn)

    // 监听编辑页关闭
    addEventListener(SavePageEnum.CLOSE, throttle(closeFn, 1000))
  }

  // 关闭侦听
  const unUse = () => {
    // clearInterval(timer)
    removeEventListener('blur', syncDataToPreview)
    removeEventListener(SavePageEnum.JSON, updateFn)
  }

  // 路由变更时处理
  const watchHandler = (toName: any, fromName: any) => {
    if (fromName == ChartEnum.CHART_HOME_NAME) {
      unUse()
    }
    if (toName == ChartEnum.CHART_HOME_NAME) {
      use()
    }
  }

  return watchHandler
}

export const useSyncUpdate = () => {
  const routerParamsInfo = useRoute()
  watch(() => routerParamsInfo.name, useSyncUpdateHandle(), { immediate: true })
}
