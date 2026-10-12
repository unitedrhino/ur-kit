import { describe, expect, it } from 'vitest';

import { relationTypeLabel } from '../graph';

describe('relationType presentation helpers', () => {
  it('maps relation type to chinese labels', () => {
    expect(relationTypeLabel('duplicate')).toBe('重复');
    expect(relationTypeLabel('similar')).toBe('相似');
    expect(relationTypeLabel('reference')).toBe('引用');
    expect(relationTypeLabel('')).toBe('关联');
  });
});
