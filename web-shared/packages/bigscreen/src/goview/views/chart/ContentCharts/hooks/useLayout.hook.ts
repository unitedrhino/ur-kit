import { computed, toRefs } from 'vue'

// 布局
import { useChartLayoutStore } from '@/store/modules/chartLayoutStore/chartLayoutStore'
// 样式
import { useDesignStore } from '@/store/modules/designStore/designStore'

// 全局颜色（懒计算，在 Pinia 初始化后才访问 store）
const themeColor = computed(() => useDesignStore().getAppTheme)

// 结构控制（懒访问）
const setItem = (...args: Parameters<ReturnType<typeof useChartLayoutStore>['setItem']>) =>
  useChartLayoutStore().setItem(...args)

const getCharts = computed(() => toRefs(useChartLayoutStore()).getCharts.value)

export {
  themeColor,
  setItem,
  getCharts
}
