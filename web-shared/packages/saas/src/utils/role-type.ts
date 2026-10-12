export interface RoleTypeOption {
  label: string;
  value: string;
}

const ROLE_TYPE_LABEL_MAP: Record<string, string> = {
  admin: '管理员',
  supper: '超级管理员',
  client: 'C端用户',
};

export function formatRoleTypeLabel(code: null | string = '') {
  const normalized = code || '';
  if (!normalized) {
    return '未设置';
  }
  const label = ROLE_TYPE_LABEL_MAP[normalized];
  return label ? `${label}（${normalized}）` : normalized;
}

export function getRoleTypeOptions(): RoleTypeOption[] {
  return [
    { label: formatRoleTypeLabel('admin'), value: 'admin' },
    { label: formatRoleTypeLabel('supper'), value: 'supper' },
    { label: formatRoleTypeLabel('client'), value: 'client' },
  ];
}

export function getRoleTypeOptionsWithCurrent(code: null | string = ''): RoleTypeOption[] {
  const options = getRoleTypeOptions();
  const normalized = code || '';
  if (!normalized || options.some((item) => item.value === normalized)) {
    return options;
  }
  return [{ label: formatRoleTypeLabel(normalized), value: normalized }, ...options];
}

export function canMutateRole(roleCodes: string[], isOwner = false) {
  return isOwner || roleCodes.includes('supper');
}
