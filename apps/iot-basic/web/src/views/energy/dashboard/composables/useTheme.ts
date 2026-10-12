import { computed, provide, inject, ref, type InjectionKey, type Ref } from 'vue';
import { $t } from '@vben/locales';

export type DashboardThemeKey = 'vercel' | 'github' | 'tech' | 'gold';

export interface DashboardTheme {
  key: DashboardThemeKey;
  label: string;
  /** 主背景 */
  bg: string;
  /** 卡片背景渐变 (CSS gradient) */
  bgCard: string;
  /** 卡片边框 */
  cardBorder: string;
  /** 卡片内阴影 */
  cardInsetShadow: string;
  /** 主色调 */
  accent: string;
  /** 亮色调 */
  accentLight: string;
  /** 暗色调 */
  accentDark: string;
  /** 主文本 */
  text: string;
  /** 次文本 */
  textMuted: string;
  /** 弱文本 */
  textDim: string;
  /** 标题渐变 */
  titleGradient: string;
  /** 图标背景 */
  iconBg: string;
  /** 按钮背景 */
  btnBg: string;
  /** 按钮边框 */
  btnBorder: string;
  /** 按钮hover背景 */
  btnHoverBg: string;
  /** 按钮hover边框 */
  btnHoverBorder: string;
  /** 按钮文本 */
  btnText: string;
  /** 按钮active文本 */
  btnActiveText: string;
  /** 按钮active背景 */
  btnActiveBg: string;
  /** 面板头部边框 */
  panelHeadBorder: string;
  /** 闪烁网格颜色 */
  gridColor: string;
  /** ECharts: tooltip 背景 */
  tooltipBg: string;
  /** ECharts: tooltip 边框 */
  tooltipBorder: string;
  /** ECharts: tooltip 文本 */
  tooltipText: string;
  /** ECharts: 轴标签 */
  axisLabel: string;
  /** ECharts: 轴线 */
  axisLine: string;
  /** ECharts: 分割线 */
  splitLine: string;
  /** ECharts: 图表色板 (6+ 色) */
  chartColors: string[];
  /** ECharts: 区域渐变色 [top, mid, bottom] */
  areaGradient: [string, string, string];
  /** ECharts: 线条阴影 */
  lineShadow: string;
  /** ECharts: 标签文本 */
  chartLabel: string;
  /** ECharts: 饼图分割线 */
  pieBorderColor: string;
  /** ECharts: 中心文字 */
  centerText: string;
  /** ECharts: 中心小字 */
  centerSubText: string;
  /** 告警空状态图标 */
  alarmEmptyIcon: string;
  /** 告警条目背景 */
  alarmItemBg: string;
  /** 告警条目边框 */
  alarmItemBorder: string;
  /** 告警条目hover */
  alarmItemHover: string;
  /** 告警状态徽章色 */
  alarmBadge: string;
  /** 告警状态徽章背景 */
  alarmBadgeBg: string;
  /** 概览卡片背景 */
  overviewCardBg: string;
  /** 概览卡片边框 */
  overviewCardBorder: string;
  /** 概览卡片hover */
  overviewCardHover: string;
  /** 概览卡片图标背景 */
  overviewIconBg: string;
  /** 概览卡片数值 */
  overviewValue: string;
  /** 概览卡片标签 */
  overviewLabel: string;
  /** 概览卡片单位 */
  overviewUnit: string;
  /** 设备状态色（静态数据用，不在主题中） */
}

// ─── 主题定义 ──────────────────────────────────────

const vercelTheme: DashboardTheme = {
  key: 'vercel',
  label: $t('orgIotClient.energyDashboard.themeMinimal'),
  bg: '#000000',
  bgCard: 'linear-gradient(180deg, rgba(24,24,27,0.9) 0%, rgba(9,9,11,0.95) 100%)',
  cardBorder: 'rgba(63,63,70,0.4)',
  cardInsetShadow: '0 0 0 1px rgba(255,255,255,0.03) inset, 0 4px 16px rgba(0,0,0,0.4)',
  accent: '#ffffff',
  accentLight: '#e4e4e7',
  accentDark: '#a1a1aa',
  text: '#fafafa',
  textMuted: 'rgba(161,161,170,0.7)',
  textDim: 'rgba(161,161,170,0.5)',
  titleGradient: 'linear-gradient(90deg, #fafafa 0%, #a1a1aa 100%)',
  iconBg: 'rgba(255,255,255,0.08)',
  btnBg: 'rgba(255,255,255,0.04)',
  btnBorder: 'rgba(63,63,70,0.4)',
  btnHoverBg: 'rgba(255,255,255,0.08)',
  btnHoverBorder: 'rgba(63,63,70,0.6)',
  btnText: '#a1a1aa',
  btnActiveText: '#000000',
  btnActiveBg: 'rgba(255,255,255,0.9)',
  panelHeadBorder: 'rgba(63,63,70,0.2)',
  gridColor: '#3f3f46',
  tooltipBg: 'rgba(9,9,11,0.95)',
  tooltipBorder: 'rgba(63,63,70,0.4)',
  tooltipText: '#e4e4e7',
  axisLabel: 'rgba(161,161,170,0.6)',
  axisLine: 'rgba(63,63,70,0.3)',
  splitLine: 'rgba(63,63,70,0.15)',
  chartColors: ['#fafafa', '#a1a1aa', '#71717a', '#52525b', '#3f3f46', '#27272a'],
  areaGradient: ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.03)', 'rgba(255,255,255,0)'],
  lineShadow: 'rgba(255,255,255,0.15)',
  chartLabel: 'rgba(161,161,170,0.7)',
  pieBorderColor: '#09090b',
  centerText: '#fafafa',
  centerSubText: 'rgba(161,161,170,0.5)',
  alarmEmptyIcon: 'rgba(34,197,94,0.4)',
  alarmItemBg: 'rgba(255,255,255,0.02)',
  alarmItemBorder: 'rgba(63,63,70,0.2)',
  alarmItemHover: 'rgba(255,255,255,0.04)',
  alarmBadge: '#a1a1aa',
  alarmBadgeBg: 'rgba(161,161,170,0.1)',
  overviewCardBg: 'rgba(255,255,255,0.02)',
  overviewCardBorder: 'rgba(63,63,70,0.3)',
  overviewCardHover: 'rgba(255,255,255,0.04)',
  overviewIconBg: 'rgba(255,255,255,0.06)',
  overviewValue: '#fafafa',
  overviewLabel: 'rgba(161,161,170,0.8)',
  overviewUnit: 'rgba(161,161,170,0.5)',
};

const githubTheme: DashboardTheme = {
  key: 'github',
  label: $t('orgIotClient.energyDashboard.themeGalaxy'),
  bg: '#0d1117',
  bgCard: 'linear-gradient(180deg, rgba(22,27,34,0.9) 0%, rgba(13,17,23,0.95) 100%)',
  cardBorder: 'rgba(48,54,61,0.6)',
  cardInsetShadow: '0 0 0 1px rgba(255,255,255,0.02) inset, 0 4px 16px rgba(0,0,0,0.3)',
  accent: '#58a6ff',
  accentLight: '#79c0ff',
  accentDark: '#388bfd',
  text: '#c9d1d9',
  textMuted: 'rgba(139,148,158,0.7)',
  textDim: 'rgba(139,148,158,0.5)',
  titleGradient: 'linear-gradient(90deg, #c9d1d9 0%, #58a6ff 100%)',
  iconBg: 'rgba(88,166,255,0.1)',
  btnBg: 'rgba(88,166,255,0.06)',
  btnBorder: 'rgba(48,54,61,0.6)',
  btnHoverBg: 'rgba(88,166,255,0.12)',
  btnHoverBorder: 'rgba(88,166,255,0.3)',
  btnText: '#8b949e',
  btnActiveText: '#ffffff',
  btnActiveBg: 'rgba(88,166,255,0.8)',
  panelHeadBorder: 'rgba(48,54,61,0.3)',
  gridColor: '#21262d',
  tooltipBg: 'rgba(22,27,34,0.95)',
  tooltipBorder: 'rgba(48,54,61,0.6)',
  tooltipText: '#c9d1d9',
  axisLabel: 'rgba(139,148,158,0.6)',
  axisLine: 'rgba(48,54,61,0.4)',
  splitLine: 'rgba(48,54,61,0.2)',
  chartColors: ['#58a6ff', '#79c0ff', '#388bfd', '#1f6feb', '#1158c7', '#0d419d'],
  areaGradient: ['rgba(88,166,255,0.2)', 'rgba(88,166,255,0.05)', 'rgba(88,166,255,0)'],
  lineShadow: 'rgba(88,166,255,0.2)',
  chartLabel: 'rgba(139,148,158,0.7)',
  pieBorderColor: '#0d1117',
  centerText: '#c9d1d9',
  centerSubText: 'rgba(139,148,158,0.5)',
  alarmEmptyIcon: 'rgba(34,197,94,0.4)',
  alarmItemBg: 'rgba(255,255,255,0.02)',
  alarmItemBorder: 'rgba(48,54,61,0.3)',
  alarmItemHover: 'rgba(255,255,255,0.04)',
  alarmBadge: '#58a6ff',
  alarmBadgeBg: 'rgba(88,166,255,0.1)',
  overviewCardBg: 'rgba(88,166,255,0.03)',
  overviewCardBorder: 'rgba(48,54,61,0.4)',
  overviewCardHover: 'rgba(88,166,255,0.06)',
  overviewIconBg: 'rgba(88,166,255,0.1)',
  overviewValue: '#c9d1d9',
  overviewLabel: 'rgba(139,148,158,0.8)',
  overviewUnit: 'rgba(139,148,158,0.5)',
};

const techTheme: DashboardTheme = {
  key: 'tech',
  label: $t('orgIotClient.energyDashboard.themeTech'),
  bg: '#040d21',
  bgCard: 'linear-gradient(180deg, rgba(8,22,48,0.9) 0%, rgba(4,13,33,0.95) 100%)',
  cardBorder: 'rgba(0,180,216,0.15)',
  cardInsetShadow: '0 0 0 1px rgba(0,180,216,0.05) inset, 0 4px 16px rgba(0,0,0,0.4)',
  accent: '#00b4d8',
  accentLight: '#48cae4',
  accentDark: '#0096c7',
  text: '#caf0f8',
  textMuted: 'rgba(144,224,239,0.6)',
  textDim: 'rgba(144,224,239,0.4)',
  titleGradient: 'linear-gradient(90deg, #caf0f8 0%, #00b4d8 100%)',
  iconBg: 'rgba(0,180,216,0.12)',
  btnBg: 'rgba(0,180,216,0.06)',
  btnBorder: 'rgba(0,180,216,0.15)',
  btnHoverBg: 'rgba(0,180,216,0.12)',
  btnHoverBorder: 'rgba(0,180,216,0.3)',
  btnText: 'rgba(144,224,239,0.7)',
  btnActiveText: '#040d21',
  btnActiveBg: 'rgba(0,180,216,0.85)',
  panelHeadBorder: 'rgba(0,180,216,0.08)',
  gridColor: '#0077b6',
  tooltipBg: 'rgba(4,13,33,0.95)',
  tooltipBorder: 'rgba(0,180,216,0.3)',
  tooltipText: '#caf0f8',
  axisLabel: 'rgba(144,224,239,0.5)',
  axisLine: 'rgba(0,180,216,0.2)',
  splitLine: 'rgba(0,180,216,0.08)',
  chartColors: ['#48cae4', '#00b4d8', '#0096c7', '#0077b6', '#023e8a', '#03045e'],
  areaGradient: ['rgba(0,180,216,0.25)', 'rgba(0,180,216,0.06)', 'rgba(0,180,216,0)'],
  lineShadow: 'rgba(0,180,216,0.3)',
  chartLabel: 'rgba(144,224,239,0.6)',
  pieBorderColor: '#040d21',
  centerText: '#caf0f8',
  centerSubText: 'rgba(144,224,239,0.5)',
  alarmEmptyIcon: 'rgba(34,197,94,0.4)',
  alarmItemBg: 'rgba(0,180,216,0.03)',
  alarmItemBorder: 'rgba(0,180,216,0.1)',
  alarmItemHover: 'rgba(0,180,216,0.06)',
  alarmBadge: '#00b4d8',
  alarmBadgeBg: 'rgba(0,180,216,0.1)',
  overviewCardBg: 'rgba(0,180,216,0.04)',
  overviewCardBorder: 'rgba(0,180,216,0.12)',
  overviewCardHover: 'rgba(0,180,216,0.08)',
  overviewIconBg: 'rgba(0,180,216,0.12)',
  overviewValue: '#caf0f8',
  overviewLabel: 'rgba(144,224,239,0.7)',
  overviewUnit: 'rgba(144,224,239,0.4)',
};

const goldTheme: DashboardTheme = {
  key: 'gold',
  label: $t('orgIotClient.energyDashboard.themeGold'),
  bg: '#111113',
  bgCard: 'linear-gradient(180deg, rgba(30,22,10,0.85) 0%, rgba(17,14,8,0.9) 100%)',
  cardBorder: 'rgba(217,119,6,0.12)',
  cardInsetShadow: '0 0 0 1px rgba(245,158,11,0.03) inset, 0 4px 16px rgba(0,0,0,0.3)',
  accent: '#f59e0b',
  accentLight: '#fbbf24',
  accentDark: '#d97706',
  text: '#e4e4e7',
  textMuted: 'rgba(161,161,170,0.7)',
  textDim: 'rgba(161,161,170,0.5)',
  titleGradient: 'linear-gradient(90deg, #fafafa 0%, #f59e0b 100%)',
  iconBg: 'rgba(245,158,11,0.1)',
  btnBg: 'rgba(217,119,6,0.06)',
  btnBorder: 'rgba(217,119,6,0.15)',
  btnHoverBg: 'rgba(217,119,6,0.12)',
  btnHoverBorder: 'rgba(217,119,6,0.3)',
  btnText: '#d4a574',
  btnActiveText: '#111113',
  btnActiveBg: 'rgba(245,158,11,0.85)',
  panelHeadBorder: 'rgba(217,119,6,0.06)',
  gridColor: '#d97706',
  tooltipBg: 'rgba(24,24,27,0.95)',
  tooltipBorder: 'rgba(245,158,11,0.2)',
  tooltipText: '#e2e8f0',
  axisLabel: 'rgba(148,163,184,0.6)',
  axisLine: 'rgba(148,163,184,0.1)',
  splitLine: 'rgba(148,163,184,0.06)',
  chartColors: ['#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f'],
  areaGradient: ['rgba(245,158,11,0.2)', 'rgba(245,158,11,0.06)', 'rgba(245,158,11,0)'],
  lineShadow: 'rgba(245,158,11,0.25)',
  chartLabel: 'rgba(148,163,184,0.7)',
  pieBorderColor: '#18181b',
  centerText: '#f1f5f9',
  centerSubText: 'rgba(148,163,184,0.5)',
  alarmEmptyIcon: 'rgba(34,197,94,0.4)',
  alarmItemBg: 'rgba(255,255,255,0.03)',
  alarmItemBorder: 'rgba(255,255,255,0.04)',
  alarmItemHover: 'rgba(255,255,255,0.06)',
  alarmBadge: '#d97706',
  alarmBadgeBg: 'rgba(217,119,6,0.1)',
  overviewCardBg: 'rgba(217,119,6,0.04)',
  overviewCardBorder: 'rgba(217,119,6,0.1)',
  overviewCardHover: 'rgba(217,119,6,0.08)',
  overviewIconBg: 'rgba(245,158,11,0.1)',
  overviewValue: '#fafaf9',
  overviewLabel: 'rgba(212,165,116,0.8)',
  overviewUnit: 'rgba(212,165,116,0.5)',
};

export const DASHBOARD_THEMES: Record<DashboardThemeKey, DashboardTheme> = {
  vercel: vercelTheme,
  github: githubTheme,
  tech: techTheme,
  gold: goldTheme,
};

export const THEME_OPTIONS: { label: string; value: DashboardThemeKey }[] = [
  { label: $t('orgIotClient.energyDashboard.themeGalaxy'), value: 'github' },
  { label: $t('orgIotClient.energyDashboard.themeMinimal'), value: 'vercel' },
  { label: $t('orgIotClient.energyDashboard.themeTech'), value: 'tech' },
  { label: $t('orgIotClient.energyDashboard.themeGold'), value: 'gold' },
];

const THEME_STORAGE_KEY = 'energy-dashboard-theme';

const THEME_INJECT_KEY: InjectionKey<Ref<DashboardTheme>> = Symbol('dashboard-theme');

export function useDashboardThemeProvider() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY) as DashboardThemeKey | null;
  const themeKey = ref<DashboardThemeKey>(
    saved && saved in DASHBOARD_THEMES ? saved : 'github',
  );

  const theme = computed(() => DASHBOARD_THEMES[themeKey.value]);

  function setTheme(key: DashboardThemeKey) {
    themeKey.value = key;
    localStorage.setItem(THEME_STORAGE_KEY, key);
  }

  provide(THEME_INJECT_KEY, theme);

  return { themeKey, theme, setTheme };
}

export function useDashboardTheme(): Ref<DashboardTheme> {
  const theme = inject(THEME_INJECT_KEY);
  if (!theme) {
    // fallback: 未被 provide 时返回蓝色主题
    return ref(githubTheme) as Ref<DashboardTheme>;
  }
  return theme;
}
