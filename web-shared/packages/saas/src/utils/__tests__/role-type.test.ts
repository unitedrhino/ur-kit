import { describe, expect, it } from 'vitest';

import { canMutateRole, formatRoleTypeLabel, getRoleTypeOptions, getRoleTypeOptionsWithCurrent } from '../role-type';

describe('role type helpers', () => {
  it('formats known role types with chinese label and code', () => {
    expect(formatRoleTypeLabel('admin')).toBe('管理员（admin）');
    expect(formatRoleTypeLabel('supper')).toBe('超级管理员（supper）');
    expect(formatRoleTypeLabel('client')).toBe('C端用户（client）');
  });

  it('formats empty and unknown role types safely', () => {
    expect(formatRoleTypeLabel('')).toBe('未设置');
    expect(formatRoleTypeLabel('custom')).toBe('custom');
  });

  it('returns only valid create-time role type options', () => {
    expect(getRoleTypeOptions()).toEqual([
      { label: '管理员（admin）', value: 'admin' },
      { label: '超级管理员（supper）', value: 'supper' },
      { label: 'C端用户（client）', value: 'client' },
    ]);
  });

  it('does not expose empty role type values when merging the current value', () => {
    expect(getRoleTypeOptionsWithCurrent()).toEqual(getRoleTypeOptions());
    expect(getRoleTypeOptionsWithCurrent('')).toEqual(getRoleTypeOptions());
    expect(getRoleTypeOptionsWithCurrent(null)).toEqual(getRoleTypeOptions());
  });

  it('keeps an unknown non-empty current role type visible for edit forms', () => {
    expect(getRoleTypeOptionsWithCurrent('custom')).toEqual([{ label: 'custom', value: 'custom' }, ...getRoleTypeOptions()]);
  });

  it('allows only supper or owner to mutate roles', () => {
    expect(canMutateRole([])).toBe(false);
    expect(canMutateRole(['admin'])).toBe(false);
    expect(canMutateRole(['admin'], true)).toBe(true);
    expect(canMutateRole(['admin', 'supper'])).toBe(true);
  });
});
