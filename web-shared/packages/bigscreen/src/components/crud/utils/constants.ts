import { createOptionsAndMapping } from '@vben/saas';

export const menuTypeEnum = {
  DIRECTORY: '0',
  MENU: '1',
  BUTTON: '2',
} as const;

export const {
  options: typeOptions,
  mapping: typeMapping,
  mapping2: typeToColorMapping,
} = createOptionsAndMapping([
  [menuTypeEnum.DIRECTORY, 'system.dept.list', 'success'],
  [menuTypeEnum.MENU, 'system.dept.list', 'primary'],
  [menuTypeEnum.BUTTON, 'system.dept.list', 'warning'],
]);

export const { options: linkModeOptions, mapping: linkModeMapping } = createOptionsAndMapping([
  ['iframe', 'system.dept.list', 'error'],
  ['newWindow', 'system.dept.list', 'primary'],
]);

export const deviceTypeEnum = {
  DEVICE: 1,
  GATEWAY: 2,
  SUB_DEVICE: 3,
} as const;

export const {
  options: deviceTypeOptions,
  mapping: deviceTypeMapping,
  mapping2: deviceTypeToColorMapping,
} = createOptionsAndMapping([
  [deviceTypeEnum.DEVICE, '设备', 'success'],
  [deviceTypeEnum.GATEWAY, '网关', 'warning'],
  [deviceTypeEnum.SUB_DEVICE, '子设备', 'error'],
]);
