import { GENERATED_ICON_DATA_URIS } from './generated-icon-data';

export const ICON_SET_PREFIX = 'tabler';
export const CUSTOM_ICON_PREFIX = 'ur';

export type AppIconName = `${typeof ICON_SET_PREFIX}:${string}` | `${typeof CUSTOM_ICON_PREFIX}:${string}`;

export interface AppIconOption {
  value: AppIconName;
  label: string;
  legacy?: string[];
}

export interface TabBarIconOption {
  pagePath: string;
  text: string;
  icon: AppIconName;
}

export const DEFAULT_ICON_NAME: AppIconName = 'tabler:layout-grid';

export const TAB_BAR_ICONS: TabBarIconOption[] = [
  { pagePath: 'pages/home/index', text: '首页', icon: 'tabler:home' },
  { pagePath: 'pages/device/index', text: '设备', icon: 'tabler:devices' },
  { pagePath: 'pages/scene/index', text: '场景', icon: 'tabler:home-bolt' },
  { pagePath: 'pages/mine/index', text: '我的', icon: 'tabler:user' },
];

export const COMMON_ICONS = {
  add: 'tabler:plus',
  back: 'tabler:chevron-left',
  buildingOff: 'tabler:building-off',
  check: 'tabler:check',
  chevronDown: 'tabler:chevron-down',
  chevronRight: 'tabler:chevron-right',
  close: 'tabler:x',
  copy: 'tabler:copy',
  eye: 'tabler:eye',
  eyeOff: 'tabler:eye-off',
  phone: 'tabler:phone',
  refresh: 'tabler:refresh',
  search: 'tabler:search',
  settings: 'tabler:settings',
} as const satisfies Record<string, AppIconName>;

export const SCENE_ICONS = {
  auto: 'tabler:bolt',
  manual: 'tabler:player-play',
  device: 'tabler:home',
  personalDevice: 'tabler:device-mobile',
  car: 'tabler:car',
  timer: 'tabler:clock',
  duration: 'tabler:hourglass',
  personalState: 'tabler:user',
  weather: 'tabler:cloud',
  notify: 'tabler:bell',
  scene: 'tabler:automation',
  nameCard: 'tabler:arrow-down-left',
} as const satisfies Record<string, AppIconName>;

export const AI_ICONS = {
  microphone: 'tabler:microphone',
  send: 'tabler:send',
} as const satisfies Record<string, AppIconName>;

export const BLUETOOTH_ICONS = {
  bluetooth: 'tabler:bluetooth',
  warning: 'tabler:alert-triangle',
  success: 'tabler:circle-check',
  failed: 'tabler:circle-x',
  wifi: 'tabler:wifi',
} as const satisfies Record<string, AppIconName>;

export const HOME_ICONS = {
  alarm: 'tabler:bell',
  camera: 'tabler:camera',
  addDevice: 'tabler:plus',
  refresh: 'tabler:refresh',
  familyManage: 'tabler:settings',
} as const satisfies Record<string, AppIconName>;

export const EMPTY_STATE_ICONS = {
  empty: 'tabler:inbox',
  noData: 'tabler:database-off',
  noDevice: 'tabler:devices-off',
  noNetwork: 'tabler:wifi-off',
  noScene: 'tabler:home-bolt',
} as const satisfies Record<string, AppIconName>;

export const AREA_ICONS: AppIconOption[] = [
  { value: 'tabler:armchair', label: '客厅', legacy: ['🛋️', '🛋'] },
  { value: 'tabler:bed', label: '卧室', legacy: ['🛏️', '🛏'] },
  { value: 'tabler:door', label: '玄关', legacy: ['🚪'] },
  { value: 'tabler:tools-kitchen-2', label: '厨房', legacy: ['🍳'] },
  { value: 'tabler:bath', label: '浴室', legacy: ['🚿'] },
  { value: 'ur:toilet', label: '卫生间', legacy: ['🚽'] },
  { value: 'tabler:books', label: '书房', legacy: ['📚'] },
  { value: 'tabler:bowl-spoon', label: '餐厅', legacy: ['🍽️', '🍽'] },
  { value: 'tabler:baby-carriage', label: '儿童房', legacy: ['👶'] },
  { value: 'tabler:wash-machine', label: '洗衣房', legacy: ['🧺'] },
  { value: 'tabler:car-garage', label: '车库', legacy: ['🚗'] },
  { value: 'tabler:plant', label: '阳台', legacy: ['🌳'] },
  { value: 'tabler:device-gamepad-2', label: '娱乐室', legacy: ['🎮'] },
  { value: 'tabler:briefcase', label: '办公室', legacy: ['💼'] },
  { value: 'tabler:archive', label: '储藏室', legacy: ['📦'] },
];

export const AREA_ICON_DEFAULT = AREA_ICONS[0].value;

export const LEGACY_AREA_ICON_MAP: Record<string, AppIconName> = AREA_ICONS.reduce(
  (map, item) => {
    item.legacy?.forEach((legacy) => {
      map[legacy] = item.value;
    });
    return map;
  },
  {} as Record<string, AppIconName>,
);

export function isAppIconName(value: string): value is AppIconName {
  return new RegExp(`^(${ICON_SET_PREFIX}|${CUSTOM_ICON_PREFIX}):[a-z0-9-]+$`).test(value);
}

export function normalizeIconName(value?: string, fallback: AppIconName = DEFAULT_ICON_NAME): AppIconName {
  const icon = (value || '').trim();
  if (!icon) return fallback;
  if (LEGACY_AREA_ICON_MAP[icon]) return LEGACY_AREA_ICON_MAP[icon];
  return isAppIconName(icon) ? icon : fallback;
}

export function normalizeAreaIcon(value?: string): AppIconName {
  return normalizeIconName(value, AREA_ICON_DEFAULT);
}

export function getIconStaticPath(value?: string): string {
  const icon = normalizeIconName(value);
  return `/static/icons/generated/${icon.replace(/:/g, '-')}.svg`;
}

export function getIconDataUri(value?: string): string {
  const icon = normalizeIconName(value);
  const iconDataUris = GENERATED_ICON_DATA_URIS as Record<string, string>;
  return iconDataUris[icon] || iconDataUris[DEFAULT_ICON_NAME] || getIconStaticPath(icon);
}

export function collectRegisteredIcons(): AppIconName[] {
  const iconSet = new Set<AppIconName>();
  const add = (icon: AppIconName) => iconSet.add(icon);

  TAB_BAR_ICONS.forEach((item) => add(item.icon));
  AREA_ICONS.forEach((item) => add(item.value));
  [
    COMMON_ICONS,
    SCENE_ICONS,
    AI_ICONS,
    BLUETOOTH_ICONS,
    HOME_ICONS,
    EMPTY_STATE_ICONS,
  ].forEach((group) => Object.values(group).forEach(add));
  add(DEFAULT_ICON_NAME);

  return Array.from(iconSet).sort();
}
