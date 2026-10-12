/**
 * 边框共享常量
 * 从 BorderChartBase/config.vue 中提取的边框相关常量和选项
 */

// 边框类型下拉选项
export const borderTypeOptions = [
  { label: '边框-01（科技蓝）', value: 'Border01' },
  { label: '边框-02（渐变蓝）', value: 'Border02' },
  { label: '边框-03', value: 'Border03' },
  { label: '边框-04（带标题）', value: 'Border04' },
  { label: '边框-05', value: 'Border05' },
  { label: '边框-06（深蓝）', value: 'Border06' },
  { label: '边框-07', value: 'Border07' },
  { label: '边框-08', value: 'Border08' },
  { label: '边框-09', value: 'Border09' },
  { label: '边框-10', value: 'Border10' },
  { label: '边框-11', value: 'Border11' },
  { label: '边框-12', value: 'Border12' },
  { label: '边框-13', value: 'Border13' },
]

// 各边框类型默认 option 工厂函数 Map
export const borderDefaultOptions: Record<string, () => any> = {
  Border01: () => ({ dur: 0.5, colors: ['#4fd2dd', '#235fa7'], backgroundColor: '#00000000' }),
  Border02: () => ({ colors: ['#6586ec', '#2cf7fe'], backgroundColor: '#00000000' }),
  Border03: () => ({ colors: ['#7acaec', '#7acaec'], backgroundColor: '#00000000' }),
  Border04: () => ({ borderTitle: '', borderTitleWidth: 250, borderTitleHeight: 32, borderTitleSize: 18, borderTitleColor: '#fff', colors: ['#8aaafb', '#1f33a2'], backgroundColor: '#00000000' }),
  Border05: () => ({ dur: 2, colors: ['#3f96a5', '#3f96a5'], backgroundColor: '#00000000' }),
  Border06: () => ({ colors: ['#3140ad', '#1089ff'], backgroundColor: '#00000000' }),
  Border07: () => ({ colors: ['#1089BB', '#EB8146'], backgroundColor: '#00000000' }),
  Border08: () => ({ dur: 3, colors: ['#235fa7', '#4fd2dd'], backgroundColor: '#00000000' }),
  Border09: () => ({ colors: ['#7acaec', '#7acaec'], backgroundColor: '#00000000' }),
  Border10: () => ({ colors: ['#3f96a5', '#3f96a5'], backgroundColor: '#00000000' }),
  Border11: () => ({ colors: ['#8aaafb', '#1f33a2'], backgroundColor: '#00000000' }),
  Border12: () => ({ dur: 0.5, colors: ['#4fd2dd', '#235fa7'], backgroundColor: '#00000000' }),
  Border13: () => ({ colors: ['#6586ec', '#2cf7fe'], backgroundColor: '#00000000' }),
}

// 标题位置选项
export const titlePositionOptions = [
  { label: '左上角', value: 'left' },
  { label: '正上方', value: 'center' },
  { label: '右上角', value: 'right' },
]

// 字重选项
export const fontWeightOptions = [
  { label: '普通', value: 'normal' },
  { label: '粗体', value: 'bold' },
]

// 默认标题配置
export const defaultTitleConfig = {
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